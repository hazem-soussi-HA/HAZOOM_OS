"""
Transformer-based Chess AI System
Implements attention-based neural networks for chess position evaluation and move prediction
"""

import torch
import torch.nn as nn
import torch.optim as optim
import torch.nn.functional as F
import numpy as np
from typing import List, Tuple, Optional, Dict
import json
from datetime import datetime
from pathlib import Path
import os


class MultiHeadAttention(nn.Module):
    def __init__(self, d_model: int, num_heads: int = 8, dropout: float = 0.1):
        super().__init__()
        assert d_model % num_heads == 0
        
        self.d_model = d_model
        self.num_heads = num_heads
        self.d_k = d_model // num_heads
        
        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)
        
        self.dropout = nn.Dropout(dropout)
        self.scale = torch.sqrt(torch.FloatTensor([self.d_k]))
    
    def forward(self, query: torch.Tensor, key: torch.Tensor, 
                value: torch.Tensor, mask: Optional[torch.Tensor] = None):
        batch_size = query.size(0)
        
        Q = self.W_q(query)
        K = self.W_k(key)
        V = self.W_v(value)
        
        Q = Q.view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        K = K.view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        V = V.view(batch_size, -1, self.num_heads, self.d_k).transpose(1, 2)
        
        scores = torch.matmul(Q, K.transpose(-2, -1)) / self.scale
        
        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)
        
        attention_weights = F.softmax(scores, dim=-1)
        attention_weights = self.dropout(attention_weights)
        
        context = torch.matmul(attention_weights, V)
        context = context.transpose(1, 2).contiguous().view(batch_size, -1, self.d_model)
        
        output = self.W_o(context)
        return output, attention_weights


class PositionalEncoding(nn.Module):
    def __init__(self, d_model: int, max_len: int = 10000, dropout: float = 0.1):
        super().__init__()
        self.dropout = nn.Dropout(dropout)
        
        position = torch.arange(max_len).unsqueeze(1).float()
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * 
                            (-np.log(10000.0) / d_model))
        
        pe = torch.zeros(max_len, d_model)
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)
        
        self.register_buffer('pe', pe)
    
    def forward(self, x: torch.Tensor):
        x = x + self.pe[:, :x.size(1)]
        return self.dropout(x)


class TransformerEncoderLayer(nn.Module):
    def __init__(self, d_model: int, num_heads: int = 8, d_ff: int = 2048, 
                 dropout: float = 0.1, activation: str = 'gelu'):
        super().__init__()
        
        self.self_attention = MultiHeadAttention(d_model, num_heads, dropout)
        self.feed_forward = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.GELU() if activation == 'gelu' else nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(d_ff, d_model)
        )
        
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)
        self.dropout = nn.Dropout(dropout)
    
    def forward(self, x: torch.Tensor, mask: Optional[torch.Tensor] = None):
        attn_output, attn_weights = self.self_attention(x, x, x, mask)
        x = self.norm1(x + self.dropout(attn_output))
        
        ff_output = self.feed_forward(x)
        x = self.norm2(x + self.dropout(ff_output))
        
        return x, attn_weights


