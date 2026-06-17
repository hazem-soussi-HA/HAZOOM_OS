# Installation Guide

This guide will help you install and set up Hazoom OS on your system.

## 📋 Prerequisites

### System Requirements

- **Python**: 3.8 or higher
- **pip**: Latest version
- **Disk Space**: At least 2GB for dependencies and models
- **RAM**: Minimum 8GB (16GB recommended for training)
- **GPU**: Optional but recommended for training (CUDA 11.0+)

### Optional Requirements

- **NVIDIA GPU**: For accelerated training
  - CUDA 11.0 or higher
  - cuDNN 8.0 or higher
- **Docker**: For containerized deployment
- **Git**: For cloning the repository

## 🚀 Installation Methods

### Method 1: Clone and Install (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/hazem-soussi-HA/hazoom-os.git
cd hazoom-os

# 2. Install dependencies
pip install -r requirements.txt

# 3. Install as editable package (optional)
pip install -e .

# 4. Verify installation
python3 hazoom.py --help
```

### Method 2: Direct Installation

```bash
# Install directly from PyPI (when available)
pip install hazoom-os

# Or install from GitHub
pip install git+https://github.com/hazem-soussi-HA/hazoom-os.git
```

### Method 3: Docker Installation

```bash
# Build Docker image
docker build -t hazoom-os .

# Run container
docker run -it --gpus all hazoom-os bash
```

## 📦 Dependency Details

### Core Dependencies

```bash
# Machine Learning
torch>=2.0.0
torchvision>=0.15.0
transformers>=4.35.0
accelerate>=0.24.0
datasets>=2.14.0
wandb>=0.16.0

# API & Web
fastapi>=0.104.0
uvicorn[standard]>=0.24.0
pydantic>=2.4.0
python-multipart>=0.0.6

# Database & Storage
sqlalchemy>=2.0.0
alembic>=1.12.0
redis>=5.0.0

# Monitoring & Visualization
prometheus-client>=0.19.0
matplotlib>=3.8.0
seaborn>=0.13.0

# Utilities
pyyaml>=6.0.0
python-dotenv>=1.0.0
click>=8.1.0
tqdm>=4.66.0
psutil>=5.9.0
gputil>=1.4.0

# Security
cryptography>=41.0.0
pyjwt>=2.8.0
bcrypt>=4.0.0

# Testing
pytest>=7.4.0
pytest-asyncio>=0.21.0
httpx>=0.25.0
```

### GPU Support (Optional)

For GPU acceleration, install PyTorch with CUDA:

```bash
# CUDA 11.8
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# CUDA 12.1
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# CPU only (no GPU)
pip install torch torchvision torchaudio
```

## 🔧 Installation Steps

### Step 1: Verify Python Version

```bash
python3 --version
# Should be 3.8 or higher
```

### Step 2: Create Virtual Environment (Recommended)

```bash
# Create virtual environment
python3 -m venv hazoom-env

# Activate on Linux/Mac
source hazoom-env/bin/activate

# Activate on Windows
hazoom-env\Scripts\activate

# Upgrade pip
pip install --upgrade pip
```

### Step 3: Install Dependencies

```bash
# Navigate to hazoom-os directory
cd hazoom-os

# Install all dependencies
pip install -r requirements.txt

# For GPU support, add:
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### Step 4: Verify Installation

```bash
# Check if installation was successful
python3 hazoom.py --help

# Should display:
# Usage: hazoom.py [OPTIONS] COMMAND [ARGS]...
#
# Options:
#   --help  Show this message and exit.
#
# Commands:
#   init           Initialize the Hazoom OS system
#   train          Train a neural network model
#   verify         Verify and benchmark a trained model
#   serve          Start the API server
#   monitor        Monitor training/inference in real-time
#   optimize       AGI-powered model optimization
#   deploy         Deploy model to production
#   status         Show system status
#   list-models    List all models
#   list-checkpoints  List checkpoints for a model
#   cleanup        Clean up old checkpoints
```

### Step 5: Initialize System

```bash
# Initialize the system (creates directories and config)
python3 hazoom.py init
```

This will:
- Create directory structure
- Generate configuration files
- Create example datasets
- Set up documentation

## 📁 Directory Structure After Initialization

```
hazoom-os/
├── checkpoints/          # Model checkpoints
│   ├── checkpoints/     # Training checkpoints
│   ├── best_models/     # Best model snapshots
│   └── metadata/        # Checkpoint metadata
├── models/               # Trained models
├── training_history/     # Training metrics
├── verification_reports/ # Benchmark results
├── optimization_history/ # Optimization logs
├── monitoring_logs/      # System metrics
├── monitoring_plots/     # Visualizations
├── deployments/          # Deployment records
├── logs/                 # System logs
├── data/                 # Example datasets
├── docs/                 # Documentation
└── examples/             # Example configurations
```

## 🎯 Verification

### Test Installation

```bash
# Check system status
python3 hazoom.py status

# Should display system information
```

### Run Quick Test

```bash
# Train a small test model
python3 hazoom.py train --model transformer --dataset data/example.txt --epochs 5 --batch-size 8

# Verify the model
python3 hazoom.py verify --model-id transformer
```

## 🐛 Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'torch'"

**Solution**: Install PyTorch
```bash
pip install torch torchvision torchaudio
```

### Issue: "CUDA out of memory"

**Solution**: Reduce batch size or use CPU
```bash
python3 hazoom.py train --model gpt-4 --dataset data.txt --batch-size 8 --gpu -1
```

### Issue: "Port already in use"

**Solution**: Change port
```bash
python3 hazoom.py serve --port 8001
```

### Issue: "Permission denied"

**Solution**: Use sudo or change permissions
```bash
sudo python3 hazoom.py init
# OR
chmod +x hazoom.py
```

### Issue: "Python version not supported"

**Solution**: Upgrade Python
```bash
# Install Python 3.8+
sudo apt-get install python3.8  # Ubuntu/Debian
# OR use pyenv
pyenv install 3.8.0
```

## 📊 System Requirements

### Minimum Requirements

- **OS**: Linux, macOS, or Windows
- **Python**: 3.8+
- **RAM**: 8GB
- **Disk**: 2GB free space
- **GPU**: Not required

### Recommended Requirements

- **OS**: Ubuntu 20.04+ or macOS 12+
- **Python**: 3.10+
- **RAM**: 16GB+
- **Disk**: 10GB+ free space
- **GPU**: NVIDIA GPU with 8GB+ VRAM

### Production Requirements

- **OS**: Ubuntu 22.04 LTS
- **Python**: 3.11+
- **RAM**: 32GB+
- **Disk**: 50GB+ SSD
- **GPU**: NVIDIA A100 or similar
- **Network**: Stable internet connection

## 🔗 Next Steps

After successful installation:

1. **Initialize System**: `python3 hazoom.py init`
2. **Train Your First Model**: See [Training Guide](TrainingEngine.md)
3. **Verify Models**: See [Verification System](VerificationSystem.md)
4. **Use API**: See [API Overview](APIOverview.md)
5. **Monitor**: See [Monitoring](Monitoring.md)

## 📚 Additional Resources

- [Quick Start Guide](QuickStart.md)
- [CLI Commands](CLICommands.md)
- [Configuration](Configuration.md)
- [Common Issues](CommonIssues.md)

## 🤝 Getting Help

If you encounter issues:

1. Check [Common Issues](CommonIssues.md)
2. Search GitHub Issues
3. Create a new issue with details
4. Join our community discussions

---

**Next**: [Quick Start Guide](QuickStart.md) →