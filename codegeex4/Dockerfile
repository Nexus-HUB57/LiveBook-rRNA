# ═══════════════════════════════════════════════════════════════
# CodeGeeX4 — OpenAI-Compatible API Server
# ═══════════════════════════════════════════════════════════════
# Based on: github.com/zai-org/CodeGeeX4 (local_mode/)
# Exposes /v1/chat/completions with streaming + function calling
# ═══════════════════════════════════════════════════════════════

FROM python:3.11-slim AS base

# System deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python deps (torch with CUDA support for GPU inference)
RUN pip install --no-cache-dir \
    torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121 \
    && pip install --no-cache-dir \
    transformers \
    accelerate \
    sentencepiece \
    fastapi \
    uvicorn \
    shortuuid \
    pydantic

WORKDIR /app

# Copy CodeGeeX4 local_mode source
# Mount model weights to /models via docker-compose volume
COPY local_mode/ ./local_mode/

# Model path (override with CODEGEEX_MODEL_PATH env var)
ENV CODEGEEX_MODEL_PATH=/models
ENV CODEGEEX_HOST=0.0.0.0
ENV CODEGEEX_PORT=8000

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/v1/models')"

CMD ["python3", "-m", "uvicorn", "local_mode.main:app", \
     "--host", "0.0.0.0", "--port", "8000"]
