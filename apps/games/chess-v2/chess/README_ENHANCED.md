# Super Goose Chess - Enhanced GUI Version 🦆♟️

A fully-featured chess game with AI opponent, graphical interface, and interactive learning system built from scratch.

![Chess](https://img.shields.io/badge/Chess-AI%20Powered-blue)
![Python](https://img.shields.io/badge/Python-3.7%2B-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🎯 New Features (Enhanced Version)

### 🖥️ Graphical Interface
- **Main Menu System**: Easy navigation between game modes and learning resources
- **Interactive Board**: Click-to-move interface with visual feedback
- **Sidebar Controls**: Quick access to hints, help, and menu
- **Move History**: Track all moves during gameplay
- **Game Status Display**: Real-time information about turn, check, and game state

### 📚 Learning Resources
- **Chess Basics**: Comprehensive guide to piece movements and rules
- **Strategy**: Strategic principles for improvement
- **Tactics**: Common tactical patterns with examples
- **Openings**: Opening principles and popular opening systems
- **Interactive Lessons**: Step-by-step guided tutorials
- **Chess Books**: Curated list of famous chess books

### 🤖 Enhanced AI Features
- **Hint System**: Get AI suggestions during gameplay (Press H)
- **Move Analysis**: AI evaluates best moves
- **Configurable Difficulty**: Adjustable AI search depth
- **Opening Book**: Strong opening play

### 🎓 Tutorial Mode
- **Interactive Lessons**: Learn piece movements, checkmate patterns, and more
- **Visual Feedback**: Highlighted squares and clear instructions
- **Progress Tracking**: Complete lessons at your own pace

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

### Graphical Interface (Recommended)
Run the enhanced GUI with:
```bash
python game.py --gui
```

### Game Modes
1. **Play vs AI**: Play against the computer
2. **Play vs Human**: Two-player mode on same computer
3. **Tutorial Mode**: Interactive guided lessons
4. **Learning Resources**: Access chess tutorials, strategies, and books

### Controls
- **Mouse Click**: Select and move pieces
- **H**: Show hint (AI suggests best move)
- **U**: Toggle help overlay
- **R**: Reset game
- **ESC**: Return to main menu

### Command-Line Interface
Run the CLI version with:
```bash
python game.py
```

You'll be asked to choose:
1. Play as White (you move first)
2. Play as Black (AI moves first)
3. Watch AI vs AI

Enter moves in algebraic notation: `e2e4`, `b1c3`, etc.

## 📖 Learning Features

### Built-in Chess Documentation
The app includes comprehensive chess learning materials:

#### Chess Basics
- Board setup and piece placement
- How each piece moves
- Special moves (castling, en passant, promotion)
- Check, checkmate, and stalemate

#### Strategy
- Controlling the center
- Piece development principles
- King safety
- Pawn structure
- Positional play

#### Tactics
- Forks, pins, and skewers
- Discovered attacks
- Decoys and overloading
- Practice examples

#### Openings
- Opening principles
- Popular opening systems (Italian Game, Sicilian, Queen's Gambit, etc.)
- When and why to play each opening

#### Interactive Lessons
- Lesson 1: The Pawn
- Lesson 2: Knight Movement
- Lesson 3: Checkmate Patterns
- Lesson 4: Opening Principles

### Web Resources (Safe Scraping)
The app can fetch chess learning resources from the internet safely:
- Respects robots.txt
- Rate-limited requests
- Local caching
- Curated book lists
- Training puzzles
- Learning plans by skill level

## 🧠 AI Intelligence Features

### Search Algorithm
- **Minimax with Alpha-Beta Pruning**: Efficiently explores the game tree
- **Configurable Depth**: Adjust from 1-7 (higher = smarter but slower)

### Evaluation
The AI evaluates positions based on:
1. **Material Balance**: Standard piece values
2. **Position**: Piece-square tables for optimal placement
3. **Mobility**: Number of available moves
4. **King Safety**: Pawn shield and exposure

### Hint System
During gameplay, press **H** to get a hint:
- AI analyzes current position
- Highlights suggested piece move
- Shows algebraic notation of best move

## 📊 Learning Resources Module

### Chess Books
Curated list of famous chess books:
- My System (Nimzowitsch)
- Logical Chess: Move by Move (Chernev)
- The Amateur's Mind (Silman)
- My 60 Memorable Games (Fischer)
- And more!

### Training Puzzles
Sample tactical puzzles with:
- FEN notation
- Solutions
- Difficulty levels
- Tactical themes

### Learning Plans
Structured plans for different skill levels:
- **Beginner**: 3-6 months
- **Intermediate**: 6-12 months
- **Advanced**: 12+ months

Each plan includes:
- Specific goals
- Recommended resources
- Practice exercises

## 🔧 Customization

### AI Difficulty
Edit the depth in `ai.py`:
```python
# In ChessAI.__init__:
self.depth = 4  # Try 2 for easier, 6 for harder
```

### Game Settings
In the enhanced GUI:
- Toggle hints on/off
- Enable/disable opening book
- Adjust AI difficulty (future feature)

## 📁 Project Structure

```
chess/
├── pieces.py              # Piece classes and movement logic
├── board.py               # Board representation and game state
├── ai.py                  # AI engine with minimax algorithm
├── game.py                # Main entry point (CLI + GUI launcher)
├── gui.py                 # Basic pygame GUI (legacy)
├── enhanced_gui.py         # Enhanced GUI with learning features
├── learning_module.py      # Built-in learning resources
├── chess_resources.py      # Web resources fetcher
├── test_chess.py          # Test suite
├── requirements.txt        # Python dependencies
├── assets/               # Piece images
│   ├── wk.png, wp.png    # White pieces
│   ├── bk.png, bp.png    # Black pieces
│   └── ...              # Other pieces
└── README_ENHANCED.md    # This file
```

## 🎨 GUI Features

### Main Menu
- Clean, intuitive interface
- Easy mode selection
- Quick access to learning resources

### Game Screen
- Interactive chessboard
- Sidebar with:
  - Hint button
  - Help toggle
  - Menu button
  - Game info (turn, move number)
  - Controls reference
  - Last hint display

### Learning Resources Menu
- Browse tutorials by topic
- Interactive lessons
- Chess books catalog
- Strategy guides

### Visual Feedback
- Selected piece highlighting (yellow)
- Valid move indicators (dots)
- Hint highlighting (orange)
- Check notifications
- Game over screens

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

## 🤝 Contributing

Contributions welcome! Suggestions:
- More interactive lessons
- Additional tutorial topics
- More puzzles and patterns
- GUI enhancements
- Multiplayer online mode

## 📊 Performance

- **Search Speed**: ~10,000-100,000 positions/second
- **Memory Usage**: ~10-50MB
- **Recommended Depth**: 3-5 for balanced play

## 🎓 Learning Resources

### Online Resources
The app can fetch (with permission):
- Wikipedia chess articles
- Chess tutorials
- Opening theory
- Tactical patterns

### Recommended External Sites
- Chess.com - Lessons and puzzles
- Lichess.org - Free play and training
- Chess24.com - Video lessons
- Chessable.com - Interactive courses

## 📝 Advanced Features

### AI Analysis
The AI provides:
- Best move suggestions
- Position evaluation
- Tactical motifs
- Opening recommendations

### Tutorial System
Features:
- Step-by-step guidance
- Visual highlighting
- Move verification
- Progress tracking

### Safe Web Scraping
The resources fetcher includes:
- Robots.txt compliance
- Rate limiting (2 second intervals)
- Content caching (7 days)
- Error handling
- Static fallback data

## 🔮 Future Enhancements

- [ ] Progress tracking and statistics
- [ ] Puzzle mode with thousands of positions
- [ ] Opening trainer
- [ ] Endgame practice
- [ ] Game analysis with engine
- [ ] PGN import/export
- [ ] Time control support
- [ ] Online multiplayer
- [ ] Neural network evaluation
- [ ] More interactive lessons

## 🐛 Known Issues

- GUI window size fixed
- No piece promotion UI (auto-promotes to queen)
- Limited opening book
- Basic endgame play (no tablebases)

## 🙏 Acknowledgments

- Built as demonstration of Super Goose Intelligence
- Inspired by classic chess engines
- Learning content from chess education resources
- Piece images from standard chess sets

---

**Enjoy Super Goose Chess! Learn and improve together! 🦆**
