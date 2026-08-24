# MiMo Browser v4 — container image
# One-command deploy:
#   docker build -t mimo-browser .
#   docker run -p 8080:8080 mimo-browser
# Optional real-AI (env-gated, never required to run):
#   docker run -p 8080:8080 -e DEEPSEEK_API_KEY=sk-... mimo-browser
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps for Playwright chromium
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl gnupg fonts-liberation libnss3 libnspr4 libatk1.0-0 \
        libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 libxcomposite1 \
        libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 libpango-1.0-0 \
        libcairo2 libatspi2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install -r requirements.txt \
    && playwright install chromium

COPY . .

EXPOSE 8080

CMD ["python", "-m", "mimo_browser_v4.main", "--host", "0.0.0.0", "--port", "8080"]