class ChessTransformer(nn.Module):
    """
    Transformer-based Chess AI for position evaluation and move prediction
    """
    
    def __init__(self, d_model: int = 512, num_heads: int = 8, num_layers: int = 6,
                 d_ff: int = 2048, dropout: float = 0.1, max_pieces: int = 32):
        super().__init__()
        
        self.d_model = d_model
        self.max_pieces = max_pieces
        
        self.piece_embedding = nn.Embedding(13, d_model)  # 6 white + 6 black + empty
        self.position_embedding = nn.Embedding(64, d_model)  # 64 board squares
        
        self.positional_encoding = PositionalEncoding(d_model, max_pieces, dropout)
        
        self.encoder_layers = nn.ModuleList([
            TransformerEncoderLayer(d_model, num_heads, d_ff, dropout)
            for _ in range(num_layers)
        ])
        
        self.eval_head = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_ff, 1)
        )
        
        self.move_head = nn.Sequential(
            nn.Linear(d_model * 2, d_ff),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_ff, 4096)  # 64 * 64 possible moves
        )
        
        self.piece_type_head = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_ff, 6)  # 6 piece types
        )
        
        self.color_head = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_ff, 2)  # White, Black
        )
        
        self.dropout = nn.Dropout(dropout)
    
    def encode_board(self, pieces: torch.Tensor, positions: torch.Tensor) -> torch.Tensor:
        """
        Encode board state into transformer input
        Args:
            pieces: (batch, max_pieces) - piece types (0-12)
            positions: (batch, max_pieces) - positions (0-63)
        Returns:
            encoded: (batch, max_pieces, d_model)
        """
        piece_emb = self.piece_embedding(pieces)
        pos_emb = self.position_embedding(positions)
        
        x = piece_emb + pos_emb
        x = self.positional_encoding(x)
        x = self.dropout(x)
        
        return x
    
    def forward(self, pieces: torch.Tensor, positions: torch.Tensor, 
                attention_mask: Optional[torch.Tensor] = None):
        """
        Forward pass through transformer
        Args:
            pieces: (batch, max_pieces) - piece types
            positions: (batch, max_pieces) - positions
            attention_mask: (batch, max_pieces, max_pieces) - optional mask
        Returns:
            eval_score: (batch, 1) - position evaluation
            move_logits: (batch, 4096) - move prediction logits
            attention_weights: (num_layers, batch, num_heads, max_pieces, max_pieces)
        """
        x = self.encode_board(pieces, positions)
        
        attention_weights = []
        for encoder_layer in self.encoder_layers:
            x, attn_w = encoder_layer(x, attention_mask)
            attention_weights.append(attn_w)
        
        pooled = x.mean(dim=1)
        eval_score = self.eval_head(pooled)
        
        move_logits = self.move_head(x.view(x.size(0), -1))
        
        piece_logits = self.piece_type_head(x)
        color_logits = self.color_head(x)
        
        return eval_score, move_logits, piece_logits, color_logits, attention_weights
    
    def evaluate_position(self, pieces: torch.Tensor, positions: torch.Tensor) -> float:
        """Evaluate a chess position (for inference)"""
        self.eval()
        with torch.no_grad():
            eval_score, _, _, _, _ = self.forward(pieces.unsqueeze(0), positions.unsqueeze(0))
            return eval_score.item()
    
    def predict_moves(self, pieces: torch.Tensor, positions: torch.Tensor, 
                     top_k: int = 10) -> List[Tuple[int, float]]:
        """Predict top-k moves for a position"""
        self.eval()
        with torch.no_grad():
            _, move_logits, _, _, _ = self.forward(pieces.unsqueeze(0), positions.unsqueeze(0))
            probs = F.softmax(move_logits, dim=-1)
            top_probs, top_indices = torch.topk(probs, top_k)
            
            return [(idx.item(), prob.item()) for idx, prob in zip(top_indices[0], top_probs[0])]


