# Hazoom OS Installation Guide

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Optional: GPU with CUDA support for training

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/hazem-soussi-HA/hazoom-os.git
cd hazoom-os
```

### 2. Install Dependencies

```bash
# Install all required packages
pip install -r requirements.txt

# Or install as a package (development mode)
pip install -e .
```

### 3. Initialize the System

```bash
python3 hazoom.py init
```

This will:
- Create the directory structure
- Generate configuration files
- Create example datasets
- Set up documentation

### 4. Verify Installation

```bash
python3 hazoom.py status
```

You should see system status information.

## Quick Start

### Training a Model

```bash
# Basic training
python3 hazoom.py train --model gpt-4 --dataset data/example.txt

# Advanced training with custom parameters
python3 hazoom.py train \
  --model gpt-4 \
  --dataset data/example.txt \
  --epochs 50 \
  --batch-size 16 \
  --gpu 0 \
  --learning-rate 1e-4
```

### Verifying Models

```bash
# Run all benchmarks
python3 hazoom.py verify --model-id gpt-4

# Run specific benchmark
python3 hazoom.py verify --model-id gpt-4 --benchmark accuracy
```

### Starting API Server

```bash
# Start server on port 8000
python3 hazoom.py serve --port 8000

# Access API documentation at http://localhost:8000/docs
```

### AGI Optimization

```bash
# Auto-select optimization strategy
python3 hazoom.py optimize --model-id gpt-4

# Use specific strategy
python3 hazoom.py optimize --model-id gpt-4 --strategy pruning
```

### Real-time Monitoring

```bash
# Monitor training
python3 hazoom.py monitor --model-id gpt-4 --interval 5

# Monitor system
python3 hazoom.py monitor --interval 10
```

## API Usage Examples

### Training via API

```bash
curl -X POST http://localhost:8000/train \
  -H "Content-Type: application/json" \
  -d '{
    "model_name": "gpt-4",
    "dataset_path": "data/example.txt",
    "epochs": 10,
    "batch_size": 16
  }'
```

### Verification via API

```bash
curl -X POST http://localhost:8000/verify \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "gpt-4",
    "benchmark": "all"
  }'
```

### Generation via API

```bash
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "gpt-4",
    "prompt": "The future of AI is",
    "max_length": 50
  }'
```

## Troubleshooting

### Common Issues

1. **ModuleNotFoundError: No module named 'torch'**
   - Solution: Install PyTorch: `pip install torch torchvision torchaudio`

2. **CUDA out of memory**
   - Solution: Reduce batch size: `--batch-size 8` or use CPU: `--gpu -1`

3. **Port already in use**
   - Solution: Change port: `--port 8001`

4. **Model not found**
   - Solution: Train a model first or check model ID

### Getting Help

- Check the documentation in `docs/`
- Run `python3 hazoom.py --help` for command help
- Visit API documentation at `http://localhost:8000/docs`

## Next Steps

1. Explore the [Training Guide](docs/training.md)
2. Read the [API Reference](docs/api.md)
3. Check the [Verification System](docs/verification.md)
4. Learn about [Optimization](docs/optimization.md)

## Support

For issues and questions:
- GitHub Issues: https://github.com/hazem-soussi-HA/hazoom-os/issues
- Documentation: https://github.com/hazem-soussi-HA/hazoom-os/blob/main/docs/README.md