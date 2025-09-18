FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends espeak-ng ffmpeg curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py ./server.py

ENV PIPER_VOICE=en_US-ryan-low \
    PIPER_LANGUAGE=en \
    PIPER_MODEL_URL= \
    PIPER_CONFIG_URL= \
    PIPER_CACHE_DIR=/app/models \
    PIPER_PORT=5001 \
    PIPER_BINARY=piper

RUN mkdir -p /app/models

EXPOSE 5001

CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${PIPER_PORT:-5001}"]