class ChessTransformerTrainer:
    def __init__(self, model: ChessTransformer, device: str = 'cuda' if torch.cuda.is_available() else 'cpu'):
        self.model = model.to(device)
        self.device = device
        
        self.optimizer = optim.AdamW(model.parameters(), lr=1e-4, weight_decay=0.01)
        self.scheduler = optim.lr_scheduler.CosineAnnealingLR(self.optimizer, T_max=1000)
        
        self.criterion_eval = nn.MSELoss()
        self.criterion_move = nn.CrossEntropyLoss()
        self.criterion_piece = nn.CrossEntropyLoss()
        self.criterion_color = nn.CrossEntropyLoss()
        
        self.training_history = {
            'eval_loss': [],
            'move_loss': [],
            'total_loss': [],
            'learning_rate': []
        }
    
    def encode_position(self, board) -> Tuple[torch.Tensor, torch.Tensor]:
        """Encode a chess board to tensor format"""
        from pieces import PieceType, Color
        
        pieces = torch.zeros(64, dtype=torch.long)
        positions = torch.arange(64, dtype=torch.long)
        
        piece_to_idx = {
            (Color.WHITE, PieceType.PAWN): 1,
            (Color.WHITE, PieceType.KNIGHT): 2,
            (Color.WHITE, PieceType.BISHOP): 3,
            (Color.WHITE, PieceType.ROOK): 4,
            (Color.WHITE, PieceType.QUEEN): 5,
            (Color.WHITE, PieceType.KING): 6,
            (Color.BLACK, PieceType.PAWN): 7,
            (Color.BLACK, PieceType.KNIGHT): 8,
            (Color.BLACK, PieceType.BISHOP): 9,
            (Color.BLACK, PieceType.ROOK): 10,
            (Color.BLACK, PieceType.QUEEN): 11,
            (Color.BLACK, PieceType.KING): 12,
        }
        
        for row in range(8):
            for col in range(8):
                idx = row * 8 + col
                piece = board.get_piece(row, col)
                if piece:
                    pieces[idx] = piece_to_idx[(piece.color, piece.type)]
        
        return pieces, positions
    
    def train_step(self, batch: Dict) -> Dict:
        """Single training step"""
        self.model.train()
        
        pieces = batch['pieces'].to(self.device)
        positions = batch['positions'].to(self.device)
        eval_targets = batch['eval_score'].to(self.device)
        move_targets = batch['move'].to(self.device)
        piece_targets = batch['piece_type'].to(self.device)
        color_targets = batch['color'].to(self.device)
        
        self.optimizer.zero_grad()
        
        eval_pred, move_logits, piece_logits, color_logits, _ = self.model(pieces, positions)
        
        eval_loss = self.criterion_eval(eval_pred.squeeze(), eval_targets)
        move_loss = self.criterion_move(move_logits, move_targets)
        piece_loss = self.criterion_piece(piece_logits.view(-1, 6), piece_targets.view(-1))
        color_loss = self.criterion_color(color_logits.view(-1, 2), color_targets.view(-1))
        
        total_loss = eval_loss + 0.5 * move_loss + 0.3 * piece_loss + 0.2 * color_loss
        
        total_loss.backward()
        torch.nn.utils.clip_grad_norm_(self.model.parameters(), max_norm=1.0)
        self.optimizer.step()
        self.scheduler.step()
        
        return {
            'eval_loss': eval_loss.item(),
            'move_loss': move_loss.item(),
            'total_loss': total_loss.item(),
            'learning_rate': self.optimizer.param_groups[0]['lr']
        }
    
    def train_epoch(self, dataloader, epoch: int) -> Dict:
        """Train for one epoch"""
        total_eval_loss = 0
        total_move_loss = 0
        total_loss = 0
        num_batches = 0
        
        for batch in dataloader:
            results = self.train_step(batch)
            
            total_eval_loss += results['eval_loss']
            total_move_loss += results['move_loss']
            total_loss += results['total_loss']
            num_batches += 1
        
        avg_results = {
            'eval_loss': total_eval_loss / num_batches,
            'move_loss': total_move_loss / num_batches,
            'total_loss': total_loss / num_batches,
            'learning_rate': 0.0
        }
        
        self.training_history['eval_loss'].append(avg_results['eval_loss'])
        self.training_history['move_loss'].append(avg_results['move_loss'])
        self.training_history['total_loss'].append(avg_results['total_loss'])
        self.training_history['learning_rate'].append(avg_results['learning_rate'])
        
        return avg_results
    
    def save_checkpoint(self, filepath: str, epoch: int, loss: float):
        """Save model checkpoint"""
        checkpoint = {
            'epoch': epoch,
            'model_state_dict': self.model.state_dict(),
            'optimizer_state_dict': self.optimizer.state_dict(),
            'scheduler_state_dict': self.scheduler.state_dict(),
            'loss': loss,
            'training_history': self.training_history
        }
        torch.save(checkpoint, filepath)
    
    def load_checkpoint(self, filepath: str) -> int:
        """Load model checkpoint"""
        checkpoint = torch.load(filepath, map_location=self.device)
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
        self.scheduler.load_state_dict(checkpoint['scheduler_state_dict'])
        self.training_history = checkpoint['training_history']
        return checkpoint['epoch']


