"""
Hazoom OS - System Initializer
Initializes the Hazoom OS system with configuration
"""

import yaml
from pathlib import Path
from typing import Dict, Any
import json


class SystemInitializer:
    """
    Initializes the Hazoom OS system with proper directory structure
    and configuration files
    """
    
    def __init__(self, config_path: str = "config.yaml"):
        self.config_path = Path(config_path)
        self.config = self._load_config()
    
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from file or create default"""
        if self.config_path.exists():
            with open(self.config_path, 'r') as f:
                return yaml.safe_load(f)
        else:
            return self._create_default_config()
    
    def _create_default_config(self) -> Dict[str, Any]:
        """Create default configuration"""
        return {
            'system': {
                'name': 'Hazoom OS',
                'version': '1.0.0',
                'description': 'AGI-Powered LLM Training & Verification System',
            },
            'training': {
                'default_epochs': 100,
                'default_batch_size': 32,
                'default_learning_rate': 1e-4,
                'checkpoint_frequency': 5,
                'max_checkpoints': 10,
            },
            'verification': {
                'benchmarks': ['perplexity', 'accuracy', 'speed', 'throughput', 'coherence', 'safety'],
                'thresholds': {
                    'perplexity': 20,
                    'accuracy': 0.6,
                    'speed': 1.0,
                    'throughput': 10,
                    'coherence': 0.5,
                    'safety': 0.9,
                }
            },
            'optimization': {
                'strategies': ['pruning', 'quantization', 'architecture_search', 'knowledge_distillation', 'fine_tuning', 'comprehensive'],
                'auto_select': True,
            },
            'api': {
                'host': '0.0.0.0',
                'port': 8000,
                'workers': 4,
                'cors_origins': ['*'],
            },
            'monitoring': {
                'default_interval': 5,
                'max_history': 1000,
                'enable_plots': True,
            },
            'storage': {
                'base_dir': '.',
                'checkpoints_dir': 'checkpoints',
                'models_dir': 'models',
                'logs_dir': 'logs',
            }
        }
    
    def run(self):
        """Initialize the system"""
        print("=" * 60)
        print("🚀 Initializing Hazoom OS")
        print("=" * 60)
        
        # Create directory structure
        self._create_directories()
        
        # Save configuration
        self._save_config()
        
        # Create README files
        self._create_readme_files()
        
        # Create example files
        self._create_example_files()
        
        print("\n✅ Hazoom OS initialized successfully!")
        print("\nNext steps:")
        print("  1. Install dependencies: pip install -r requirements.txt")
        print("  2. Train a model: python hazoom.py train --model gpt-4 --dataset your_data.txt")
        print("  3. Verify model: python hazoom.py verify --model-id <model_id>")
        print("  4. Start API: python hazoom.py serve")
        print("\n" + "=" * 60)
    
    def _create_directories(self):
        """Create necessary directories"""
        directories = [
            'checkpoints/checkpoints',
            'checkpoints/best_models',
            'checkpoints/metadata',
            'models',
            'training_history',
            'verification_reports',
            'optimization_history',
            'monitoring_logs',
            'monitoring_plots',
            'deployments',
            'logs',
            'data',
            'docs',
        ]
        
        for directory in directories:
            path = Path(directory)
            path.mkdir(parents=True, exist_ok=True)
            print(f"📁 Created: {directory}")
    
    def _save_config(self):
        """Save configuration to file"""
        with open(self.config_path, 'w') as f:
            yaml.dump(self.config, f, default_flow_style=False)
        
        print(f"⚙️  Configuration saved: {self.config_path}")
    
    def _create_readme_files(self):
        """Create README files for documentation"""
        
        # Main README
        readme_content = """# Hazoom OS Documentation

## Overview
Hazoom OS is an AGI-powered LLM training and verification system.

## Quick Start

### Installation
```bash
pip install -r requirements.txt
```

### Training
```bash
python hazoom.py train --model gpt-4 --dataset data.txt --epochs 100
```

### Verification
```bash
python hazoom.py verify --model-id gpt-4_model
```

### API Server
```bash
python hazoom.py serve --port 8000
```

## API Endpoints

- `POST /train` - Start training
- `POST /verify` - Verify model
- `POST /optimize` - Optimize model
- `POST /generate` - Generate text
- `POST /deploy` - Deploy model
- `GET /status` - System status
- `GET /models` - List models

## Documentation

- [Training Guide](training.md)
- [Verification System](verification.md)
- [API Reference](api.md)
- [Optimization Guide](optimization.md)
"""
        
        with open('docs/README.md', 'w') as f:
            f.write(readme_content)
        
        print("📄 Created: docs/README.md")
        
        # Training guide
        training_content = """# Training Guide

