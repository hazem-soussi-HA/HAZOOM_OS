# API Overview

The Hazoom OS REST API allows you to integrate LLM training and generation into any application. It is built on `FastAPI` for high performance and automatic documentation.

## 📡 Connection Details

- **Default Port**: 8000
- **Base URL**: `http://localhost:8000`
- **Docs URL**: `http://localhost:8000/docs` (Swagger UI)

## 🛠️ Key Capabilities

- **Training Management**: Start, monitor, and stop training jobs remotely.
- **Model Deployment**: Switch models in production without downtime.
- **Inference**: High-speed text generation with streaming support.
- **System Monitoring**: Get real-time health and resource metrics.

## 📦 Request Format

All API requests expect `Content-Type: application/json`.

## 🔄 Response Format

Success responses follow this pattern:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-01-19T12:00:00Z"
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error description",
  "code": 400
}
```

---
[Home](Home.md) | [Model Architectures](ModelArchitectures.md) | [Endpoints](Endpoints.md)
