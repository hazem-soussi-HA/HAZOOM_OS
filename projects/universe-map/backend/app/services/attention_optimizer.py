import torch
import torch.nn as nn
import numpy as np
from typing import Tuple, Optional
import math


class MultiHeadAttention(nn.Module):
    def __init__(self, d_model: int, num_heads: int, dropout: float = 0.1):
        super().__init__()
        assert d_model % num_heads == 0, "d_model must be divisible by num_heads"
        
        self.d_model = d_model
        self.num_heads = num_heads
        self.d_k = d_model // num_heads
        
        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)
        
        self.dropout = nn.Dropout(dropout)
        
    def scaled_dot_product_attention(
        self,
        Q: torch.Tensor,
        K: torch.Tensor,
        V: torch.Tensor,
        mask: Optional[torch.Tensor] = None
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_k)
        
        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)
        
        attention_weights = torch.softmax(scores, dim=-1)
        attention_weights = self.dropout(attention_weights)
        
        output = torch.matmul(attention_weights, V)
        return output, attention_weights
    
    def forward(
        self,
        x: torch.Tensor,
        mask: Optional[torch.Tensor] = None
    ) -> Tuple[torch.Tensor, torch.Tensor]:
        batch_size = x.size(0)
        
        Q = self.W_q(x).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        K = self.W_k(x).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        V = self.W_v(x).view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        
        attn_output, attn_weights = self.scaled_dot_product_attention(Q, K, V, mask)
        
        attn_output = attn_output.transpose(1, 2).contiguous().view(
            batch_size, -1, self.d_model
        )
        
        output = self.W_o(attn_output)
        return output, attn_weights


class CelestialPositionalEncoding(nn.Module):
    def __init__(self, d_model: int, max_len: int = 5000):
        super().__init__()
        
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)
        
        self.register_buffer('pe', pe)
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return x + self.pe[:, :x.size(1)]


class UniverseAttentionEncoder(nn.Module):
    def __init__(
        self,
        d_model: int = 512,
        num_heads: int = 8,
        num_layers: int = 6,
        d_ff: int = 2048,
        dropout: float = 0.1
    ):
        super().__init__()
        
        self.d_model = d_model
        self.pos_encoding = CelestialPositionalEncoding(d_model)
        
        self.encoder_layers = nn.ModuleList([
            nn.TransformerEncoderLayer(
                d_model=d_model,
                nhead=num_heads,
                dim_feedforward=d_ff,
                dropout=dropout,
                batch_first=True
            )
            for _ in range(num_layers)
        ])
        
        self.layer_norm = nn.LayerNorm(d_model)
        
    def forward(
        self,
        x: torch.Tensor,
        mask: Optional[torch.Tensor] = None
    ) -> torch.Tensor:
        x = self.pos_encoding(x)
        
        for layer in self.encoder_layers:
            x = layer(x, src_key_padding_mask=mask)
        
        return self.layer_norm(x)


class CelestialObjectEmbedding(nn.Module):
    def __init__(
        self,
        feature_dim: int = 64,
        d_model: int = 512,
        num_object_types: int = 10
    ):
        super().__init__()
        
        self.positional_embedding = nn.Linear(3, feature_dim)
        self.physical_embedding = nn.Linear(4, feature_dim)
        self.spectral_embedding = nn.Linear(10, feature_dim)
        self.type_embedding = nn.Embedding(num_object_types, feature_dim)
        
        self.projection = nn.Linear(feature_dim * 4, d_model)
        self.layer_norm = nn.LayerNorm(d_model)
        
    def forward(
        self,
        positions: torch.Tensor,
        physical: torch.Tensor,
        spectral: torch.Tensor,
        obj_types: torch.Tensor
    ) -> torch.Tensor:
        pos_emb = self.positional_embedding(positions)
        phy_emb = self.physical_embedding(physical)
        spec_emb = self.spectral_embedding(spectral)
        type_emb = self.type_embedding(obj_types)
        
        combined = torch.cat([pos_emb, phy_emb, spec_emb, type_emb], dim=-1)
        output = self.projection(combined)
        return self.layer_norm(output)


class UniverseMapOptimizer:
    def __init__(
        self,
        d_model: int = 512,
        num_heads: int = 8,
        num_layers: int = 6,
        device: str = 'cuda' if torch.cuda.is_available() else 'cpu'
    ):
        self.device = torch.device(device)
        
        self.embedding = CelestialObjectEmbedding(d_model=d_model).to(self.device)
        self.encoder = UniverseAttentionEncoder(
            d_model=d_model,
            num_heads=num_heads,
            num_layers=num_layers
        ).to(self.device)
        
        self.optimization_head = nn.Sequential(
            nn.Linear(d_model, d_model // 2),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(d_model // 2, d_model // 4),
            nn.ReLU(),
            nn.Linear(d_model // 4, 1)
        ).to(self.device)
        
    def optimize_rendering_order(
        self,
        positions: np.ndarray,
        physical: np.ndarray,
        spectral: np.ndarray,
        obj_types: np.ndarray
    ) -> np.ndarray:
        positions_tensor = torch.FloatTensor(positions).to(self.device)
        physical_tensor = torch.FloatTensor(physical).to(self.device)
        spectral_tensor = torch.FloatTensor(spectral).to(self.device)
        types_tensor = torch.LongTensor(obj_types).to(self.device)
        
        with torch.no_grad():
            embeddings = self.embedding(
                positions_tensor,
                physical_tensor,
                spectral_tensor,
                types_tensor
            )
            
            encoded = self.encoder(embeddings.unsqueeze(0))
            
            importance_scores = self.optimization_head(encoded.squeeze(0))
            
        order = torch.argsort(importance_scores.squeeze(-1), descending=True).cpu().numpy()
        return order
    
    def compute_attention_weights(
        self,
        positions: np.ndarray,
        physical: np.ndarray,
        spectral: np.ndarray,
        obj_types: np.ndarray
    ) -> np.ndarray:
        positions_tensor = torch.FloatTensor(positions).to(self.device)
        physical_tensor = torch.FloatTensor(physical).to(self.device)
        spectral_tensor = torch.FloatTensor(spectral).to(self.device)
        types_tensor = torch.LongTensor(obj_types).to(self.device)
        
        with torch.no_grad():
            embeddings = self.embedding(
                positions_tensor,
                physical_tensor,
                spectral_tensor,
                types_tensor
            )
            
            encoded = self.encoder(embeddings.unsqueeze(0))
            
            attention_weights = []
            for layer in self.encoder.encoder_layers:
                attn_output, attn_weights = layer.self_attn(
                    encoded, encoded, encoded
                )
                attention_weights.append(attn_weights.cpu().numpy())
        
        return np.mean(attention_weights, axis=0)


universe_optimizer = UniverseMapOptimizer()
