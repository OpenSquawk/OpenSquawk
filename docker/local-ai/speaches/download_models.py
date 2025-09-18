from __future__ import annotations

import sys

from server import DEFAULT_TTS_MODELS, DEFAULT_STT_MODEL, ensure_tts_model, ensure_whisper_model, prewarm_models


def main() -> None:
    success = True

    for model_id in DEFAULT_TTS_MODELS:
        try:
            ensure_tts_model(model_id)
        except Exception as exc:  # pylint: disable=broad-except
            print(f"[speaches] failed to ensure TTS model {model_id}: {exc}", file=sys.stderr)
            success = False

    try:
        ensure_whisper_model(DEFAULT_STT_MODEL)
    except Exception as exc:  # pylint: disable=broad-except
        print(f"[speaches] failed to ensure STT model {DEFAULT_STT_MODEL}: {exc}", file=sys.stderr)
        success = False

    if not success:
        # fallback: attempt to continue but indicate failure to caller
        sys.exit(1)


if __name__ == "__main__":
    prewarm_models()
    main()
