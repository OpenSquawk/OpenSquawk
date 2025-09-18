from __future__ import annotations

import base64
import binascii
import logging
import math
import os
import shutil
import subprocess
from dataclasses import dataclass
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Dict, Iterable, List, Optional, Tuple

import requests
from fastapi import FastAPI, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import Response
from pydantic import BaseModel
from faster_whisper import WhisperModel

LOGGER = logging.getLogger("speaches")
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="OpenSquawk Speaches Service")

MODEL_ROOT = Path(os.getenv("SPEACHES_MODEL_DIR", "/app/models"))
TTS_DIR = MODEL_ROOT / "tts"
STT_DIR = MODEL_ROOT / "stt"

DEFAULT_TTS_MODELS = [
    m.strip() for m in os.getenv("SPEACHES_TTS_MODELS", "speaches-ai/piper-en_US-ryan-low").split() if m.strip()
]
DEFAULT_STT_MODEL = os.getenv("SPEACHES_STT_MODEL", "tiny.en").strip() or "tiny.en"

WHISPER_DEVICE = os.getenv("SPEACHES_WHISPER_DEVICE", "cpu").strip() or "cpu"
WHISPER_COMPUTE = os.getenv("SPEACHES_WHISPER_COMPUTE", "int8").strip() or "int8"
WHISPER_WORKERS = int(os.getenv("SPEACHES_WHISPER_WORKERS", "1"))
WHISPER_BEAM_SIZE = int(os.getenv("SPEACHES_WHISPER_BEAM_SIZE", "5"))
WHISPER_BEST_OF = int(os.getenv("SPEACHES_WHISPER_BEST_OF", "5"))
WHISPER_LANGUAGE = os.getenv("SPEACHES_WHISPER_LANGUAGE", "").strip() or None
WHISPER_TEMPERATURE = float(os.getenv("SPEACHES_WHISPER_TEMPERATURE", "0"))
WHISPER_VAD = os.getenv("SPEACHES_WHISPER_VAD", "false").strip().lower() in {"1", "true", "yes", "on"}
WHISPER_PROMPT = os.getenv("SPEACHES_WHISPER_PROMPT", "").strip() or None

PIPER_BINARY = os.getenv("SPEACHES_PIPER_BINARY", "piper").strip() or "piper"

_tts_cache: Dict[str, "TTSModelPaths"] = {}
_whisper_cache: Dict[str, WhisperModel] = {}


@dataclass
class TTSModelPaths:
    model_path: Path
    config_path: Path
    voice_name: str


class SpeechRequest(BaseModel):
    input: str
    model: Optional[str] = None
    voice: Optional[str] = None
    response_format: Optional[str] = None
    speed: Optional[float] = None
    length_scale: Optional[float] = None
    noise_scale: Optional[float] = None
    noise_w: Optional[float] = None
    speaker_id: Optional[int] = None


class TranscriptionSegment(BaseModel):
    id: int
    start: float
    end: float
    text: str


class TranscriptionRequest(BaseModel):
    audio: Optional[str] = None
    format: Optional[str] = None
    model: Optional[str] = None
    language: Optional[str] = None
    prompt: Optional[str] = None
    temperature: Optional[float] = None
    vad_filter: Optional[bool] = None


class TranscriptionResponse(BaseModel):
    text: str
    language: str
    duration: float
    segments: List[TranscriptionSegment]


def _ensure_dirs() -> None:
    TTS_DIR.mkdir(parents=True, exist_ok=True)
    STT_DIR.mkdir(parents=True, exist_ok=True)


