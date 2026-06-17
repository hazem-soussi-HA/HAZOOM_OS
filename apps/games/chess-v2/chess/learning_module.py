"""
Chess Learning Resources Module
Provides built-in chess tutorials, strategies, and documentation
"""

import pygame
import pygame_menu


class ChessLearningResources:
    def __init__(self):
        self.chess_basics = self._load_chess_basics()
        self.strategies = self._load_strategies()
        self.tactics = self._load_tactics()
        self.openings = self._load_openings()
        self.lessons = self._load_lessons()
    
    def _load_chess_basics(self):
        return {
            "title": "Chess Basics",
            "content": """
Welcome to Chess! Here are the fundamentals:

BOARD SETUP:
- 8x8 grid with 64 squares
- Light square on bottom-right corner
- Files (columns) labeled a-h
- Ranks (rows) numbered 1-8

PIECES AND MOVEMENT:

PAWN (♙):
- Moves forward 1 square
- On first move, can advance 2 squares
- Captures diagonally forward
- Promotes to Queen/other piece when reaching end

KNIGHT (♘):
- Moves in 'L' shape: 2 squares + 1 square turn
- Can jump over other pieces
- 8 possible moves

BISHOP (♗):
- Moves diagonally any number of squares
- Stays on same color squares
- 2 bishops (light/dark square)

ROOK (♖):
- Moves horizontally/vertically any number of squares
- 2 rooks

QUEEN (♕):
- Most powerful piece
- Moves horizontally, vertically, or diagonally
- Any number of squares

KING (♔):
- Moves 1 square in any direction
- Must be protected at all costs
- Can castle (special move)
            """,
            "examples": [
                "Pawn: e2 to e4 (2 squares) or e4 to e5 (1 square)",
                "Knight: b1 to c3 (L-shape)",
                "Bishop: c1 to g5 (diagonal)",
                "Rook: a1 to a5 (vertical)",
                "Queen: d1 to h5 (diagonal)",
                "King: e1 to e2 (one square)"
            ]
        }
    
    def _load_strategies(self):
        return {
            "title": "Chess Strategy",
            "content": """
STRATEGIC PRINCIPLES:

1. CONTROL THE CENTER:
   - Center squares: d4, d5, e4, e5
   - Pawns and knights in center control board

2. PIECE DEVELOPMENT:
   - Develop knights and bishops early
   - Don't move same piece twice in opening
   - Castle early to protect king

3. KING SAFETY:
   - Castle kingside or queenside
   - Keep pawn shield around king
   - Avoid opening lines to your king

4. PIECE ACTIVITY:
   - Place pieces on active squares
   - Improve piece positions
   - Don't block own pieces

5. PAWN STRUCTURE:
   - Avoid pawn weaknesses (isolated, doubled)
   - Create pawn chains
   - Control key squares with pawns

6. TIME MANAGEMENT:
   - Value each move
   - Don't waste tempi
   - Make each move count
            """,
            "tips": [
                "Control center with pawns early (e4, d4)",
                "Develop knights before bishops",
                "Castle within first 10 moves",
                "Don't bring queen out too early",
                "Connect your rooks in middlegame",
                "Create and maintain pawn structure"
            ]
        }
    
    def _load_tactics(self):
        return {
            "title": "Tactical Patterns",
            "content": """
COMMON TACTICS:

1. FORK:
   - One piece attacks two or more pieces
   - Knights and pawns are great for forks
   - Example: Knight fork King and Queen

2. PIN:
   - Piece cannot move because it exposes more valuable piece
   - Pin to king (absolute) or other piece (relative)
   - Attack pinned piece with lesser value

3. SKEWER:
   - Attacks valuable piece, forces it to move, exposing piece behind
   - Opposite of pin
   - Often uses queen or rook

4. DISCOVERED ATTACK:
   - Moving one piece reveals attack by another
   - Can be devastating if piece in front also attacks
   - Example: Move bishop, rook behind attacks queen

5. DECOY:
   - Lure piece to vulnerable square
   - Often sacrifices to achieve
   - Example: Sacrifice to lure king out

6. OVERLOADING:
   - Piece must defend too many things
   - Attack one of its defenses
   - Example: Queen overloads protecting two pieces
            """,
            "examples": [
                "Fork: Knight attacks King and Queen simultaneously",
                "Pin: Bishop pins Queen to King",
                "Skewer: Rook attacks Queen, revealing attack on King",
                "Discovered attack: Move bishop, rook behind attacks"
            ]
        }
    
    def _load_openings(self):
        return {
            "title": "Opening Principles",
            "content": """
OPENING FUNDAMENTALS:

1. CONTROL THE CENTER:
   - e4 or d4 are best first moves
   - Develop pieces to control center
   - Create pawn center

POPULAR OPENINGS:

1. ITALIAN GAME (1.e4 e5 2.Nf3 Nc6 3.Bc4):
   - Controls center
   - Develops bishop aggressively
   - Good for beginners

2. SICILIAN DEFENSE (1.e4 c5):
   - Aggressive counter-attacking
   - Unbalanced positions
   - Complex but rewarding

3. QUEEN'S GAMBIT (1.d4 d5 2.c4):
   - Classical opening
   - Challenges center
   - Solid and positional

4. CARO-KANN DEFENSE (1.e4 c6 2.d4 d5):
   - Solid and reliable
   - Good pawn structure
   - Hard to attack

5. FRENCH DEFENSE (1.e4 e6):
   - Solid but cramped
   - Counter-attacks center
   - Strategic complexity
            """,
            "principles": [
                "Develop knights and bishops",
                "Castle early",
                "Control center squares",
                "Don't move same piece twice",
                "Connect rooks before attacking"
            ]
        }
    
    def _load_lessons(self):
        return [
            {
                "title": "Lesson 1: The Pawn",
                "level": "Beginner",
                "content": """
Lesson 1: Understanding the Pawn

The pawn is the most numerous but least powerful piece.

KEY POINTS:
- Pawns move forward only
- On first move, can move 2 squares
- Pawns capture diagonally
- Pawns promote when reaching the opposite end

PRACTICE:
1. Set up a pawn on e2
2. Try moving it to e4 (2 squares)
3. From e4, move to e5 (1 square)
4. Place an opponent piece on d5
5. Capture it with e5xd4

ADVANCED: En Passant
- Special pawn capture rule
- Only available immediately after opponent moves pawn 2 squares
- Capture as if pawn only moved 1 square
                """
            },
            {
                "title": "Lesson 2: Knight Movement",
                "level": "Beginner",
                "content": """
Lesson 2: The Knight

The knight is unique - it's the only piece that can jump!

KEY POINTS:
- Moves in L-shape: 2 squares one direction, 1 square perpendicular
- Can jump over other pieces
- 8 possible moves from center

KNIGHT MOVES FROM E4:
- c5, d6, f6, g5 (vertical L)
- c3, d2, f2, g3 (vertical L)

PRACTICE:
1. Place knight on b1
2. Move knight to c3
3. From c3, try reaching d5 in fewest moves
4. Practice knight jumps around the board

TIP: Knights are great in closed positions where they can jump
                """
            },
            {
                "title": "Lesson 3: Checkmate Patterns",
                "level": "Intermediate",
                "content": """
Lesson 3: Checkmate Patterns

Knowing basic checkmate patterns is essential.

PATTERNS:

1. BACK RANK MATE:
   - Rook or Queen attacks king on back rank
   - King has no escape squares
   - Often with trapped pieces

2. SCHOLAR'S MATE:
   - 4-move checkmate with queen and bishop
   - Against poor play: 1.e4 e5 2.Bc4 Nc6 3.Qh5 Nf6?? 4.Qxf7#
   - Learn to avoid this!

3. SMOTHERED MATE:
   - King surrounded by own pieces
   - Knight delivers final blow
   - Example: Queen sacrifice to expose king

PRACTICE:
- Set up back rank mate patterns
- Practice scholar's mate (and how to defend!)
- Study smothered mate sequences
                """
            },
            {
                "title": "Lesson 4: Opening Principles",
                "level": "Beginner",
                "content": """
Lesson 4: Opening Principles

Good opening play is crucial for success.

PRINCIPLES (in order):

1. CONTROL THE CENTER:
   - Start with e4 or d4
   - Develop pieces to center
   - Create pawn center

2. DEVELOP PIECES:
   - Knights before bishops
   - Don't move same piece twice
   - Develop all pieces quickly

3. KING SAFETY:
   - Castle early (within 10 moves)
   - Don't delay castling
   - Keep king safe

4. CONNECT ROOKS:
   - When pieces developed, rooks connected
   - Then consider attacking

BAD HABITS TO AVOID:
- Bringing queen out early
- Making too many pawn moves
- Attacking before development
- Moving same piece repeatedly

PRACTICE:
- Play games following these principles
- Check your opening moves against principles
                """
            }
        ]
    
    def show_menu(self, screen):
        menu = pygame_menu.Menu(
            'Chess Learning Resources',
            600, 500,
            theme=pygame_menu.themes.THEME_DARK
        )
        
        menu.add.button('Chess Basics', lambda: self.show_content(screen, self.chess_basics))
        menu.add.button('Strategy', lambda: self.show_content(screen, self.strategies))
        menu.add.button('Tactics', lambda: self.show_content(screen, self.tactics))
        menu.add.button('Openings', lambda: self.show_content(screen, self.openings))
        menu.add.button('Lessons', lambda: self.show_lessons_menu(screen))
        menu.add.button('Back', pygame_menu.events.BACK)
        
        menu.mainloop(screen)
    
    def show_content(self, screen, content_data):
        menu = pygame_menu.Menu(
            content_data['title'],
            700, 600,
            theme=pygame_menu.themes.THEME_DARK
        )
        
        menu.add.label(content_data['content'], max_char=-1, font_size=20)
        
        if 'examples' in content_data:
            menu.add.label('\nExamples:', font_size=22, font_name=pygame_menu.font.FONT_OPEN_SANS_BOLD)
            for example in content_data['examples']:
                menu.add_label(f"• {example}", max_char=-1, font_size=18)
        
        if 'tips' in content_data:
            menu.add_label('\nTips:', font_size=22, font_name=pygame_menu.font.FONT_OPEN_SANS_BOLD)
            for tip in content_data['tips']:
                menu.add_label(f"• {tip}", max_char=-1, font_size=18)
        
        menu.add.button('Back', pygame_menu.events.BACK)
        menu.mainloop(screen)
    
    def show_lessons_menu(self, screen):
        menu = pygame_menu.Menu(
            'Interactive Lessons',
            600, 500,
            theme=pygame_menu.themes.THEME_DARK
        )
        
        for lesson in self.lessons:
            lesson_text = f"{lesson['title']} ({lesson['level']})"
            menu.add.button(lesson_text, lambda l=lesson: self.show_lesson(screen, l))
        
        menu.add.button('Back', pygame_menu.events.BACK)
        menu.mainloop(screen)
    
    def show_lesson(self, screen, lesson):
        menu = pygame_menu.Menu(
            lesson['title'],
            700, 600,
            theme=pygame_menu.themes.THEME_DARK
        )
        
        menu.add_label(lesson['content'], max_char=-1, font_size=18)
        menu.add.button('Complete Lesson', pygame_menu.events.BACK)
        menu.mainloop(screen)


