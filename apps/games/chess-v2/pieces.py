"""
Chess piece representations and movement logic.
"""

from enum import Enum
from typing import List, Tuple, Optional


class PieceType(Enum):
    PAWN = 'p'
    KNIGHT = 'n'
    BISHOP = 'b'
    ROOK = 'r'
    QUEEN = 'q'
    KING = 'k'


class Color(Enum):
    WHITE = 'w'
    BLACK = 'b'


class Piece:
    """Represents a chess piece with its type, color, and movement capabilities."""
    
    def __init__(self, piece_type: PieceType, color: Color):
        self.type = piece_type
        self.color = color
        self.has_moved = False
        
    def __repr__(self):
        symbol = self.type.value.upper() if self.color == Color.WHITE else self.type.value
        return f"{symbol}{self.color.value}"
    
    def __eq__(self, other):
        if not isinstance(other, Piece):
            return False
        return self.type == other.type and self.color == other.color
    
    def get_valid_moves(self, board: 'Board', row: int, col: int) -> List[Tuple[int, int]]:
        """Get all valid moves for this piece at the given position."""
        if self.type == PieceType.PAWN:
            return self._get_pawn_moves(board, row, col)
        elif self.type == PieceType.KNIGHT:
            return self._get_knight_moves(board, row, col)
        elif self.type == PieceType.BISHOP:
            return self._get_bishop_moves(board, row, col)
        elif self.type == PieceType.ROOK:
            return self._get_rook_moves(board, row, col)
        elif self.type == PieceType.QUEEN:
            return self._get_queen_moves(board, row, col)
        elif self.type == PieceType.KING:
            return self._get_king_moves(board, row, col)
        return []
    
    def _get_pawn_moves(self, board: 'Board', row: int, col: int) -> List[Tuple[int, int]]:
        """Get valid pawn moves including captures."""
        moves = []
        direction = -1 if self.color == Color.WHITE else 1
        start_rank = 6 if self.color == Color.WHITE else 1
        
        # Forward move
        new_row = row + direction
        if board.is_valid_position(new_row, col) and board.is_empty(new_row, col):
            moves.append((new_row, col))
            
            # Double move from starting position
            if row == start_rank and board.is_empty(new_row + direction, col):
                moves.append((new_row + direction, col))
        
        # Captures
        for dc in [-1, 1]:
            new_col = col + dc
            if board.is_valid_position(new_row, new_col):
                target = board.get_piece(new_row, new_col)
                if target and target.color != self.color:
                    moves.append((new_row, new_col))
                # En passant
                elif board.en_passant_target == (new_row, new_col):
                    moves.append((new_row, new_col))
        
        return moves
    
    def _get_knight_moves(self, board: 'Board', row: int, col: int) -> List[Tuple[int, int]]:
        """Get valid knight moves."""
        moves = []
        offsets = [(-2, -1), (-2, 1), (-1, -2), (-1, 2),
                   (1, -2), (1, 2), (2, -1), (2, 1)]
        
        for dr, dc in offsets:
            new_row, new_col = row + dr, col + dc
            if board.is_valid_position(new_row, new_col):
                target = board.get_piece(new_row, new_col)
                if target is None or target.color != self.color:
                    moves.append((new_row, new_col))
        
        return moves
    
    def _get_bishop_moves(self, board: 'Board', row: int, col: int) -> List[Tuple[int, int]]:
        """Get valid bishop moves."""
        moves = []
        directions = [(-1, -1), (-1, 1), (1, -1), (1, 1)]
        
        for dr, dc in directions:
            for i in range(1, 8):
                new_row, new_col = row + dr * i, col + dc * i
                if not board.is_valid_position(new_row, new_col):
                    break
                    
                target = board.get_piece(new_row, new_col)
                if target is None:
                    moves.append((new_row, new_col))
                else:
                    if target.color != self.color:
                        moves.append((new_row, new_col))
                    break
        
        return moves
    
    def _get_rook_moves(self, board: 'Board', row: int, col: int) -> List[Tuple[int, int]]:
        """Get valid rook moves."""
        moves = []
        directions = [(-1, 0), (1, 0), (0, -1), (0, 1)]
        
        for dr, dc in directions:
            for i in range(1, 8):
                new_row, new_col = row + dr * i, col + dc * i
                if not board.is_valid_position(new_row, new_col):
                    break
                    
                target = board.get_piece(new_row, new_col)
                if target is None:
                    moves.append((new_row, new_col))
                else:
                    if target.color != self.color:
                        moves.append((new_row, new_col))
                    break
        
        return moves
    
    def _get_queen_moves(self, board: 'Board', row: int, col: int) -> List[Tuple[int, int]]:
        """Get valid queen moves (combination of rook and bishop)."""
        moves = []
        moves.extend(self._get_rook_moves(board, row, col))
        moves.extend(self._get_bishop_moves(board, row, col))
        return moves
    
    def _get_king_moves(self, board: 'Board', row: int, col: int) -> List[Tuple[int, int]]:
        """Get valid king moves including castling."""
        moves = []
        offsets = [(-1, -1), (-1, 0), (-1, 1),
                   (0, -1),           (0, 1),
                   (1, -1),  (1, 0),  (1, 1)]
        
        for dr, dc in offsets:
            new_row, new_col = row + dr, col + dc
            if board.is_valid_position(new_row, new_col):
                target = board.get_piece(new_row, new_col)
                if target is None or target.color != self.color:
                    moves.append((new_row, new_col))
        
        # Castling - only add if piece hasn't moved (validation happens in board.make_move)
        if not self.has_moved:
            # Kingside castling
            if board.can_castle(self.color, 'kingside'):
                moves.append((row, col + 2))
            # Queenside castling
            if board.can_castle(self.color, 'queenside'):
                moves.append((row, col - 2))
        
        return moves
    
    def get_value(self) -> int:
        """Get material value of the piece for evaluation."""
        values = {
            PieceType.PAWN: 100,
            PieceType.KNIGHT: 320,
            PieceType.BISHOP: 330,
            PieceType.ROOK: 500,
            PieceType.QUEEN: 900,
            PieceType.KING: 20000
        }
        return values.get(self.type, 0)
    
    def get_position_value(self, row: int, col: int) -> int:
        """Get position bonus for the piece."""
        # Simplified position tables can be expanded here
        return 0
