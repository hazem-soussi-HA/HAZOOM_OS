# Hazoom OS - AGI-Powered LLM Training & Verification System

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.8%2B-blue" alt="Python">
  <img src="https://img.shields.io/badge/PyTorch-2.0%2B-orange" alt="PyTorch">
  <img src="https://img.shields.io/badge/Status-Active-brightgreen" alt="Status">
  <img src="https://img.shields.io/badge/License-MIT-blue" alt="License">
</p>

Hazoom OS is a comprehensive, AGI-powered operating system for training, verifying, and deploying Large Language Models (LLMs) with advanced neural architecture search and self-improving optimization capabilities.

## 🚀 Features

### Core Capabilities
- **Advanced Training Engine**: Multi-GPU distributed training with mixed precision
- **LLM Architectures**: GPT-4, LLaMA-2, and custom transformer implementations
- **AGI Intelligence Layer**: Self-improving model optimization with neural architecture search
- **Comprehensive Verification**: 6 benchmark types (perplexity, accuracy, speed, throughput, coherence, safety)
- **REST API**: FastAPI-based API for model management and inference
- **Real-time Monitoring**: Live training metrics and system health monitoring
- **Model Deployment**: Production-ready deployment with environment management

### Advanced Features
- **Neural Architecture Search**: Automated architecture optimization
- **Knowledge Distillation**: Transfer learning from large to small models
- **Pruning & Quantization**: Model compression for efficiency
- **Safety Benchmarks**: Toxicity and bias detection
- **Visualization**: Comprehensive benchmark reports and plots

## 📁 Project Structure

```
hazoom-os/
├── core/                    # Core ML engines
│   ├── training_engine.py   # Training with distributed support
│   ├── verification_engine.py # 6-type benchmark system
│   ├── agi_optimizer.py     # Self-improving optimization
│   ├── deployer.py          # Model deployment
│   ├── system_status.py     # Health monitoring
│   └── initializer.py       # System setup
├── models/                  # LLM architectures
│   ├── llm_architectures.py # GPT-4, LLaMA, Transformer
│   └── tokenizers.py        # Tokenizers for each model
├── api/                     # REST API server
│   └── server.py            # FastAPI endpoints
├── monitoring/              # Real-time monitoring
│   └── monitor.py           # Metrics collection & visualization
├── storage/                 # Model management
│   └── checkpoint_manager.py # Checkpointing & versioning
├── cli/                     # CLI interface
│   └── manager.py           # Command management
├── hazoom.py                # Main CLI entry point
├── requirements.txt         # Dependencies
├── setup.py                 # Package setup
├── config.yaml              # System configuration
└── .gitignore              # Git ignore rules
```

## 🛠️ Quick Start

### Installation

```bash
# Clone repository
git clone https://github.com/hazem-soussi-HA/hazoom-os.git
cd hazoom-os

# Install dependencies
pip install -r requirements.txt

# Or install as package
pip install -e .
```

### Initialize System

```bash
python hazoom.py init
```

This creates the directory structure and configuration files.

### Training a Model

```bash
# Basic training
python hazoom.py train --model gpt-4 --dataset data/example.txt

# Advanced training
python hazoom.py train \
  --model gpt-4 \
  --dataset data/example.txt \
  --epochs 100 \
  --batch-size 32 \
  --gpu 0 \
  --learning-rate 1e-4

# Resume training
python hazoom.py train --model gpt-4 --dataset data.txt --resume
```

### Verifying Models

```bash
# Run all benchmarks
python hazoom.py verify --model-id gpt-4_model

# Run specific benchmark
python hazoom.py verify --model-id gpt-4_model --benchmark accuracy

# Save results
python hazoom.py verify --model-id gpt-4_model --output results/
```

### AGI Optimization

```bash
# Auto-select strategy
python hazoom.py optimize --model-id gpt-4_model

# Specific strategy
python hazoom.py optimize --model-id gpt-4_model --strategy pruning
```

### Real-time Monitoring

```bash
# Monitor training
python hazoom.py monitor --model-id gpt-4 --interval 5

# Monitor system
python hazoom.py monitor --interval 10
```

### API Server

```bash
# Start API server
python hazoom.py serve --port 8000

# With custom settings
python hazoom.py serve --host 0.0.0.0 --port 8000 --workers 4
```

### Deployment

```bash
# Deploy to production
python hazoom.py deploy --model-id gpt-4_model --env production

# Deploy to staging
python hazoom.py deploy --model-id gpt-4_model --env staging
```

## 🌐 API Endpoints

### Training
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

### Verification
```bash
curl -X POST http://localhost:8000/verify \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "gpt-4",
    "benchmark": "all"
  }'
```

### Generation
```bash
curl -X POST http://localhost:8000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "model_id": "gpt-4",
    "prompt": "The future of AI is",
    "max_length": 50
  }'
```

### Status
```bash
curl http://localhost:8000/status
```

## 📊 Benchmark Types

1. **Perplexity** - Measures model's prediction confidence
2. **Accuracy** - Tests factual knowledge
3. **Speed** - Measures inference latency
4. **Throughput** - Measures processing capacity
5. **Coherence** - Tests text quality
6. **Safety** - Tests for harmful content

## 🧠 AGI Optimization Strategies

- **Pruning** - Remove unimportant weights
- **Quantization** - Reduce precision for efficiency
- **Architecture Search** - Find optimal configuration
- **Knowledge Distillation** - Transfer learning
- **Fine-tuning** - Domain adaptation
- **Comprehensive** - Combined optimization

## 📈 System Status

```bash
python hazoom.py status
```

Shows:
- CPU/Memory/GPU usage
- Available models and checkpoints
- Storage usage
- System health

## 📚 Documentation

- [Training Guide](docs/training.md)
- [Verification System](docs/verification.md)
- [API Reference](docs/api.md)
- [Optimization Guide](docs/optimization.md)

## 🔧 Configuration

Edit `config.yaml` to customize:
- Training defaults
- Verification thresholds
- API settings
- Monitoring intervals
- Storage paths

## 📦 Requirements

```
torch>=2.0.0
transformers>=4.35.0
fastapi>=0.104.0
uvicorn>=0.24.0
pydantic>=2.4.0
numpy>=1.24.0
matplotlib>=3.8.0
psutil>=5.9.0
gputil>=1.4.0
pyyaml>=6.0.0
click>=8.1.0
tqdm>=4.66.0
```

## 🎯 Example Workflow

1. **Initialize**: `python hazoom.py init`
2. **Train**: `python hazoom.py train --model gpt-4 --dataset data.txt`
3. **Verify**: `python hazoom.py verify --model-id gpt-4`
4. **Optimize**: `python hazoom.py optimize --model-id gpt-4`
5. **Deploy**: `python hazoom.py deploy --model-id gpt-4 --env production`
6. **Monitor**: `python hazoom.py monitor --model-id gpt-4`

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=hazem-soussi-HA/hazoom-os&type=Date)](https://star-history.com/#hazem-soussi-HA/hazoom-os&Date)

---

**Hazoom OS** - Building the future of AGI-powered LLM systems 🚀