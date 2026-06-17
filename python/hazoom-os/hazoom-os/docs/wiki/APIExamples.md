# API Usage Examples

## 🐍 Python Example (Requests)

```python
import requests

BASE_URL = "http://localhost:8000"
API_KEY = "your_secret_key"
HEADERS = {"X-API-Key": API_KEY, "Content-Type": "application/json"}

# 1. Start Training
training_data = {
    "model_name": "gpt-4",
    "dataset_path": "data/science.txt",
    "epochs": 5
}
response = requests.post(f"{BASE_URL}/train", json=training_data, headers=HEADERS)
print(f"Training Job: {response.json()['data']['job_id']}")

# 2. Generate Text
gen_data = {
    "model_id": "gpt-4_science",
    "prompt": "Quantum mechanics is",
    "max_length": 50
}
response = requests.post(f"{BASE_URL}/generate", json=gen_data, headers=HEADERS)
print(f"AI: {response.json()['data']['text']}")
```

## 🐚 Bash Example (cURL)

```bash
# Get System Health
curl -X GET http://localhost:8000/status \
     -H "X-API-Key: your_secret_key"

# Verify a Model
curl -X POST http://localhost:8000/verify \
     -H "X-API-Key: your_secret_key" \
     -H "Content-Type: application/json" \
     -d '{"model_id": "beta-v1", "benchmark": "accuracy"}'
```

---
[Home](Home.md) | [Authentication](Authentication.md)
