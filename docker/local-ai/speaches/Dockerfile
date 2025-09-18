FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    SPEACHES_PORT=5005 \
    SPEACHES_MODEL_DIR=/app/models \
    SPEACHES_TTS_MODELS="speaches-ai/piper-en_US-ryan-low speaches-ai/piper-de_DE-thorsten-low" \
    SPEACHES_STT_MODEL=tiny.en \
    SPEACHES_WHISPER_DEVICE=cpu \
    SPEACHES_WHISPER_COMPUTE=int8 \
    SPEACHES_WHISPER_WORKERS=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        espeak-ng \
        ffmpeg \
        curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py ./server.py
COPY download_models.py ./download_models.py
COPY entrypoint.sh ./entrypoint.sh

RUN chmod +x /app/entrypoint.sh

RUN mkdir -p /app/models/tts /app/models/stt

EXPOSE 5005

ENTRYPOINT ["/app/entrypoint.sh"]
