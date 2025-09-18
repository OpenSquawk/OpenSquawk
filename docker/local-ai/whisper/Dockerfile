FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY server.py ./server.py

ENV WHISPER_PORT=9000

EXPOSE 9000

CMD ["sh", "-c", "uvicorn server:app --host 0.0.0.0 --port ${WHISPER_PORT:-9000}"]