class ChessTutorial:
    def __init__(self, board, gui):
        self.board = board
        self.gui = gui
        self.current_step = 0
        self.lessons = self._create_lessons()
        self.current_lesson = None
        self.showing_lesson = False
    
    def _create_lessons(self):
        return [
            {
                "name": "Basic Moves",
                "steps": [
                    {
                        "instruction": "Welcome! Let's learn basic moves. Click on the white pawn on e2.",
                        "highlight": [(6, 4)],
                        "expected_move": None,
                        "success": "Good! Pawns can move 1 or 2 squares on their first move."
                    },
                    {
                        "instruction": "Now move the pawn from e2 to e4. Click on the pawn, then click e4.",
                        "highlight": [(6, 4), (4, 4)],
                        "expected_move": ((6, 4), (4, 4)),
                        "success": "Excellent! The pawn has moved 2 squares forward."
                    },
                    {
                        "instruction": "Now let's try the knight. Click on the white knight on g1.",
                        "highlight": [(7, 6)],
                        "expected_move": None,
                        "success": "Knights move in an L-shape pattern."
                    },
                    {
                        "instruction": "Move the knight from g1 to f3. Knights can jump over pieces!",
                        "highlight": [(7, 6), (5, 5)],
                        "expected_move": ((7, 6), (5, 5)),
                        "success": "Perfect! You've learned how knights move!"
                    }
                ]
            },
            {
                "name": "Checkmate Pattern",
                "steps": [
                    {
                        "instruction": "Let's learn a basic checkmate pattern. This is the Scholar's Mate.",
                        "highlight": [(7, 3)],
                        "expected_move": None,
                        "success": ""
                    }
                ]
            }
        ]
    
    def start_lesson(self, lesson_index):
        self.current_lesson = self.lessons[lesson_index]
        self.current_step = 0
        self.showing_lesson = True
    
    def get_current_step(self):
        if self.current_lesson and self.current_step < len(self.current_lesson['steps']):
            return self.current_lesson['steps'][self.current_step]
        return None
    
    def check_move(self, from_pos, to_pos):
        if not self.showing_lesson:
            return None
        
        step = self.get_current_step()
        if step and step['expected_move']:
            if step['expected_move'] == (from_pos, to_pos):
                self.current_step += 1
                return step['success']
        
        return "That's not quite right. Try again!"
    
    def is_complete(self):
        if not self.current_lesson:
            return False
        return self.current_step >= len(self.current_lesson['steps'])
    
    def next_lesson(self):
        current_index = self.lessons.index(self.current_lesson)
        if current_index + 1 < len(self.lessons):
            self.start_lesson(current_index + 1)
            return True
        return False
    
    def get_highlight_squares(self):
        step = self.get_current_step()
        if step and 'highlight' in step:
            return step['highlight']
        return []
    
    def get_instruction(self):
        step = self.get_current_step()
        if step and 'instruction' in step:
            return step['instruction']
        return ""
