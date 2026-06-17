#!/usr/bin/env python3
"""
Transformer Chess AI Integration Script
Demonstrates full transformer capacities and integration with existing chess system
"""

import sys
import os
from pathlib import Path

# Add chess directory to path
chess_dir = Path(__file__).parent / "chess"
sys.path.insert(0, str(chess_dir))

def check_dependencies():
    """Check if required dependencies are installed"""
    print("=" * 70)
    print("  Checking Dependencies...")
    print("=" * 70)
    
    dependencies = {
        'torch': 'PyTorch for neural network training',
        'numpy': 'NumPy for numerical operations',
        'board': 'Chess board module',
        'ai': 'Traditional AI module',
        'pieces': 'Pieces module'
    }
    
    missing = []
    
    for module, description in dependencies.items():
        try:
            if module in ['torch', 'numpy']:
                __import__(module)
            else:
                # For chess modules, try to import
                exec(f"from {module} import *")
            print(f"✓ {module:15} - {description}")
        except ImportError:
            print(f"✗ {module:15} - Missing (pip install {module})")
            missing.append(module)
    
    print()
    
    if missing:
        print("Missing dependencies detected!")
        print(f"Install with: pip install {' '.join(missing)}")
        return False
    
    print("All dependencies satisfied!")
    return True


def demo_traditional_ai():
    """Demonstrate traditional AI capabilities"""
    print("\n" + "=" * 70)
    print("  DEMO: Traditional AI (Minimax + Alpha-Beta Pruning)")
    print("=" * 70)
    
    try:
        from board import Board
        from ai import ChessAI
        from pieces import Color
        
        board = Board()
        ai = ChessAI(depth=3, use_opening_book=True)
        
        print("\nInitial Board:")
        print(board)
        print(f"\nCurrent Turn: {board.turn.value}")
        
        # Get AI move
        print("\nAI is thinking...")
        best_move = ai.get_best_move(board)
        
        if best_move:
            from_pos, to_pos = best_move
            files = "abcdefgh"
            move_str = files[from_pos[1]] + str(8 - from_pos[0]) + files[to_pos[1]] + str(8 - to_pos[0])
            print(f"\nBest move: {move_str}")
        
        print(f"\nPositions evaluated: {ai.nodes_evaluated}")
        print("\n✓ Traditional AI demo complete!")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        return False
    
    return True


def demo_transformer_ai():
    """Demonstrate transformer AI capabilities"""
    print("\n" + "=" * 70)
    print("  DEMO: Transformer Neural Network AI")
    print("=" * 70)
    
    try:
        from transformer_ai import ChessTransformer, TransformerChessAI
        from board import Board
        import torch
        
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        print(f"\nUsing device: {device}")
        
        # Create model
        print("\nInitializing transformer model...")
        model = ChessTransformer(
            d_model=256,
            num_heads=8,
            num_layers=4,
            d_ff=1024,
            dropout=0.1
        )
        
        model = model.to(device)
        print(f"Model parameters: {sum(p.numel() for p in model.parameters()):,}")
        
        # Create AI
        transformer_ai = TransformerChessAI(model, search_depth=2, device=device)
        
        # Evaluate initial position
        board = Board()
        print("\nEvaluating initial position...")
        eval_score = transformer_ai.evaluate(board)
        print(f"Position evaluation: {eval_score:.4f}")
        
        # Predict top moves
        print("\nPredicting top 5 moves...")
        top_moves = transformer_ai.predict_top_moves(board, top_k=5)
        
        print("\nTop 5 predicted moves:")
        files = "abcdefgh"
        for i, (from_pos, to_pos, prob) in enumerate(top_moves, 1):
            move_str = files[from_pos[1]] + str(8 - from_pos[0]) + files[to_pos[1]] + str(8 - to_pos[0])
            print(f"  {i}. {move_str}: {prob:.4f}")
        
        print(f"\nPositions evaluated: {transformer_ai.nodes_evaluated}")
        print("\n✓ Transformer AI demo complete!")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True


