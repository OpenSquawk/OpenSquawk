from __future__ import annotations

import base64
import binascii
import os
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from faster_whisper import WhisperModel

app = FastAPI(title="OpenSquawk Whisper Service")


def _str_to_bool(value: Optional[str], default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


class Segment(BaseModel):
    id: int
    start: float
    end: float
    text: str


class TranscriptionRequest(BaseModel):
    audio: str
    format: Optional[str] = None
    language: Optional[str] = None
    prompt: Optional[str] = None
    temperature: Optional[float] = None
    vad_filter: Optional[bool] = None


class TranscriptionResponse(BaseModel):
    text: str
    language: str
    duration: float
    segments: List[Segment]


_model: WhisperModel | None = None


def _load_model() -> WhisperModel:
    global _model
    if _model is not None:
        return _model

    model_name = os.getenv("WHISPER_MODEL", "tiny.en").strip() or "tiny.en"
    device = os.getenv("WHISPER_DEVICE", "cpu").strip() or "cpu"
    compute_type = os.getenv("WHISPER_COMPUTE_TYPE", "int8").strip() or "int8"
    download_root = os.getenv("WHISPER_MODEL_DIR", "").strip()
    num_workers = int(os.getenv("WHISPER_WORKERS", "1"))

    extra_args = {}
    if download_root:
        Path(download_root).mkdir(parents=True, exist_ok=True)
        extra_args["download_root"] = download_root

    _model = WhisperModel(
        model_name,
        device=device,
        compute_type=compute_type,
        num_workers=num_workers,
        **extra_args,
    )
    return _model


BEAM_SIZE = int(os.getenv("WHISPER_BEAM_SIZE", "5"))
BEST_OF = int(os.getenv("WHISPER_BEST_OF", "5"))
DEFAULT_LANGUAGE = os.getenv("WHISPER_LANGUAGE", "").strip() or None
DEFAULT_TEMPERATURE = float(os.getenv("WHISPER_TEMPERATURE", "0"))
DEFAULT_VAD = _str_to_bool(os.getenv("WHISPER_VAD_FILTER"), False)
DEFAULT_PROMPT = os.getenv("WHISPER_PROMPT", "").strip() or None


@app.get("/healthz")
def healthcheck() -> dict[str, str]:
    _load_model()
    return {"status": "ok"}


@app.post("/v1/audio/transcriptions", response_model=TranscriptionResponse)
def transcribe(request: TranscriptionRequest) -> TranscriptionResponse:
    audio_b64 = request.audio.strip() if request.audio else ""
    if not audio_b64:
        raise HTTPException(status_code=400, detail="audio payload is required")

    try:
        audio_bytes = base64.b64decode(audio_b64, validate=True)
    except (binascii.Error, ValueError) as exc:
        raise HTTPException(status_code=400, detail=f"invalid base64 audio: {exc}") from exc

    suffix = f".{request.format.strip()}" if request.format else ".wav"
    tmp_path: Optional[Path] = None

    try:
        with NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
            tmp_file.write(audio_bytes)
            tmp_file.flush()
            tmp_path = Path(tmp_file.name)

        model = _load_model()
        segments, info = model.transcribe(
            str(tmp_path),
            beam_size=BEAM_SIZE,
            best_of=BEST_OF,
            language=request.language or DEFAULT_LANGUAGE,
            temperature=request.temperature if request.temperature is not None else DEFAULT_TEMPERATURE,
            vad_filter=request.vad_filter if request.vad_filter is not None else DEFAULT_VAD,
            initial_prompt=request.prompt or DEFAULT_PROMPT,
        )

        segment_list = list(segments)
        text = "".join(segment.text for segment in segment_list).strip()

        return TranscriptionResponse(
            text=text,
            language=info.language or (request.language or DEFAULT_LANGUAGE or ""),
            duration=info.duration or 0.0,
            segments=[
                Segment(id=index, start=segment.start, end=segment.end, text=segment.text)
                for index, segment in enumerate(segment_list)
            ],
        )
    except HTTPException:
        raise
    except Exception as exc:  # pylint: disable=broad-except
        raise HTTPException(status_code=500, detail=f"transcription failed: {exc}") from exc
    finally:
        if tmp_path and tmp_path.exists():
            tmp_path.unlink(missing_ok=True)
