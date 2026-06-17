"""
Command-line interface for playing Super Goose Chess.
"""

from typing import Optional
from board import Board
from ai import ChessAI
from pieces import Color
import sys
import argparse


try:
    from colorama import init, Fore, Style
    init()  # Initialize colorama
    HAS_COLORS = True
except ImportError:
    HAS_COLORS = False
    Fore = None
    Style = None


class ChessCLI:
    """Command-line interface for the chess game."""
    
    def __init__(self):
        self.board = Board()
        self.ai = ChessAI(depth=4, use_opening_book=True)
        self.player_color = Color.WHITE
        self.game_over = False
        self.ai_enabled = True
        
        # Piece symbols for display
        self.piece_symbols = {
            'P': '♙' if HAS_COLORS else 'P',
            'N': '♘' if HAS_COLORS else 'N',
            'B': '♗' if HAS_COLORS else 'B',
            'R': '♖' if HAS_COLORS else 'R',
            'Q': '♕' if HAS_COLORS else 'Q',
            'K': '♔' if HAS_COLORS else 'K',
            'p': '♟' if HAS_COLORS else 'p',
            'n': '♞' if HAS_COLORS else 'n',
            'b': '♝' if HAS_COLORS else 'b',
            'r': '♜' if HAS_COLORS else 'r',
            'q': '♛' if HAS_COLORS else 'q',
            'k': '♚' if HAS_COLORS else 'k'
        }
    
    def display_board(self):
        """Display the chess board with colors."""
        # Show game info
        self._display_game_info()
        
        # Display the board
        files = "    a   b   c   d   e   f   g   h   "
        border = "  " + "─" * 33 if HAS_COLORS else "  " + "-" * 33
        
        print(files)
        print(border)
        
        for i, row in enumerate(self.board.board):
            rank = 8 - i
            row_str = f"{rank} │" if HAS_COLORS else f"{rank} |"
            
            for piece in row:
                if piece:
                    symbol = self.piece_symbols[piece.type.value.upper() if piece.color == Color.WHITE else piece.type.value]
                    if piece.color == Color.WHITE:
                        row_str += f" {Fore.WHITE}{symbol}{Style.RESET_ALL} │"
                    else:
                        row_str += f" {Fore.BLACK}{symbol}{Style.RESET_ALL} │"
                else:
                    row_str += "   │"
            
            print(row_str)
            print(border)
        
        print(files)
    
    def _display_game_info(self):
        """Display game information."""
        print("\n" + "=" * 60)
        print("  SUPER GOOSE CHESS".center(54))
        print("=" * 60)
        print()
        
        # Display whose turn it is
        turn_text = "White's Turn" if self.board.turn == Color.WHITE else "Black's Turn"
        if HAS_COLORS:
            turn_text = f"{Fore.WHITE}{turn_text}{Style.RESET_ALL}" if self.board.turn == Color.WHITE else f"{Fore.BLACK}{turn_text}{Style.RESET_ALL}"
        print(f"Turn: {turn_text}")
        
        # Display check status
        if self.board.is_in_check(self.board.turn):
            print(f"⚠️  {self.board.turn.value.upper()} IS IN CHECK!")
        
        # Display move numbers
        print(f"Move: {self.board.fullmove_number}")
        print()
    
    def parse_move(self, move_str: str) -> Optional[tuple]:
        """
        Parse a move string in algebraic notation.
        
        Returns ((from_row, from_col), (to_row, to_col)) or None if invalid.
        Examples: "e2e4", "e2 e4", "E2 E4"
        """
        # Remove any spaces
        move_str = move_str.replace(" ", "").strip()
        
        # Check for valid length
        if len(move_str) != 4:
            return None
        
        files = "abcdefgh"
        
        try:
            from_file = move_str[0].lower()
            from_rank = int(move_str[1])
            to_file = move_str[2].lower()
            to_rank = int(move_str[3])
            
            # Validate file and rank
            if (from_file not in files or to_file not in files or
                from_rank < 1 or from_rank > 8 or
                to_rank < 1 or to_rank > 8):
                return None
            
            from_col = files.index(from_file)
            from_row = 8 - from_rank
            to_col = files.index(to_file)
            to_row = 8 - to_rank
            
            return ((from_row, from_col), (to_row, to_col))
        
        except (ValueError, IndexError):
            return None
    
    def get_player_move(self) -> Optional[tuple]:
        """Get a move from the player."""
        while True:
            try:
                if HAS_COLORS:
                    print(f"{Fore.CYAN}Enter your move (e.g., e2e4) or 'quit':{Style.RESET_ALL}", end=" ")
                else:
                    print("Enter your move (e.g., e2e4) or 'quit': ", end="")
                
                move_input = input().strip().lower()
                
                if move_input in ['quit', 'exit', 'q']:
                    return None
                
                # Parse the move
                move = self.parse_move(move_input)
                
                if not move:
                    print("Invalid move format. Use format like 'e2e4' (from to).")
                    continue
                
                from_pos, to_pos = move
                
                # Validate the move
                piece = self.board.get_piece(*from_pos)
                if not piece:
                    print("No piece at the from position.")
                    continue
                
                if piece.color != self.player_color:
                    print("You can only move your own pieces.")
                    continue
                
                # Try to make the move
                if self.board.make_move(from_pos, to_pos):
                    return move
                else:
                    print("Invalid move. The move is either illegal or leaves your king in check.")
                    continue
                
            except KeyboardInterrupt:
                print("\nExiting...")
                return None
            except Exception as e:
                print(f"Error: {e}")
                continue
    
    def get_ai_move(self) -> Optional[tuple]:
        """Get a move from the AI."""
        print("\n🤖 Super Goose Intelligence is thinking...")
        
        move = self.ai.get_best_move(self.board)
        
        if not move:
            return None
        
        from_pos, to_pos = move
        files = "abcdefgh"
        
        # Convert to algebraic notation
        from_str = f"{files[from_pos[1]]}{8 - from_pos[0]}{files[to_pos[1]]}{8 - to_pos[0]}"
        
        print(f"🤖 AI moves: {from_str.upper()}")
        
        # Make the move
        self.board.make_move(from_pos, to_pos)
        
        return move
    
    def check_game_over(self):
        """Check if the game is over and display the result."""
        current_color = self.board.turn
        
        if self.board.is_checkmate(current_color):
            winner = Color.BLACK if current_color == Color.WHITE else Color.WHITE
            self.game_over = True
            
            if HAS_COLORS:
                if winner == Color.WHITE:
                    print(f"\n{Fore.GREEN} CHECKMATE! White wins!{Style.RESET_ALL}")
                else:
                    print(f"{Fore.RED} CHECKMATE! Black wins!{Style.RESET_ALL}")
            else:
                print(f"\nCHECKMATE! {winner.value.upper()} wins!")
            
            return True
        
        elif self.board.is_stalemate(current_color):
            self.game_over = True
            print("\nSTALEMATE! The game is a draw.")
            return True
        
        return False
    
    def play(self):
        """Main game loop."""
        print("\n" + "=" * 60)
        print("  Welcome to Super Goose Chess!".center(54))
        print("=" * 60)
        print()
        print("Enter moves in algebraic notation (e.g., e2e4)")
        print("Type 'quit' to exit the game")
        print()
        
        while not self.game_over:
            # Display the board
            self.display_board()
            
            # Check if game is over
            if self.check_game_over():
                break
            
            # Handle player turn
            if self.board.turn == self.player_color:
                move = self.get_player_move()
                if not move:
                    print("Game ended by player.")
                    break
            else:
                # AI turn
                move = self.get_ai_move()
                if not move:
                    break
        
        # Display final board state
        self.display_board()
        print()
        print("Thanks for playing Super Goose Chess!")