class TransformerChessAI:
    """
    Complete AI system combining transformer evaluation with traditional search
    """
    
    def __init__(self, model: Optional[ChessTransformer] = None, 
                 search_depth: int = 4, device: str = 'cuda' if torch.cuda.is_available() else 'cpu'):
        self.device = device
        
        if model is None:
            self.model = ChessTransformer(
                d_model=512,
                num_heads=8,
                num_layers=6,
                d_ff=2048,
                dropout=0.1
            )
        else:
            self.model = model
        
        self.model = self.model.to(device)
        self.search_depth = search_depth
        self.nodes_evaluated = 0
        
    def evaluate(self, board) -> float:
        """Evaluate position using transformer"""
        pieces, positions = self._encode_board(board)
        
        eval_score = self.model.evaluate_position(pieces, positions)
        
        return eval_score
    
    def _encode_board(self, board) -> Tuple[torch.Tensor, torch.Tensor]:
        """Encode board to tensor format"""
        from pieces import PieceType, Color
        
        pieces = torch.zeros(64, dtype=torch.long)
        
        piece_to_idx = {
            (Color.WHITE, PieceType.PAWN): 1,
            (Color.WHITE, PieceType.KNIGHT): 2,
            (Color.WHITE, PieceType.BISHOP): 3,
            (Color.WHITE, PieceType.ROOK): 4,
            (Color.WHITE, PieceType.QUEEN): 5,
            (Color.WHITE, PieceType.KING): 6,
            (Color.BLACK, PieceType.PAWN): 7,
            (Color.BLACK, PieceType.KNIGHT): 8,
            (Color.BLACK, PieceType.BISHOP): 9,
            (Color.BLACK, PieceType.ROOK): 10,
            (Color.BLACK, PieceType.QUEEN): 11,
            (Color.BLACK, PieceType.KING): 12,
        }
        
        for row in range(8):
            for col in range(8):
                idx = row * 8 + col
                piece = board.get_piece(row, col)
                if piece:
                    pieces[idx] = piece_to_idx[(piece.color, piece.type)]
        
        positions = torch.arange(64, dtype=torch.long)
        
        return pieces, positions
    
    def get_best_move(self, board) -> Optional[Tuple[Tuple[int, int], Tuple[int, int]]]:
        from pieces import Color
        """
        Get best move using transformer-guided search
        """
        self.nodes_evaluated = 0
        color = board.turn
        
        if board.is_checkmate(color):
            print("Checkmate!")
            return None
        if board.is_stalemate(color):
            print("Stalemate!")
            return None
        
        valid_moves = board.get_all_valid_moves(color)
        if not valid_moves:
            return None
        
        best_move = None
        best_value = float('-inf')
        
        for move in valid_moves:
            temp_board = board.copy()
            temp_board._execute_move_internal(move[0], move[1])
            
            value = self._minimax(temp_board, self.search_depth - 1, float('-inf'), 
                                float('inf'), not (color == Color.WHITE))
            
            if value > best_value:
                best_value = value
                best_move = move
        
        print(f"Transformer AI searched {self.nodes_evaluated} positions")
        print(f"Best move value: {best_value:.4f}")
        
        return best_move
    
    def _minimax(self, board, depth: int, alpha: float, beta: float, 
                 maximizing: bool) -> float:
        """Minimax with transformer evaluation"""
        self.nodes_evaluated += 1
        
        if depth == 0:
            from pieces import Color
            eval_score = self.evaluate(board)
            if board.turn == Color.BLACK:
                eval_score = -eval_score
            return eval_score
        
        color = board.turn
        if board.is_checkmate(color):
            return -20000 + (self.search_depth - depth) if maximizing else 20000 - (self.search_depth - depth)
        if board.is_stalemate(color):
            return 0
        
        valid_moves = board.get_all_valid_moves(color)
        if not valid_moves:
            return self.evaluate(board)
        
        if maximizing:
            max_eval = float('-inf')
            for move in valid_moves:
                temp_board = board.copy()
                temp_board._execute_move_internal(move[0], move[1])
                eval_score = self._minimax(temp_board, depth - 1, alpha, beta, False)
                max_eval = max(max_eval, eval_score)
                alpha = max(alpha, eval_score)
                if beta <= alpha:
                    break
            return max_eval
        else:
            min_eval = float('inf')
            for move in valid_moves:
                temp_board = board.copy()
                temp_board._execute_move_internal(move[0], move[1])
                eval_score = self._minimax(temp_board, depth - 1, alpha, beta, True)
                min_eval = min(min_eval, eval_score)
                beta = min(beta, eval_score)
                if beta <= alpha:
                    break
            return min_eval
    
    def predict_top_moves(self, board, top_k: int = 5) -> List[Tuple[Tuple[int, int], Tuple[int, int], float]]:
        """Predict top-k moves using transformer"""
        pieces, positions = self._encode_board(board)
        top_moves = self.model.predict_moves(pieces, positions, top_k)
        
        move_list = []
        for move_idx, prob in top_moves:
            from_sq = move_idx // 64
            to_sq = move_idx % 64
            from_pos = (from_sq // 8, from_sq % 8)
            to_pos = (to_sq // 8, to_sq % 8)
            move_list.append((from_pos, to_pos, prob))
        
        return move_list
    
    def get_attention_weights(self, board, layer: int = 0) -> np.ndarray:
        """Get attention weights for visualization"""
        pieces, positions = self._encode_board(board)
        
        self.model.eval()
        with torch.no_grad():
            _, _, _, _, attention_weights = self.model(pieces.unsqueeze(0), positions.unsqueeze(0))
        
        return attention_weights[layer].squeeze().cpu().numpy()


def create_training_data(num_samples: int = 1000) -> List[Dict]:
    """Generate synthetic training data"""
    from board import Board
    import random
    
    data = []
    
    for _ in range(num_samples):
        board = Board()
        
        # Random moves
        num_random_moves = random.randint(0, 30)
        for _ in range(num_random_moves):
            color = board.turn
            moves = board.get_all_valid_moves(color)
            if moves:
                move = random.choice(moves)
                board.make_move(move[0], move[1])
            else:
                break
        
        # Encode board
        pieces = torch.zeros(64, dtype=torch.long)
        positions = torch.arange(64, dtype=torch.long)
        
        from pieces import PieceType, Color
        piece_to_idx = {
            (Color.WHITE, PieceType.PAWN): 1,
            (Color.WHITE, PieceType.KNIGHT): 2,
            (Color.WHITE, PieceType.BISHOP): 3,
            (Color.WHITE, PieceType.ROOK): 4,
            (Color.WHITE, PieceType.QUEEN): 5,
            (Color.WHITE, PieceType.KING): 6,
            (Color.BLACK, PieceType.PAWN): 7,
            (Color.BLACK, PieceType.KNIGHT): 8,
            (Color.BLACK, PieceType.BISHOP): 9,
            (Color.BLACK, PieceType.ROOK): 10,
            (Color.BLACK, PieceType.QUEEN): 11,
            (Color.BLACK, PieceType.KING): 12,
        }
        
        piece_types = torch.zeros(64, dtype=torch.long)
        colors = torch.zeros(64, dtype=torch.long)
        
        for row in range(8):
            for col in range(8):
                idx = row * 8 + col
                piece = board.get_piece(row, col)
                if piece:
                    pieces[idx] = piece_to_idx[(piece.color, piece.type)]
                    piece_types[idx] = piece.type.value if hasattr(piece.type, 'value') else piece.type
                    colors[idx] = 0 if piece.color == Color.WHITE else 1
        
        # Simple evaluation (material count)
        from ai import ChessAI
        ai = ChessAI(depth=1)
        eval_score = ai._evaluate(board) / 10000.0  # Normalize
        
        # Random move (placeholder)
        move_idx = random.randint(0, 4095)
        
        data.append({
            'pieces': pieces,
            'positions': positions,
            'eval_score': torch.tensor([eval_score], dtype=torch.float32),
            'move': torch.tensor([move_idx], dtype=torch.long),
            'piece_type': piece_types,
            'color': colors
        })
    
    return data


class ChessDataLoader:
    """Data loader for transformer training"""
    
    def __init__(self, data: List[Dict], batch_size: int = 32, shuffle: bool = True):
        self.data = data
        self.batch_size = batch_size
        self.shuffle = shuffle
        self.indices = list(range(len(data)))
    
    def __iter__(self):
        if self.shuffle:
            import random
            random.shuffle(self.indices)
        
        for i in range(0, len(self.data), self.batch_size):
            batch_indices = self.indices[i:i + self.batch_size]
            batch = [self.data[idx] for idx in batch_indices]
            
            yield {
                'pieces': torch.stack([item['pieces'] for item in batch]),
                'positions': torch.stack([item['positions'] for item in batch]),
                'eval_score': torch.stack([item['eval_score'] for item in batch]),
                'move': torch.stack([item['move'] for item in batch]),
                'piece_type': torch.stack([item['piece_type'] for item in batch]),
                'color': torch.stack([item['color'] for item in batch])
            }
    
    def __len__(self):
        return (len(self.data) + self.batch_size - 1) // self.batch_size


def main():
    """Main function for testing transformer chess AI"""
    print("=" * 60)
    print("  Transformer Chess AI System")
    print("=" * 60)
    
    # Create model
    model = ChessTransformer(
        d_model=256,  # Smaller for testing
        num_heads=8,
        num_layers=4,
        d_ff=1024,
        dropout=0.1
    )
    
    print(f"\nModel Architecture:")
    print(f"  Parameters: {sum(p.numel() for p in model.parameters()):,}")
    print(f"  Trainable: {sum(p.numel() for p in model.parameters() if p.requires_grad):,}")
    
    # Create trainer
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    print(f"\nDevice: {device}")
    
    trainer = ChessTransformerTrainer(model, device)
    
    # Generate training data
    print("\nGenerating training data...")
    train_data = create_training_data(100)
    train_loader = ChessDataLoader(train_data, batch_size=8)
    
    # Train
    print("\nTraining...")
    results = None
    for epoch in range(3):
        results = trainer.train_epoch(train_loader, epoch)
        print(f"Epoch {epoch + 1}: Loss = {results['total_loss']:.4f}, "
              f"Eval Loss = {results['eval_loss']:.4f}, "
              f"Move Loss = {results['move_loss']:.4f}")
    
    # Save model
    model_path = 'chess_transformer_model.pth'
    trainer.save_checkpoint(model_path, epoch=3, loss=results['total_loss'] if results else 0.0)
    print(f"\nModel saved to {model_path}")
    
    # Test inference
    print("\nTesting inference...")
    from board import Board
    board = Board()
    
    transformer_ai = TransformerChessAI(model, search_depth=2, device=device)
    eval_score = transformer_ai.evaluate(board)
    print(f"Initial position evaluation: {eval_score:.4f}")
    
    top_moves = transformer_ai.predict_top_moves(board, top_k=3)
    print("\nTop 3 predicted moves:")
    for from_pos, to_pos, prob in top_moves:
        files = "abcdefgh"
        move_str = files[from_pos[1]] + str(8 - from_pos[0]) + files[to_pos[1]] + str(8 - to_pos[0])
        print(f"  {move_str}: {prob:.4f}")
    
    print("\n" + "=" * 60)
    print("Transformer Chess AI System Ready!")
    print("=" * 60)


if __name__ == '__main__':
    main()
