"""
Chess board implementation with game state management.
"""

from typing import List, Tuple, Optional, Dict, Set
import copy
from pieces import Piece, PieceType, Color


class Board:
    """Represents the chess board with all pieces and game state."""
    
    def __init__(self):
        self.board: List[List[Optional[Piece]]] = [[None for _ in range(8)] for _ in range(8)]
        self.turn: Color = Color.WHITE
        self.move_history: List[Dict] = []
        self.castling_rights = {
            Color.WHITE: {'kingside': True, 'queenside': True},
            Color.BLACK: {'kingside': True, 'queenside': True}
        }
        self.en_passant_target: Optional[Tuple[int, int]] = None
        self.halfmove_clock: int = 0  # For 50-move rule
        self.fullmove_number: int = 1
        
        self._initialize_board()
    
    def _initialize_board(self):
        """Set up the initial board position."""
        # Place pawns
        for col in range(8):
            self.board[1][col] = Piece(PieceType.PAWN, Color.WHITE)
            self.board[6][col] = Piece(PieceType.PAWN, Color.BLACK)
        
        # Place other pieces
        piece_order = [PieceType.ROOK, PieceType.KNIGHT, PieceType.BISHOP, PieceType.QUEEN,
                       PieceType.KING, PieceType.BISHOP, PieceType.KNIGHT, PieceType.ROOK]
        
        for col, piece_type in enumerate(piece_order):
            self.board[0][col] = Piece(piece_type, Color.WHITE)
            self.board[7][col] = Piece(piece_type, Color.BLACK)
    
    def is_valid_position(self, row: int, col: int) -> bool:
        """Check if a position is on the board."""
        return 0 <= row < 8 and 0 <= col < 8
    
    def is_empty(self, row: int, col: int) -> bool:
        """Check if a position is empty."""
        return self.board[row][col] is None
    
    def get_piece(self, row: int, col: int) -> Optional[Piece]:
        """Get the piece at the given position."""
        if self.is_valid_position(row, col):
            return self.board[row][col]
        return None
    
    def set_piece(self, row: int, col: int, piece: Optional[Piece]):
        """Set a piece at the given position."""
        if self.is_valid_position(row, col):
            self.board[row][col] = piece
    
    def get_all_pieces(self, color: Color) -> List[Tuple[int, int, Piece]]:
        """Get all pieces of a given color with their positions."""
        pieces = []
        for row in range(8):
            for col in range(8):
                piece = self.board[row][col]
                if piece and piece.color == color:
                    pieces.append((row, col, piece))
        return pieces
    
    def get_king_position(self, color: Color) -> Optional[Tuple[int, int]]:
        """Find the king's position for the given color."""
        for row in range(8):
            for col in range(8):
                piece = self.board[row][col]
                if piece and piece.type == PieceType.KING and piece.color == color:
                    return (row, col)
        return None
    
    def make_move(self, from_pos: Tuple[int, int], to_pos: Tuple[int, int], 
                  promotion_type: Optional[PieceType] = None) -> bool:
        """
        Make a move on the board.
        
        Returns True if the move was successful, False otherwise.
        """
        from_row, from_col = from_pos
        to_row, to_col = to_pos
        
        piece = self.get_piece(from_row, from_col)
        if not piece or piece.color != self.turn:
            return False
        
        # Get valid moves for the piece
        valid_moves = self.get_valid_moves(from_row, from_col)
        if to_pos not in valid_moves:
            return False
        
        # Make a copy to validate the move doesn't leave king in check
        temp_board = self.copy()
        temp_board._execute_move_internal(from_pos, to_pos, promotion_type)
        
        if temp_board.is_in_check(piece.color):
            return False
        
        # Execute the move
        self._execute_move_internal(from_pos, to_pos, promotion_type)
        
        # Update game state
        self._update_game_state(from_pos, to_pos, piece)
        
        return True
    
    def _execute_move_internal(self, from_pos: Tuple[int, int], to_pos: Tuple[int, int],
                               promotion_type: Optional[PieceType] = None):
        """Execute a move without validation."""
        from_row, from_col = from_pos
        to_row, to_col = to_pos
        
        piece = self.board[from_row][from_col]
        captured_piece = self.board[to_row][to_col]
        
        # Handle en passant capture
        if piece.type == PieceType.PAWN and self.en_passant_target == to_pos:
            capture_row = from_row
            self.board[capture_row][to_col] = None
            captured_piece = Piece(PieceType.PAWN, 
                                   Color.BLACK if piece.color == Color.WHITE else Color.WHITE)
        
        # Move the piece
        self.board[to_row][to_col] = piece
        self.board[from_row][from_col] = None
        
        # Handle pawn promotion
        if piece.type == PieceType.PAWN and (to_row == 0 or to_row == 7):
            if promotion_type:
                piece.type = promotion_type
            else:
                piece.type = PieceType.QUEEN  # Default to queen
        
        # Handle castling
        if piece.type == PieceType.KING and abs(to_col - from_col) == 2:
            # Move the rook
            if to_col > from_col:  # Kingside
                rook = self.board[from_row][7]
                self.board[from_row][5] = rook
                self.board[from_row][7] = None
            else:  # Queenside
                rook = self.board[from_row][0]
                self.board[from_row][3] = rook
                self.board[from_row][0] = None
        
        piece.has_moved = True
    
    def _update_game_state(self, from_pos: Tuple[int, int], to_pos: Tuple[int, int], piece: Piece):
        """Update game state after a move."""
        from_row, from_col = from_pos
        to_row, to_col = to_pos
        
        # Update en passant target
        self.en_passant_target = None
        if piece.type == PieceType.PAWN and abs(to_row - from_row) == 2:
            self.en_passant_target = ((from_row + to_row) // 2, from_col)
        
        # Update castling rights
        if piece.type == PieceType.KING:
            self.castling_rights[piece.color]['kingside'] = False
            self.castling_rights[piece.color]['queenside'] = False
        elif piece.type == PieceType.ROOK:
            if from_col == 0:
                self.castling_rights[piece.color]['queenside'] = False
            elif from_col == 7:
                self.castling_rights[piece.color]['kingside'] = False
        
        # Update move counters
        captured = self.board[to_row][to_col] is not None
        if piece.type == PieceType.PAWN or captured:
            self.halfmove_clock = 0
        else:
            self.halfmove_clock += 1
        
        if self.turn == Color.BLACK:
            self.fullmove_number += 1
        
        # Switch turn
        self.turn = Color.BLACK if self.turn == Color.WHITE else Color.WHITE
    
    def get_valid_moves(self, row: int, col: int) -> List[Tuple[int, int]]:
        """Get all valid moves for the piece at the given position."""
        piece = self.get_piece(row, col)
        if not piece:
            return []
        
        # Get pseudo-legal moves
        moves = piece.get_valid_moves(self, row, col)
        
        # Filter out moves that leave the king in check
        valid_moves = []
        for move in moves:
            temp_board = self.copy()
            temp_board._execute_move_internal((row, col), move)
            if not temp_board.is_in_check(piece.color):
                valid_moves.append(move)
        
        return valid_moves
    
    def get_all_valid_moves(self, color: Color) -> List[Tuple[Tuple[int, int], Tuple[int, int]]]:
        """Get all valid moves for all pieces of a given color."""
        all_moves = []
        pieces = self.get_all_pieces(color)
        
        for row, col, piece in pieces:
            moves = self.get_valid_moves(row, col)
            for move in moves:
                all_moves.append(((row, col), move))
        
        return all_moves
    
    def is_in_check(self, color: Color) -> bool:
        """Check if the king of the given color is in check."""
        king_pos = self.get_king_position(color)
        if not king_pos:
            return False
        
        opponent = Color.BLACK if color == Color.WHITE else Color.WHITE
        opponent_pieces = self.get_all_pieces(opponent)
        
        # Check if any opponent piece can capture the king
        for row, col, piece in opponent_pieces:
            if king_pos in piece.get_valid_moves(self, row, col):
                return True
        
        return False
    
    def is_checkmate(self, color: Color) -> bool:
        """Check if the given color is in checkmate."""
        return self.is_in_check(color) and len(self.get_all_valid_moves(color)) == 0
    
    def is_stalemate(self, color: Color) -> bool:
        """Check if the given color is in stalemate."""
        return not self.is_in_check(color) and len(self.get_all_valid_moves(color)) == 0
    
    def can_castle(self, color: Color, side: str) -> bool:
        """Check if castling is possible for the given color and side."""
        if not self.castling_rights[color][side]:
            return False
        
        row = 0 if color == Color.WHITE else 7
        
        if side == 'kingside':
            # Check if squares between king and rook are empty
            if not (self.is_empty(row, 5) and self.is_empty(row, 6)):
                return False
            # Check if king is not in check and doesn't pass through check
            if self.is_in_check(color):
                return False
            temp_board = self.copy()
            temp_board.board[row][5] = temp_board.board[row][4]
            temp_board.board[row][4] = None
            if temp_board.is_in_check(color):
                return False
            temp_board.board[row][6] = temp_board.board[row][5]
            temp_board.board[row][5] = None
            if temp_board.is_in_check(color):
                return False
        else:  # queenside
            # Check if squares between king and rook are empty
            if not (self.is_empty(row, 1) and self.is_empty(row, 2) and self.is_empty(row, 3)):
                return False
            # Check if king is not in check and doesn't pass through check
            if self.is_in_check(color):
                return False
            temp_board = self.copy()
            temp_board.board[row][3] = temp_board.board[row][4]
            temp_board.board[row][4] = None
            if temp_board.is_in_check(color):
                return False
            temp_board.board[row][2] = temp_board.board[row][3]
            temp_board.board[row][3] = None
            if temp_board.is_in_check(color):
                return False
        
        return True
    
    def copy(self) -> 'Board':
        """Create a deep copy of the board."""
        new_board = Board()
        new_board.turn = self.turn
        new_board.castling_rights = copy.deepcopy(self.castling_rights)
        new_board.en_passant_target = self.en_passant_target
        new_board.halfmove_clock = self.halfmove_clock
        new_board.fullmove_number = self.fullmove_number
        
        for row in range(8):
            for col in range(8):
                piece = self.board[row][col]
                if piece:
                    new_piece = Piece(piece.type, piece.color)
                    new_piece.has_moved = piece.has_moved
                    new_board.board[row][col] = new_piece
        
        return new_board
    
    def to_fen(self) -> str:
        """Convert the board position to Forsyth-Edwards Notation."""
        fen_parts = []
        
        # Piece placement
        placement_rows = []
        for row in range(8):
            placement = ""
            empty_count = 0
            for col in range(8):
                piece = self.board[row][col]
                if piece:
                    if empty_count > 0:
                        placement += str(empty_count)
                        empty_count = 0
                    symbol = piece.type.value.upper() if piece.color == Color.WHITE else piece.type.value
                    placement += symbol
                else:
                    empty_count += 1
            if empty_count > 0:
                placement += str(empty_count)
            placement_rows.append(placement)
        fen_parts.append("/".join(placement_rows))
        
        # Turn
        fen_parts.append("w" if self.turn == Color.WHITE else "b")
        
        # Castling rights
        castling = ""
        if self.castling_rights[Color.WHITE]['kingside']:
            castling += "K"
        if self.castling_rights[Color.WHITE]['queenside']:
            castling += "Q"
        if self.castling_rights[Color.BLACK]['kingside']:
            castling += "k"
        if self.castling_rights[Color.BLACK]['queenside']:
            castling += "q"
        if not castling:
            castling = "-"
        fen_parts.append(castling)
        
        # En passant target
        if self.en_passant_target:
            row, col = self.en_passant_target
            files = "abcdefgh"
            fen_parts.append(f"{files[col]}{8 - row}")
        else:
            fen_parts.append("-")
        
        # Move counters
        fen_parts.append(str(self.halfmove_clock))
        fen_parts.append(str(self.fullmove_number))
        
        return " ".join(fen_parts)
    
    def __str__(self):
        """Return a string representation of the board."""
        rows = []
        files = "  a b c d e f g h"
        rows.append(files)
        
        for i, row in enumerate(self.board):
            row_str = f"{8-i} "
            for piece in row:
                if piece:
                    symbol = piece.type.value.upper() if piece.color == Color.WHITE else piece.type.value
                    row_str += f"{symbol} "
                else:
                    row_str += ". "
            rows.append(row_str + f"{8-i}")
        
        rows.append(files)
        return "\n".join(rows)
