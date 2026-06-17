# Model Architectures

Hazoom OS supports several industry-standard and experimental model architectures. All models are implemented using standard `PyTorch`.

## 🏛️ Supported Architectures

### 1. GPT-4 Style (Decoder-Only)
- **Features**: Causal attention, Rotary Positional Embeddings (RoPE), LayerNorm.
- **Best For**: General-purpose text generation and reasoning.
- **Default Config**: 24 layers, 1024 embedding dimension, 16 attention heads.

### 2. LLaMA Style
- **Features**: SwiGLU activation functions, RMSNorm, no bias on linear layers.
- **Best For**: High-performance open-source foundation models.
- **Default Config**: 32 layers, 4096 embedding dimension, 32 attention heads.

### 3. Transformer (Base)
- **Features**: The classic Vaswani et al. architecture with absolute positional encodings.
- **Best For**: Academic research and simple translation tasks.

## 🔠 Tokenizers

Hazoom OS uses a unified tokenizer interface that supports:
- **BPE (Byte-Pair Encoding)**: Standard for GPT models.
- **SentencePiece**: Standard for LLaMA and T5.

Tokenizers are saved alongside the model weights to ensure consistent decoding.

## 🧪 Adding Custom Architectures

To add a new model, create a class in `models/llm_architectures.py` that inherits from `nn.Module` and register it in the `get_model_architecture` factory function.

---
[Home](Home.md) | [AGI Optimization](AGIOptimization.md) | [API Overview](APIOverview.md)
