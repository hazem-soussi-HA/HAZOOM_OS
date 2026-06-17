# Authentication & Security

In Production mode, Hazoom OS implements strictly enforced security protocols to protect your models and data.

## 🔑 API Keys

Access to the API requires an `X-API-Key` header. In a default setup, keys are managed in the `config/security.json` file.

```bash
curl -H "X-API-Key: your_secret_key" http://localhost:8000/status
```

## 🛡️ Security Features

### Rate Limiting
The API limits requests per minute (RPM) to prevent DoS attacks. The default limit is 100 RPM per client.

### Input Sanitization
All prompts sent to the `/generate` endpoint are scanned for malicious injections and unwanted command patterns.

### Audit Logging
Every request, successful or failed, is logged with the timestamp, client ID, and endpoint accessed. Logs are stored in `logs/audit.log`.

### SSL Enforcement
In production, the `APIServer` will reject unencrypted HTTP traffic and require HTTPS.

---
[Home](Home.md) | [Endpoints](Endpoints.md) | [API Examples](APIExamples.md)