def _download_file(url: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    LOGGER.info("Downloading %s -> %s", url, destination)
    response = requests.get(url, stream=True, timeout=300)
    try:
        response.raise_for_status()
    except Exception as exc:  # pylint: disable=broad-except
        raise RuntimeError(f"failed to download {url}: {exc}") from exc

    with NamedTemporaryFile(delete=False) as tmp_file:
        for chunk in response.iter_content(chunk_size=1_048_576):
            if chunk:
                tmp_file.write(chunk)
        tmp_path = Path(tmp_file.name)
    tmp_path.replace(destination)


def _resolve_tts_model(model_id: str) -> Tuple[str, Path, Path, str]:
    clean_id = model_id.strip()
    if not clean_id:
        raise RuntimeError("model id must not be empty")
    voice_name = clean_id.split("/")[-1]
    model_path = TTS_DIR / f"{voice_name}.onnx"
    config_path = TTS_DIR / f"{voice_name}.onnx.json"

    if model_path.exists() and config_path.exists():
        return clean_id, model_path, config_path, voice_name

    if clean_id.count("/") == 0:
        raise RuntimeError(
            "TTS model id should include HuggingFace repo, e.g. 'speaches-ai/piper-en_US-ryan-low'"
        )

    base_url = f"https://huggingface.co/{clean_id}/resolve/main"
    _download_file(f"{base_url}/model.onnx", model_path)
    _download_file(f"{base_url}/model.onnx.json", config_path)
    return clean_id, model_path, config_path, voice_name


def ensure_tts_model(model_id: str) -> TTSModelPaths:
    if model_id in _tts_cache:
        return _tts_cache[model_id]
    _, model_path, config_path, voice_name = _resolve_tts_model(model_id)
    _tts_cache[model_id] = TTSModelPaths(model_path=model_path, config_path=config_path, voice_name=voice_name)
    return _tts_cache[model_id]


def _ensure_binary() -> str:
    binary_path = shutil.which(PIPER_BINARY) if PIPER_BINARY else None
    if not binary_path:
        raise RuntimeError(f"piper binary '{PIPER_BINARY}' not found in PATH")
    return binary_path


def _speed_to_length_scale(speed: Optional[float]) -> Optional[float]:
    if speed is None:
        return None
    clamped = max(0.25, min(4.0, speed))
    if math.isclose(clamped, 1.0, rel_tol=1e-3):
        return 1.0
    return 1.0 / clamped


def _convert_audio(wav_bytes: bytes, response_format: str) -> Tuple[bytes, str]:
    fmt = response_format.lower()
    if fmt == "wav":
        return wav_bytes, "audio/wav"

    ext_map = {
        "mp3": (".mp3", ["-ar", "22050", "-ac", "1"]),
        "flac": (".flac", []),
        "pcm": (".pcm", ["-f", "s16le", "-acodec", "pcm_s16le", "-ac", "1"]),
    }
    if fmt not in ext_map:
        raise RuntimeError(f"unsupported response_format '{response_format}'")

    suffix, extra_args = ext_map[fmt]
    with NamedTemporaryFile(delete=False, suffix=".wav") as tmp_in:
        tmp_in.write(wav_bytes)
        tmp_in.flush()
        tmp_in_path = Path(tmp_in.name)

    with NamedTemporaryFile(delete=False, suffix=suffix) as tmp_out:
        tmp_out_path = Path(tmp_out.name)

    cmd = [
        "ffmpeg",
        "-y",
        "-i",
        str(tmp_in_path),
        *extra_args,
        str(tmp_out_path),
    ]

    process = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
    try:
        if process.returncode != 0:
            stderr_text = process.stderr.decode("utf-8", errors="ignore")
            stdout_text = process.stdout.decode("utf-8", errors="ignore")
            raise RuntimeError(stderr_text or stdout_text or "ffmpeg failed to convert audio")
        data = tmp_out_path.read_bytes()
        mime = {
            "mp3": "audio/mpeg",
            "flac": "audio/flac",
            "pcm": "audio/L16",
        }[fmt]
        return data, mime
    finally:
        tmp_in_path.unlink(missing_ok=True)
        tmp_out_path.unlink(missing_ok=True)


def _synthesize_sync(request: SpeechRequest) -> Tuple[bytes, str, str]:
    text = (request.input or "").strip()
    if not text:
        raise RuntimeError("input text is required")

    fallback_model = DEFAULT_TTS_MODELS[0] if DEFAULT_TTS_MODELS else ""
    model_id = (request.model or fallback_model).strip()
    if not model_id:
        raise RuntimeError("no TTS model configured")

    model_paths = ensure_tts_model(model_id)
    voice_name = request.voice.strip() if request.voice else model_paths.voice_name
    if voice_name != model_paths.voice_name:
        raise RuntimeError(
            f"voice '{voice_name}' not available for model '{model_id}' (available: {model_paths.voice_name})"
        )

    binary = _ensure_binary()

    with NamedTemporaryFile(delete=False, suffix=".wav") as tmp_out:
        output_path = Path(tmp_out.name)

    cmd = [
        binary,
        "--model",
        str(model_paths.model_path),
        "--config",
        str(model_paths.config_path),
        "--output_file",
        str(output_path),
    ]

    length_scale = request.length_scale if request.length_scale is not None else _speed_to_length_scale(request.speed)
    if length_scale is not None:
        cmd.extend(["--length_scale", f"{length_scale:.4f}"])
    if request.noise_scale is not None:
        cmd.extend(["--noise_scale", f"{request.noise_scale:.4f}"])
    if request.noise_w is not None:
        cmd.extend(["--noise_w", f"{request.noise_w:.4f}"])
    if request.speaker_id is not None:
        cmd.extend(["--speaker", str(request.speaker_id)])

    process = subprocess.run(
        cmd,
        input=text.encode("utf-8"),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )

    try:
        if process.returncode != 0:
            stderr_text = process.stderr.decode("utf-8", errors="ignore")
            stdout_text = process.stdout.decode("utf-8", errors="ignore")
            raise RuntimeError(stderr_text or stdout_text or "piper exited with an error")

        audio_bytes = output_path.read_bytes()
        response_format = (request.response_format or "mp3").lower()
        converted, mime = _convert_audio(audio_bytes, response_format)
        return converted, mime, model_id
    finally:
        output_path.unlink(missing_ok=True)


def ensure_whisper_model(model_id: str) -> WhisperModel:
    clean_id = model_id.strip() or DEFAULT_STT_MODEL
    if clean_id in _whisper_cache:
        return _whisper_cache[clean_id]

    kwargs = {
        "device": WHISPER_DEVICE,
        "compute_type": WHISPER_COMPUTE,
        "num_workers": WHISPER_WORKERS,
    }
    if STT_DIR:
        kwargs["download_root"] = str(STT_DIR)
    model = WhisperModel(clean_id, **kwargs)
    _whisper_cache[clean_id] = model
    return model


def prewarm_models(models: Optional[Iterable[str]] = None) -> None:
    _ensure_dirs()
    target_models = list(models) if models is not None else DEFAULT_TTS_MODELS
    for model_id in target_models:
        try:
            ensure_tts_model(model_id)
        except Exception as exc:  # pylint: disable=broad-except
            LOGGER.error("Failed to preload TTS model %s: %s", model_id, exc)

    try:
        ensure_whisper_model(DEFAULT_STT_MODEL)
    except Exception as exc:  # pylint: disable=broad-except
        LOGGER.error("Failed to preload STT model %s: %s", DEFAULT_STT_MODEL, exc)


@app.on_event("startup")
def _startup_event() -> None:
    prewarm_models()


@app.get("/healthz")
def healthcheck() -> Dict[str, str]:
    try:
        prewarm_models()
    except Exception as exc:  # pylint: disable=broad-except
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"status": "ok"}


