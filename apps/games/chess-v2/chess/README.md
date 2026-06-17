# Super Goose Chess 🦆♟️

A fully-featured chess game with AI opponent, built from scratch as a demonstration of Super Goose Intelligence.

![Chess](https://img.shields.io/badge/Chess-AI%20Powered-blue)
![Python](https://img.shields.io/badge/Python-3.7%2B-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🎯 Features

- **Complete Chess Engine**: Implements all standard chess rules including:
  - All piece movements (Pawn, Knight, Bishop, Rook, Queen, King)
  - Special moves: Castling (kingside & queenside), En Passant, Pawn Promotion
  - Check, Checkmate, and Stalemate detection
  - 50-move rule and move tracking

- **Super Goose Intelligence AI**:
  - Minimax algorithm with Alpha-Beta pruning
  - Configurable search depth
  - Piece-square evaluation tables for positional play
  - Opening book for strong opening play
  - Move ordering for efficient search
  - King safety evaluation
  - Mobility assessment

- **Beautiful CLI Interface**:
  - Color-coded pieces (using Unicode symbols)
  - Clean board display
  - Move history tracking
  - Check/checkmate notifications

- **Flexible Game Modes**:
  - Play as White or Black
  - Watch AI vs AI
  - Adjustable AI difficulty (search depth)

## 📋 Requirements

- Python 3.7 or higher
- Dependencies (install via pip):
  - `chess>=1.10.0` - For additional chess utilities
  - `numpy>=1.24.0` - For numerical operations
  - `colorama>=0.4.6` - For colored terminal output

## 🚀 Installation

1. Clone or download the project:
```bash
git clone <repository-url>
cd chess
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## 🎮 How to Play

### Starting the Game
Run the game with:
```bash
python game.py
```

### Game Setup
You'll be prompted to choose a game mode:
1. Play as White (you move first)
2. Play as Black (AI moves first)
3. Watch AI vs AI

### Making Moves
Enter moves in algebraic notation: `from-to format`

Examples:
- `e2e4` - Move pawn from e2 to e4
- `b1c3` - Move knight from b1 to c3
- `e1g1` - Castle kingside

### Special Commands
- `quit`, `exit`, or `q` - Exit the game

## 🧠 AI Intelligence Features

### Search Algorithm
- **Minimax with Alpha-Beta Pruning**: Efficiently explores the game tree to find the best move
- **Configurable Depth**: Adjust from 1-7 (higher = smarter but slower)

### Evaluation
The AI evaluates positions based on:
1. **Material Balance**: Standard piece values
   - Pawn: 100
   - Knight: 320
   - Bishop: 330
   - Rook: 500
   - Queen: 900
   - King: 20000 (infinite)

2. **Position**: Piece-square tables reward:
   - Pawns: Advancement and center control
   - Knights: Central positioning
   - Bishops: Diagonal control
   - Rooks: Open files and 7th rank
   - Queen: Balance of center and safety
   - King: Safety in middlegame, activity in endgame

3. **Mobility**: Number of available moves
4. **King Safety**: Pawn shield and exposure

### Opening Book
Built-in opening moves for strong opening play:
- White: e4, d4, Nf3, c4, Nc3
- Black: e5, c5, e6, Nf6, d5

## 🧪 Testing

Run the test suite:
```bash
python test_chess.py
```

Tests cover:
- Piece movement validation
- Board state management
- Move legality checks
- Check/checkmate detection
- AI move generation
- Integration scenarios

## 📁 Project Structure

```
chess/
├── pieces.py       # Piece classes and movement logic
├── board.py        # Board representation and game state
├── ai.py           # AI engine with minimax algorithm
├── game.py         # CLI interface and game loop
├── test_chess.py   # Test suite
├── requirements.txt # Python dependencies
└── README.md       # This file
```

## 🎨 Usage Examples

### Playing a Game
```python
from game import ChessCLI

# Start a game against the AI
cli = ChessCLI()
cli.player_color = Color.WHITE
cli.play()
```

### Using the AI Programmatically
```python
from board import Board
from ai import ChessAI

# Create board and AI
board = Board()
ai = ChessAI(depth=4)

# Get best move for current position
best_move = ai.get_best_move(board)
if best_move:
    from_pos, to_pos = best_move
    board.make_move(from_pos, to_pos)
```

### Setting AI Difficulty
```python
ai = ChessAI(depth=6)  # Harder
ai = ChessAI(depth=2)  # Easier

# Disable opening book
ai.set_opening_book_enabled(False)
```

## 🔧 Customization

### Adjusting AI Depth
Edit the depth in `game.py` or `ai.py`:
```python
# In ChessAI.__init__:
self.depth = 4  # Try 2 for easier, 6 for harder
```

### Adding Opening Moves
Add to `opening_book` in `ai.py`:
```python
self.opening_book = {
    Color.WHITE: [
        "e2e4", "d2d4", "g1f3", "c2c4", "b1c3",
        "d2d3"  # Add your move
    ],
    Color.BLACK: [...]
}
```

### Modifying Evaluation
Adjust piece values in `ai.py` or modify position tables.

## 🤝 Contributing

Contributions are welcome! Suggested improvements:
- Endgame tablebase integration
- Transposition table for caching
- Additional opening books
- Time management for tournament play
- GUI interface
- PGN file import/export
- Perft testing suite

## 📊 Performance

- **Search Speed**: ~10,000-100,000 positions/second (depends on depth)
- **Memory Usage**: ~10-50MB (depends on search depth)
- **Recommended Depth**: 
  - Quick games: 3-4
  - Balanced: 4-5
  - Deep thinking: 5-6

## 🎓 Learning Resources

This project demonstrates:
- Game tree search algorithms
- Alpha-beta pruning optimization
- Position evaluation techniques
- Object-oriented programming
- Test-driven development

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built as a demonstration of Super Goose Intelligence
- Inspired by classic chess engines (Stockfish, Crafty)
- Piece-square tables based on common chess evaluation principles

## 🐛 Known Limitations

- No GUI (CLI only)
- No time management
- No pondering (thinking while opponent moves)
- No transposition table
- Limited opening book
- Basic endgame play (no tablebases)

## 🔮 Future Enhancements

- [ ] Graphical interface (pygame or Tkinter)
- [ ] Time control support
- [ ] PGN import/export
- [ ] Online multiplayer mode
- [ ] Opening book generator
- [ ] Endgame tablebase integration
- [ ] Neural network evaluation
- [ ] Parallel search (multi-core)

---

**Enjoy Super Goose Chess! May your moves be as strategic as a goose's migration! 🦆**