def demo_attention_visualization():
    """Demonstrate attention weight visualization"""
    print("\n" + "=" * 70)
    print("  DEMO: Attention Weight Visualization")
    print("=" * 70)
    
    try:
        from transformer_ai import ChessTransformer, TransformerChessAI
        from board import Board
        import numpy as np
        import torch
        
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        
        # Create and use model
        model = ChessTransformer(d_model=256, num_heads=8, num_layers=4, d_ff=1024)
        model = model.to(device)
        
        ai = TransformerChessAI(model, search_depth=2, device=device)
        board = Board()
        
        # Get attention weights
        print("\nExtracting attention weights...")
        attention_weights = ai.get_attention_weights(board, layer=0)
        
        print(f"Attention shape: {attention_weights.shape}")
        print(f"  - Heads: {attention_weights.shape[0]}")
        print(f"  - Rows: {attention_weights.shape[1]}")
        print(f"  - Cols: {attention_weights.shape[2]}")
        
        # Show sample attention
        print("\nSample attention for head 0:")
        print("Showing which squares attend to each other")
        for i in range(8):
            row_str = " ".join([f"{attention_weights[0, i, j]:.2f}" for j in range(8)])
            print(f"  Row {i}: {row_str}")
        
        print("\n✓ Attention visualization demo complete!")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True


def demo_training():
    """Demonstrate model training"""
    print("\n" + "=" * 70)
    print("  DEMO: Transformer Model Training")
    print("=" * 70)
    
    try:
        from transformer_ai import (
            ChessTransformer, ChessTransformerTrainer,
            create_training_data, ChessDataLoader
        )
        import torch
        
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        print(f"\nUsing device: {device}")
        
        # Create model
        print("\nCreating model...")
        model = ChessTransformer(d_model=128, num_heads=4, num_layers=2, d_ff=512)
        model = model.to(device)
        
        # Create trainer
        trainer = ChessTransformerTrainer(model, device)
        
        # Generate training data
        print("\nGenerating synthetic training data...")
        train_data = create_training_data(50)
        train_loader = ChessDataLoader(train_data, batch_size=4)
        print(f"Training samples: {len(train_data)}")
        print(f"Batch size: 4")
        print(f"Batches per epoch: {len(train_loader)}")
        
        # Train for 2 epochs
        print("\nTraining for 2 epochs...")
        results = None
        for epoch in range(2):
            results = trainer.train_epoch(train_loader, epoch)
            print(f"\nEpoch {epoch + 1}:")
            print(f"  Total Loss: {results['total_loss']:.4f}")
            print(f"  Eval Loss: {results['eval_loss']:.4f}")
            print(f"  Move Loss: {results['move_loss']:.4f}")
        
        # Save model
        print("\nSaving model...")
        model_path = 'demo_transformer_model.pth'
        trainer.save_checkpoint(model_path, epoch=2, loss=results['total_loss'] if results else 0.0)
        print(f"Model saved to: {model_path}")
        
        print("\n✓ Training demo complete!")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True


def demo_learning_module():
    """Demonstrate learning resources"""
    print("\n" + "=" * 70)
    print("  DEMO: Chess Learning Resources")
    print("=" * 70)
    
    try:
        from learning_module import ChessLearningResources
        
        resources = ChessLearningResources()
        
        print("\nAvailable Learning Categories:")
        print(f"  1. {resources.chess_basics['title']}")
        print(f"  2. {resources.strategies['title']}")
        print(f"  3. {resources.tactics['title']}")
        print(f"  4. {resources.openings['title']}")
        print(f"  5. Interactive Lessons ({len(resources.lessons)} lessons)")
        
        # Show sample content
        print("\n" + "-" * 70)
        print(f"Sample: {resources.tactics['title']}")
        print("-" * 70)
        print(resources.tactics['content'][:500] + "...")
        
        print("\n✓ Learning module demo complete!")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        return False
    
    return True


def demo_scraper():
    """Demonstrate web scraping system"""
    print("\n" + "=" * 70)
    print("  DEMO: Web Scraping System")
    print("=" * 70)
    
    try:
        from nano_scraper import NanoScraper
        
        print("\nInitializing scraper...")
        scraper = NanoScraper()
        
        print(f"\nLoaded {len(scraper.rules)} scraping rules")
        print(f"Loaded {len(scraper.data_sources)} data sources")
        
        print("\nAvailable Rules:")
        for rule in scraper.rules:
            print(f"  - {rule.name} (priority: {rule.priority}, enabled: {rule.enabled})")
        
        # Run scraping
        print("\nRunning scraping rules...")
        results = scraper.run_all_rules()
        print(f"Scraped {len(results)} items")
        
        # Show stats
        stats = scraper.get_stats()
        print("\nStatistics:")
        for key, value in stats.items():
            print(f"  {key}: {value}")
        
        print("\n✓ Scraper demo complete!")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        return False
    
    return True


