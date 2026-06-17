# Quick Start Guide

This guide will help you get up and running with Hazoom OS in under 5 minutes.

## 1. Setup Environment

Ensure you have installed the system following the [Installation Guide](Installation.md).

```bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install requirements
pip install -r requirements.txt
```

## 2. Initialize the System

Hazoom OS needs a directory structure and configuration to function.

```bash
python hazoom.py init
```

This creates:
- `data/` for datasets
- `checkpoints/` for model weights
- `logs/` for system logs
- `config.yaml` with default settings

## 3. Train Your First Model

Let's train a small GPT-4 style model on an example dataset.

```bash
python hazoom.py train --model gpt-4 --dataset data/example.txt --epochs 10
```

## 4. Verify the Model

Benchmarking ensures your model meets the required standards.

```bash
python hazoom.py verify --model-id gpt-4_latest
```

## 5. Start the API Server

Deploy your model as a REST API.

```bash
python hazoom.py serve --port 8000
```

Now you can send requests to your model:

```bash
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{"model_id": "gpt-4_latest", "prompt": "Deep learning is"}'
```

## 6. Monitor Progress

Watch your system's performance in real-time.

```bash
python hazoom.py monitor --model-id gpt-4_latest
```

---
[Home](Home.md) | [Installation](Installation.md) | [Architecture](Architecture.md)
