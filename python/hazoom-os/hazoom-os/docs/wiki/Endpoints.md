# API Endpoints

## 🎓 Training

### `POST /train`
Starts a new training job.
**Body**:
```json
{
  "model_name": "gpt-4",
  "dataset_path": "data/my_data.txt",
  "epochs": 10
}
```

## ⚖️ Verification

### `POST /verify`
Runs benchmarks on a specific model.
**Body**:
```json
{
  "model_id": "model-123",
  "benchmark": "all"
}
```

## 🧠 Optimization

### `POST /optimize`
Runs AGI optimization on a model.
**Body**:
```json
{
  "model_id": "model-123",
  "strategy": "pruning"
}
```

## 📝 Generation

### `POST /generate`
Generates text using a deployed model.
**Body**:
```json
{
  "model_id": "model-123",
  "prompt": "Hello AI",
  "max_length": 100
}
```

## 📊 Monitoring

### `GET /status`
Returns CPU, RAM, and GPU utilization.

### `GET /models`
Lists all available models and their current status.

### `GET /jobs`
Lists all active training or optimization jobs.

---
[Home](Home.md) | [API Overview](APIOverview.md) | [Authentication](Authentication.md)