def run_comparison():
    """Compare traditional vs transformer AI"""
    print("\n" + "=" * 70)
    print("  COMPARISON: Traditional vs Transformer AI")
    print("=" * 70)
    
    try:
        from board import Board
        from ai import ChessAI
        from transformer_ai import ChessTransformer, TransformerChessAI
        
        board = Board()
        
        # Traditional AI
        print("\nTraditional AI (Minimax):")
        traditional_ai = ChessAI(depth=3)
        traditional_ai.get_best_move(board)
        print(f"  Nodes evaluated: {traditional_ai.nodes_evaluated}")
        print(f"  Algorithm: Minimax with alpha-beta pruning")
        print(f"  Depth: 3")
        print(f"  Evaluation: Piece-square tables + mobility")
        
        # Transformer AI
        print("\nTransformer AI:")
        import torch
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        model = ChessTransformer(d_model=256, num_heads=8, num_layers=4, d_ff=1024)
        model = model.to(device)
        transformer_ai = TransformerChessAI(model, search_depth=2, device=device)
        
        # Just evaluate (not full search)
        eval_score = transformer_ai.evaluate(board)
        print(f"  Evaluation score: {eval_score:.4f}")
        print(f"  Architecture: Multi-head attention + positional encoding")
        print(f"  Parameters: {sum(p.numel() for p in model.parameters()):,}")
        print(f"  Advantages: Learns patterns, long-range understanding")
        
        print("\n✓ Comparison complete!")
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        return False
    
    return True


def main_menu():
    """Main menu for demonstrations"""
    print("\n" + "=" * 70)
    print("  CHESS TRANSFORMER AI - FULL CAPABILITIES DEMO")
    print("=" * 70)
    print()
    print("Select a demonstration:")
    print()
    print("  1. Check Dependencies")
    print("  2. Traditional AI Demo")
    print("  3. Transformer AI Demo")
    print("  4. Attention Visualization")
    print("  5. Model Training")
    print("  6. Learning Resources")
    print("  7. Web Scraper")
    print("  8. AI Comparison")
    print("  9. Run All Demos")
    print("  0. Exit")
    print()
    
    while True:
        try:
            choice = input("Enter your choice (0-9): ").strip()
            
            if choice == '0':
                print("\nGoodbye!")
                break
            elif choice == '1':
                check_dependencies()
            elif choice == '2':
                demo_traditional_ai()
            elif choice == '3':
                demo_transformer_ai()
            elif choice == '4':
                demo_attention_visualization()
            elif choice == '5':
                demo_training()
            elif choice == '6':
                demo_learning_module()
            elif choice == '7':
                demo_scraper()
            elif choice == '8':
                run_comparison()
            elif choice == '9':
                check_dependencies()
                demo_traditional_ai()
                demo_transformer_ai()
                demo_attention_visualization()
                demo_training()
                demo_learning_module()
                demo_scraper()
                run_comparison()
            else:
                print("Invalid choice. Please enter 0-9.")
            
            print("\n" + "-" * 70)
            input("\nPress Enter to continue...")
            print()
            
            # Reprint menu
            print("=" * 70)
            print("  CHESS TRANSFORMER AI - FULL CAPABILITIES DEMO")
            print("=" * 70)
            print()
            print("Select a demonstration:")
            print("  0. Exit")
            print("  1. Check Dependencies")
            print("  2. Traditional AI Demo")
            print("  3. Transformer AI Demo")
            print("  4. Attention Visualization")
            print("  5. Model Training")
            print("  6. Learning Resources")
            print("  7. Web Scraper")
            print("  8. AI Comparison")
            print("  9. Run All Demos")
            print()
            
        except KeyboardInterrupt:
            print("\n\nGoodbye!")
            break
        except Exception as e:
            print(f"\nError: {e}")
            import traceback
            traceback.print_exc()


if __name__ == '__main__':
    main_menu()