def main():
    """Main entry point for the chess game."""
    parser = argparse.ArgumentParser(description="Super Goose Chess")
    parser.add_argument("--gui", action="store_true", help="Launch the GUI version of the game")
    args = parser.parse_args()

    if args.gui:
        print("Launching Enhanced GUI...")
        from enhanced_gui import ChessLearningGUI
        
        gui = ChessLearningGUI()
        gui.run()
        
    else:
        # Original CLI logic
        print("\nWelcome to Super Goose Chess!")
        print("\nGame Setup:")
        print("1. Play as White (moves first)")
        print("2. Play as Black")
        print("3. Watch AI vs AI")
        print()
        
        while True:
            try:
                choice = input("Enter your choice (1-3): ").strip()
                
                if choice == '1':
                    cli = ChessCLI()
                    cli.player_color = Color.WHITE
                    cli.ai_enabled = True
                    break
                elif choice == '2':
                    cli = ChessCLI()
                    cli.player_color = Color.BLACK
                    cli.ai_enabled = True
                    # If player is black, make the first white move
                    print("\n🤖 Super Goose Intelligence plays as White and moves first...")
                    cli.get_ai_move()
                    break
                elif choice == '3':
                    cli = ChessCLI()
                    cli.player_color = None  # Watch mode
                    cli.ai_enabled = True
                    # AI vs AI mode - use a loop
                    while True:
                        cli.display_board()
                        if cli.check_game_over():
                            break
                        cli.get_ai_move()
                    break
                else:
                    print("Invalid choice. Please enter 1, 2, or 3.")
            
            except KeyboardInterrupt:
                print("\nGoodbye!")
                sys.exit(0)
        
        # Start the game
        cli.play()


if __name__ == "__main__":
    main()
