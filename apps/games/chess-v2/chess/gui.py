import pygame
from board import Board
from pieces import Color, PieceType
import os

class ChessGUI:
    def __init__(self, board: Board):
        pygame.init()
        self.board = board
        self.square_size = 60
        self.board_size = 8 * self.square_size
        self.screen = pygame.display.set_mode((self.board_size, self.board_size))
        pygame.display.set_caption("Super Goose Chess")
        
        # Colors
        self.colors = {
            "white": (238, 238, 210),
            "black": (118, 150, 86),
            "selected": (255, 255, 0),  # Yellow for selected piece
            "valid_move": (130, 151, 105) # A slightly different green for valid moves
        }
        
        self.piece_images = {}
        self.load_pieces()
        
        self.selected_piece = None  # (row, col) of the selected piece
        self.valid_moves = []

    def load_pieces(self):
        """Load the chess piece images."""
        piece_names = {
            PieceType.PAWN: 'p',
            PieceType.ROOK: 'r',
            PieceType.KNIGHT: 'n',
            PieceType.BISHOP: 'b',
            PieceType.QUEEN: 'q',
            PieceType.KING: 'k'
        }
        
        for piece_type, piece_char in piece_names.items():
            for color in [Color.WHITE, Color.BLACK]:
                color_char = 'w' if color == Color.WHITE else 'b'
                # Construct the filename, e.g., 'wp.png' for white pawn
                filename = f"{color_char}{piece_char}.png"
                path = os.path.join('assets', filename)
                
                try:
                    # Load the image and scale it to the square size
                    image = pygame.image.load(path)
                    image = pygame.transform.scale(image, (self.square_size, self.square_size))
                    
                    # Store the loaded image in the dictionary
                    # The key is a tuple of (PieceType, Color)
                    self.piece_images[(piece_type, color)] = image
                
                except pygame.error as e:
                    print(f"Error loading piece image: {path}")
                    print(e)
                    # Exit if a piece image is missing
                    pygame.quit()
                    exit()

    def get_square_from_pos(self, pos):
        """Convert mouse position to board coordinates (row, col)."""
        x, y = pos
        row = y // self.square_size
        col = x // self.square_size
        return row, col

    def handle_click(self, pos):
        """Handle a mouse click on the board."""
        row, col = self.get_square_from_pos(pos)
        
        if self.selected_piece:
            # A piece is selected, check if the click is a valid move
            if (row, col) in self.valid_moves:
                from_pos = self.selected_piece
                to_pos = (row, col)
                self.board.make_move(from_pos, to_pos)
                self.selected_piece = None
                self.valid_moves = []
            # If clicking another of your own pieces, switch selection
            elif self.board.get_piece(row, col) and self.board.get_piece(row, col).color == self.board.turn:
                self.selected_piece = (row, col)
                self.valid_moves = self.board.get_valid_moves(row, col)
            else:
                # Invalid move, deselect the piece
                self.selected_piece = None
                self.valid_moves = []
        else:
            # No piece is selected, select the piece if it's the current player's turn
            piece = self.board.get_piece(row, col)
            if piece and piece.color == self.board.turn:
                self.selected_piece = (row, col)
                self.valid_moves = self.board.get_valid_moves(row, col)

    def draw_board(self):
        """Draw the chessboard."""
        for row in range(8):
            for col in range(8):
                color = self.colors["white"] if (row + col) % 2 == 0 else self.colors["black"]
                pygame.draw.rect(self.screen, color, (col * self.square_size, row * self.square_size, self.square_size, self.square_size))
    
    def highlight_squares(self):
        """Highlight the selected piece and its valid moves."""
        if self.selected_piece:
            row, col = self.selected_piece
            pygame.draw.rect(self.screen, self.colors["selected"], (col * self.square_size, row * self.square_size, self.square_size, self.square_size), 3) # Highlight selected piece
            
            for r, c in self.valid_moves:
                pygame.draw.circle(self.screen, self.colors["valid_move"], (c * self.square_size + self.square_size // 2, r * self.square_size + self.square_size // 2), 10) # Draw circles for valid moves


    def draw_pieces(self):
        """Draw the pieces on the board."""
        for row in range(8):
            for col in range(8):
                piece = self.board.get_piece(row, col)
                if piece:
                    # Get the image for the piece
                    image = self.piece_images.get((piece.type, piece.color))
                    if image:
                        # Center the piece in the square
                        x = col * self.square_size
                        y = row * self.square_size
                        self.screen.blit(image, (x, y))

    def run(self):
        running = True
        while running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.MOUSEBUTTONDOWN:
                    self.handle_click(pygame.mouse.get_pos())

            self.draw_board()
            self.highlight_squares()
            self.draw_pieces()
            pygame.display.flip()

        pygame.quit()

if __name__ == '__main__':
    # For testing the GUI directly
    from board import Board
    board = Board()
    gui = ChessGUI(board)
    gui.run()
