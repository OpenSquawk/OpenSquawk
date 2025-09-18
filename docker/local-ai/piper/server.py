from __future__ import annotations

import math
import os
import shutil
import subprocess
from pathlib import Path
from tempfile import NamedTemporaryFile
from typing import Optional

import requests
from fastapi import FastAPI, HTTPException
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import Response
from pydantic import BaseModel

app = FastAPI(title="OpenSquawk Piper Service")


class SpeechRequest(BaseModel):
    text: str
    voice: Optional[str] = None
    speed: Optional[float] = None
    length_scale: Optional[float] = None
    noise_scale: Optional[float] = None
    noise_w: Optional[float] = None
    speaker_id: Optional[int] = None


VOICE_NAME = os.getenv("PIPER_VOICE", "en_US-ryan-low").strip() or "en_US-ryan-low"
LANGUAGE_CODE = os.getenv("PIPER_LANGUAGE", "en").strip() or "en"
CACHE_DIR = Path(os.getenv("PIPER_CACHE_DIR", "/app/models"))
CACHE_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = Path(os.getenv("PIPER_MODEL_PATH", CACHE_DIR / f"{VOICE_NAME}.onnx"))
CONFIG_PATH = Path(os.getenv("PIPER_CONFIG_PATH", CACHE_DIR / f"{VOICE_NAME}.onnx.json"))

DEFAULT_MODEL_URL = (
    f"https://huggingface.co/rhasspy/piper-voices/resolve/main/{LANGUAGE_CODE}/{VOICE_NAME}.onnx?download=1"
)
DEFAULT_CONFIG_URL = (
    f"https://huggingface.co/rhasspy/piper-voices/resolve/main/{LANGUAGE_CODE}/{VOICE_NAME}.onnx.json?download=1"
)

MODEL_URL = os.getenv("PIPER_MODEL_URL", DEFAULT_MODEL_URL).strip() or DEFAULT_MODEL_URL
CONFIG_URL = os.getenv("PIPER_CONFIG_URL", DEFAULT_CONFIG_URL).strip() or DEFAULT_CONFIG_URL
PIPER_BINARY = os.getenv("PIPER_BINARY", "piper").strip() or "piper"


@app.get("/healthz")
def healthcheck() -> dict[str, str]:
    try:
        _ensure_voice_files()
        _ensure_binary()
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return {"status": "ok"}


def _ensure_voice_files() -> None:
    if MODEL_PATH.exists() and CONFIG_PATH.exists():
        return

    CACHE_DIR.mkdir(parents=True, exist_ok=True)

    if not MODEL_PATH.exists():
        _download_file(MODEL_URL, MODEL_PATH)

    if not CONFIG_PATH.exists():
        _download_file(CONFIG_URL, CONFIG_PATH)


def _download_file(url: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    response = requests.get(url, stream=True, timeout=120)
    try:
        response.raise_for_status()
    except Exception as exc:  # pylint: disable=broad-except
        raise RuntimeError(f"failed to download {url}: {exc}") from exc

    with NamedTemporaryFile(delete=False) as tmp_file:
        for chunk in response.iter_content(chunk_size=1_048_576):
            if chunk:
                tmp_file.write(chunk)
        tmp_name = tmp_file.name

    Path(tmp_name).replace(destination)


def _ensure_binary() -> str:
    binary_path = shutil.which(PIPER_BINARY) if PIPER_BINARY else None
    if not binary_path:
        raise RuntimeError(f"piper binary '{PIPER_BINARY}' not found in PATH")
    return binary_path


def _speed_to_length_scale(speed: Optional[float]) -> Optional[float]:
    if speed is None:
        return None
    clamped = max(0.25, min(4.0, speed))
    # Piper uses length_scale where lower numbers are faster
    # Map speed=1.0 -> length_scale=1.0, >1 faster -> smaller scale
    if math.isclose(clamped, 1.0, rel_tol=1e-3):
        return 1.0
    return 1.0 / clamped


def _synthesize_sync(
    text: str,
    length_scale: Optional[float],
    noise_scale: Optional[float],
    noise_w: Optional[float],
    speaker_id: Optional[int],
) -> bytes:
    _ensure_voice_files()
    binary = _ensure_binary()

    with NamedTemporaryFile(delete=False, suffix=".wav") as tmp_out:
        output_path = Path(tmp_out.name)

    cmd = [
        binary,
        "--model",
        str(MODEL_PATH),
        "--config",
        str(CONFIG_PATH),
        "--output_file",
        str(output_path),
    ]

    if speaker_id is not None:
        cmd.extend(["--speaker", str(speaker_id)])
    if length_scale is not None:
        cmd.extend(["--length_scale", f"{length_scale:.4f}"])
    if noise_scale is not None:
        cmd.extend(["--noise_scale", f"{noise_scale:.4f}"])
    if noise_w is not None:
        cmd.extend(["--noise_w", f"{noise_w:.4f}"])

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
            raise RuntimeError(stderr_text or stdout_text or "piper exited with a non-zero status")

        audio_bytes = output_path.read_bytes()
        return audio_bytes
    finally:
        output_path.unlink(missing_ok=True)


@app.post("/v1/audio/speech")
async def synthesize(request: SpeechRequest) -> Response:
    text = (request.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")

    if request.voice and request.voice != VOICE_NAME:
        raise HTTPException(
            status_code=400,
            detail=f"voice '{request.voice}' not available (configured voice: {VOICE_NAME})",
        )

    try:
        length_scale = request.length_scale if request.length_scale is not None else _speed_to_length_scale(request.speed)
        audio = await run_in_threadpool(
            _synthesize_sync,
            text,
            length_scale,
            request.noise_scale,
            request.noise_w,
            request.speaker_id,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    return Response(content=audio, media_type="audio/wav")