@app.post("/v1/audio/speech")
async def synthesize(request: SpeechRequest) -> Response:
    try:
        audio, mime, model_id = await run_in_threadpool(_synthesize_sync, request)
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pylint: disable=broad-except
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    headers = {"x-model-id": model_id}
    return Response(content=audio, media_type=mime, headers=headers)


@app.post("/v1/audio/transcriptions", response_model=TranscriptionResponse)
def transcribe(request: TranscriptionRequest) -> TranscriptionResponse:
    audio_b64 = (request.audio or "").strip()
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

        model_id = request.model.strip() if request.model else DEFAULT_STT_MODEL
        model = ensure_whisper_model(model_id)

        segments, info = model.transcribe(
            str(tmp_path),
            beam_size=WHISPER_BEAM_SIZE,
            best_of=WHISPER_BEST_OF,
            language=request.language or WHISPER_LANGUAGE,
            temperature=request.temperature if request.temperature is not None else WHISPER_TEMPERATURE,
            vad_filter=request.vad_filter if request.vad_filter is not None else WHISPER_VAD,
            initial_prompt=request.prompt or WHISPER_PROMPT,
        )

        segment_list = list(segments)
        text = "".join(segment.text for segment in segment_list).strip()
        if not text:
            raise HTTPException(status_code=400, detail="transcription result empty")

        return TranscriptionResponse(
            text=text,
            language=info.language or (request.language or WHISPER_LANGUAGE or ""),
            duration=info.duration or 0.0,
            segments=[
                TranscriptionSegment(id=index, start=segment.start, end=segment.end, text=segment.text)
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


if __name__ == "__main__":
    prewarm_models()
