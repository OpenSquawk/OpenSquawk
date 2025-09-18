#!/bin/sh
set -euo pipefail

python /app/download_models.py
exec uvicorn server:app --host 0.0.0.0 --port "${SPEACHES_PORT:-5005}"