## Basic Training

```bash
python hazoom.py train --model gpt-4 --dataset data.txt
```

## Advanced Options

```bash
python hazoom.py train \\
  --model gpt-4 \\
  --dataset data.txt \\
  --epochs 100 \\
  --batch-size 32 \\
  --gpu 0 \\
  --learning-rate 1e-4
```

## Resuming Training

```bash
python hazoom.py train --model gpt-4 --dataset data.txt --resume
```

## Monitoring Training

```bash
python hazoom.py monitor --model-id gpt-4 --interval 5
```
"""
        
        with open('docs/training.md', 'w') as f:
            f.write(training_content)
        
        print("📄 Created: docs/training.md")
        
        # Verification guide
        verification_content = """# Verification System

## Running Benchmarks

```bash
# Run all benchmarks
python hazoom.py verify --model-id gpt-4_model

# Run specific benchmark
python hazoom.py verify --model-id gpt-4_model --benchmark accuracy
```

## Benchmark Types

1. **Perplexity** - Measures model's prediction confidence
2. **Accuracy** - Tests factual knowledge
3. **Speed** - Measures inference latency
4. **Throughput** - Measures processing capacity
5. **Coherence** - Tests text quality
6. **Safety** - Tests for harmful content

## Results

Results are saved to:
- `verification_reports/{model_id}_report.json`
- `verification_reports/{model_id}_visualization.png`
"""
        
        with open('docs/verification.md', 'w') as f:
            f.write(verification_content)
        
        print("📄 Created: docs/verification.md")
        
        # API guide
        api_content = """# API Reference

## Endpoints

### POST /train
Start a training job.

**Request:**
```json
{
  "model_name": "gpt-4",
  "dataset_path": "data.txt",
  "epochs": 100,
  "batch_size": 32,
  "gpu_id": 0,
  "learning_rate": 0.0001
}
```

### POST /verify
Verify a trained model.

**Request:**
```json
{
  "model_id": "gpt-4_model",
  "benchmark": "all"
}
```

### POST /optimize
Optimize a model using AGI intelligence.

**Request:**
```json
{
  "model_id": "gpt-4_model",
  "strategy": "auto"
}
```

### POST /generate
Generate text from a model.

**Request:**
```json
{
  "model_id": "gpt-4_model",
  "prompt": "Hello, how are you?",
  "max_length": 100,
  "temperature": 1.0
}
```

### GET /status
Get system status.

### GET /models
List all available models.

### GET /jobs
List active training jobs.
"""
        
        with open('docs/api.md', 'w') as f:
            f.write(api_content)
        
        print("📄 Created: docs/api.md")
    
    def _create_example_files(self):
        """Create example data files"""
        
        # Example dataset
        example_data = """The quick brown fox jumps over the lazy dog.
Machine learning is a subset of artificial intelligence.
Python is a popular programming language for data science.
Neural networks are inspired by biological neurons.
Deep learning has revolutionized computer vision.
Natural language processing enables computers to understand human language.
Reinforcement learning is used for game playing and robotics.
Computer vision allows machines to interpret visual information.
Speech recognition converts spoken words to text.
Time series analysis is used for forecasting and prediction.
"""
        
        with open('data/example.txt', 'w') as f:
            f.write(example_data)
        
        print("📄 Created: data/example.txt")
        
        # Example configuration
        example_config = {
            'training': {
                'model': 'gpt-4',
                'dataset': 'data/example.txt',
                'epochs': 10,
                'batch_size': 16,
            },
            'verification': {
                'benchmarks': ['perplexity', 'accuracy', 'speed'],
            }
        }
        
        with open('examples/training_config.json', 'w') as f:
            json.dump(example_config, f, indent=2)
        
        print("📄 Created: examples/training_config.json")
        
        # Example API usage
        example_api = """#!/bin/bash
# Example API usage with curl

# Start training
curl -X POST http://localhost:8000/train \\
  -H "Content-Type: application/json" \\
  -d '{
    "model_name": "gpt-4",
    "dataset_path": "data/example.txt",
    "epochs": 10,
    "batch_size": 16
  }'

# Verify model
curl -X POST http://localhost:8000/verify \\
  -H "Content-Type: application/json" \\
  -d '{
    "model_id": "gpt-4",
    "benchmark": "all"
  }'

# Generate text
curl -X POST http://localhost:8000/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "model_id": "gpt-4",
    "prompt": "The future of AI is",
    "max_length": 50
  }'

# Get status
curl http://localhost:8000/status

# List models
curl http://localhost:8000/models
"""
        
        with open('examples/api_usage.sh', 'w') as f:
            f.write(example_api)
        
        print("📄 Created: examples/api_usage.sh")