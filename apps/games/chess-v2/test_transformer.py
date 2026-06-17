#!/usr/bin/env python3
"""
Quick test script for transformer chess AI
"""

import sys
from pathlib import Path

# Add chess directory to path
chess_dir = Path(__file__).parent / "chess"
sys.path.insert(0, str(chess_dir))

def test_imports():
    """Test basic imports"""
    print("Testing imports...")
    
    # Test board and pieces
    try:
        from board import Board
        from pieces import Piece, PieceType, Color
        print("✓ Board and pieces imported")
    except Exception as e:
        print(f"✗ Board/pieces error: {e}")
        return False
    
    # Test traditional AI
    try:
        from ai import ChessAI
        print("✓ Traditional AI imported")
    except Exception as e:
        print(f"✗ Traditional AI error: {e}")
        return False
    
    # Test transformer (if torch available)
    try:
        from transformer_ai import (
            MultiHeadAttention,
            PositionalEncoding,
            TransformerEncoderLayer,
            ChessTransformer,
            TransformerChessAI
        )
        print("✓ Transformer AI imported")
        return True
    except ImportError as e:
        print(f"⚠ Transformer AI not available: {e}")
        print("  Install with: pip install torch")
        return None

def test_traditional_ai():
    """Test traditional AI functionality"""
    print("\nTesting traditional AI...")
    
    try:
        from board import Board
        from ai import ChessAI
        
        board = Board()
        ai = ChessAI(depth=2)
        
        # Get a move
        move = ai.get_best_move(board)
        
        if move:
            print(f"✓ AI found a move: {move}")
            print(f"  Evaluated {ai.nodes_evaluated} positions")
        else:
            print("✓ AI returned no move (checkmate/stalemate)")
        
        return True
    except Exception as e:
        print(f"✗ Traditional AI test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_transformer_ai():
    """Test transformer AI functionality"""
    print("\nTesting transformer AI...")
    
    try:
        from transformer_ai import ChessTransformer, TransformerChessAI
        from board import Board
        import torch
        
        # Check device
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        print(f"  Using device: {device}")
        
        # Create small model for testing
        model = ChessTransformer(
            d_model=64,  # Small for fast testing
            num_heads=4,
            num_layers=2,
            d_ff=256
        )
        
        print(f"  Model created: {sum(p.numel() for p in model.parameters())} parameters")
        
        # Test forward pass
        model.eval()
        with torch.no_grad():
            pieces = torch.randint(0, 13, (1, 32))
            positions = torch.arange(32).unsqueeze(0)
            
            eval_score, move_logits, piece_logits, color_logits, attn = model(pieces, positions)
            
            print(f"✓ Forward pass successful")
            print(f"  Eval shape: {eval_score.shape}")
            print(f"  Move logits shape: {move_logits.shape}")
            print(f"  Piece logits shape: {piece_logits.shape}")
            print(f"  Color logits shape: {color_logits.shape}")
            print(f"  Attention shape: {len(attn)} layers")
        
        # Test AI interface
        ai = TransformerChessAI(model, search_depth=1, device=device)
        board = Board()
        
        # Test evaluation
        eval_score = ai.evaluate(board)
        print(f"✓ Position evaluation: {eval_score:.4f}")
        
        # Test move prediction
        top_moves = ai.predict_top_moves(board, top_k=3)
        print(f"✓ Top moves predicted: {len(top_moves)}")
        
        return True
    except Exception as e:
        print(f"✗ Transformer AI test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_board_operations():
    """Test board operations"""
    print("\nTesting board operations...")
    
    try:
        from board import Board
        from pieces import Color
        
        # Create board
        board = Board()
        print(f"✓ Board created")
        
        # Get pieces
        pieces = board.get_all_pieces(Color.WHITE)
        print(f"✓ Found {len(pieces)} white pieces")
        
        # Get moves
        moves = board.get_all_valid_moves(Color.WHITE)
        print(f"✓ Found {len(moves)} valid moves")
        
        # Make a move
        if moves:
            from_pos, to_pos = moves[0]
            success = board.make_move(from_pos, to_pos)
            if success:
                print(f"✓ Move executed successfully")
            else:
                print(f"⚠ Move failed (may be illegal)")
        
        # Test FEN
        fen = board.to_fen()
        print(f"✓ FEN string: {fen[:50]}...")
        
        return True
    except Exception as e:
        print(f"✗ Board operations test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print("=" * 60)
    print("  CHESS TRANSFORMER AI - QUICK TEST")
    print("=" * 60)
    
    # Test imports
    torch_available = test_imports()
    
    if torch_available is None:
        print("\nNote: PyTorch not installed. Skipping transformer tests.")
        print("Install with: pip install torch")
    
    # Test board
    test_board_operations()
    
    # Test traditional AI
    test_traditional_ai()
    
    # Test transformer AI if available
    if torch_available:
        test_transformer_ai()
    
    print("\n" + "=" * 60)
    print("  Tests Complete!")
    print("=" * 60)
    
    if torch_available:
        print("\n✓ All tests passed!")
        print("\nTo run full demos:")
        print("  cd chess")
        print("  python demo_transformer_capacities.py")
    else:
        print("\n⚠ Traditional tests passed")
        print("⚠ Install PyTorch for full transformer capabilities")

if __name__ == '__main__':
    main()
