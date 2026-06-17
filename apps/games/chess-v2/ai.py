"""
Chess AI engine with minimax algorithm and alpha-beta pruning.
"""

import random
from typing import Tuple, Optional, List
from board import Board
from pieces import PieceType, Color


class ChessAI:
    """AI opponent for Super Goose Chess."""
    
    def __init__(self, depth: int = 4, use_opening_book: bool = True):
        self.depth = depth
        self.use_opening_book = use_opening_book
        self.nodes_evaluated = 0
        
        # Simplified position tables for piece-square evaluation
        self.position_tables = self._initialize_position_tables()
        
        # Simple opening book (can be expanded)
        self.opening_book = {
            Color.WHITE: [
                "e2e4", "d2d4", "g1f3", "c2c4", "b1c3"
            ],
            Color.BLACK: [
                "e7e5", "c7c5", "e7e6", "g8f6", "d7d5"
            ]
        }
        
        self.opening_moves_played = {Color.WHITE: 0, Color.BLACK: 0}
    
    def _initialize_position_tables(self) -> dict:
        """Initialize position tables for piece-square evaluation."""
        # Pawn position bonuses (center control and advancement)
        pawn_table = [
            [0,  0,  0,  0,  0,  0,  0,  0],
            [50, 50, 50, 50, 50, 50, 50, 50],
            [10, 10, 20, 30, 30, 20, 10, 10],
            [5,  5, 10, 25, 25, 10,  5,  5],
            [0,  0,  0, 20, 20,  0,  0,  0],
            [5, -5,-10,  0,  0,-10, -5,  5],
            [5, 10, 10,-20,-20, 10, 10,  5],
            [0,  0,  0,  0,  0,  0,  0,  0]
        ]
        
        # Knight position bonuses (center control and mobility)
        knight_table = [
            [-50,-40,-30,-30,-30,-30,-40,-50],
            [-40,-20,  0,  0,  0,  0,-20,-40],
            [-30,  0, 10, 15, 15, 10,  0,-30],
            [-30,  5, 15, 20, 20, 15,  5,-30],
            [-30,  0, 15, 20, 20, 15,  0,-30],
            [-30,  5, 10, 15, 15, 10,  5,-30],
            [-40,-20,  0,  5,  5,  0,-20,-40],
            [-50,-40,-30,-30,-30,-30,-40,-50]
        ]
        
        # Bishop position bonuses (diagonals and center)
        bishop_table = [
            [-20,-10,-10,-10,-10,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5, 10, 10,  5,  0,-10],
            [-10,  5,  5, 10, 10,  5,  5,-10],
            [-10,  0, 10, 10, 10, 10,  0,-10],
            [-10, 10, 10, 10, 10, 10, 10,-10],
            [-10,  5,  0,  0,  0,  0,  5,-10],
            [-20,-10,-10,-10,-10,-10,-10,-20]
        ]
        
        # Rook position bonuses (open files and 7th rank)
        rook_table = [
            [0,  0,  0,  0,  0,  0,  0,  0],
            [5, 10, 10, 10, 10, 10, 10,  5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [0,  0,  0,  5,  5,  0,  0,  0]
        ]
        
        # Queen position bonuses (balance between center and safety)
        queen_table = [
            [-20,-10,-10, -5, -5,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5,  5,  5,  5,  0,-10],
            [-5,  0,  5,  5,  5,  5,  0, -5],
            [0,  0,  5,  5,  5,  5,  0, -5],
            [-10,  5,  5,  5,  5,  5,  0,-10],
            [-10,  0,  5,  0,  0,  0,  0,-10],
            [-20,-10,-10, -5, -5,-10,-10,-20]
        ]
        
        # King position bonuses (early game: safety, late game: activity)
        king_midgame_table = [
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-30,-40,-40,-50,-50,-40,-40,-30],
            [-20,-30,-30,-40,-40,-30,-30,-20],
            [-10,-20,-20,-20,-20,-20,-20,-10],
            [20, 20,  0,  0,  0,  0, 20, 20],
            [20, 30, 10,  0,  0, 10, 30, 20]
        ]
        
        king_endgame_table = [
            [-50,-40,-30,-20,-20,-30,-40,-50],
            [-30,-20,-10,  0,  0,-10,-20,-30],
            [-30,-10, 20, 30, 30, 20,-10,-30],
            [-30,-10, 30, 40, 40, 30,-10,-30],
            [-30,-10, 30, 40, 40, 30,-10,-30],
            [-30,-10, 20, 30, 30, 20,-10,-30],
            [-30,-30,  0,  0,  0,  0,-30,-30],
            [-50,-30,-30,-30,-30,-30,-30,-50]
        ]
        
        return {
            PieceType.PAWN: pawn_table,
            PieceType.KNIGHT: knight_table,
            PieceType.BISHOP: bishop_table,
            PieceType.ROOK: rook_table,
            PieceType.QUEEN: queen_table,
            PieceType.KING: {'midgame': king_midgame_table, 'endgame': king_endgame_table}
        }
    
    def get_best_move(self, board: Board) -> Optional[Tuple[Tuple[int, int], Tuple[int, int]]]:
        """
        Get the best move for the current position using minimax with alpha-beta pruning.
        
        Returns the best move as ((from_row, from_col), (to_row, to_col)) or None if no moves available.
        """
        self.nodes_evaluated = 0
        color = board.turn
        
        # Check if game is over
        if board.is_checkmate(color):
            print("Checkmate!")
            return None
        if board.is_stalemate(color):
            print("Stalemate!")
            return None
        
        # Use opening book if available
        if self.use_opening_book and self.opening_moves_played[color] < len(self.opening_book[color]):
            opening_move = self._get_opening_book_move(board, color)
            if opening_move:
                self.opening_moves_played[color] += 1
                return opening_move
        
        # Get all valid moves
        valid_moves = board.get_all_valid_moves(color)
        if not valid_moves:
            return None
        
        # Order moves for better alpha-beta pruning
        ordered_moves = self._order_moves(board, valid_moves)
        
        best_move = None
        best_value = float('-inf')
        alpha = float('-inf')
        beta = float('inf')
        
        for move in ordered_moves:
            # Make move on a copy of the board
            temp_board = board.copy()
            temp_board._execute_move_internal(move[0], move[1])
            
            # Evaluate the move
            value = -self._minimax(temp_board, self.depth - 1, -beta, -alpha, True)
            
            if value > best_value:
                best_value = value
                best_move = move
            
            alpha = max(alpha, value)
        
        print(f"Searched {self.nodes_evaluated} positions")
        print(f"Best move value: {best_value}")
        
        return best_move
    
    def _minimax(self, board: Board, depth: int, alpha: float, beta: float, 
                 maximizing: bool) -> float:
        """Minimax algorithm with alpha-beta pruning."""
        self.nodes_evaluated += 1
        
        # Base case: leaf node
        if depth == 0:
            return self._evaluate(board)
        
        # Check for checkmate or stalemate
        color = board.turn
        if board.is_checkmate(color):
            return -20000 + (self.depth - depth)  # Prefer faster checkmate
        if board.is_stalemate(color):
            return 0  # Stalemate is a draw
        
        valid_moves = board.get_all_valid_moves(color)
        
        if not valid_moves:
            return self._evaluate(board)
        
        # Order moves for better pruning
        ordered_moves = self._order_moves(board, valid_moves)
        
        if maximizing:
            max_eval = float('-inf')
            for move in ordered_moves:
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
            for move in ordered_moves:
                temp_board = board.copy()
                temp_board._execute_move_internal(move[0], move[1])
                eval_score = self._minimax(temp_board, depth - 1, alpha, beta, True)
                min_eval = min(min_eval, eval_score)
                beta = min(beta, eval_score)
                if beta <= alpha:
                    break
            return min_eval
    
    def _evaluate(self, board: Board) -> int:
        """
        Evaluate the board position.
        
        Returns a positive value favoring white, negative favoring black.
        """
        score = 0
        
        # Count total material
        total_material = 0
        for row in range(8):
            for col in range(8):
                piece = board.board[row][col]
                if piece:
                    total_material += piece.get_value()
        
        # Determine game phase
        is_endgame = total_material < 2600  # Approximately 2 queens worth of material
        
        for row in range(8):
            for col in range(8):
                piece = board.board[row][col]
                if piece:
                    piece_value = piece.get_value()
                    
                    # Get position bonus
                    if piece.type == PieceType.KING:
                        if is_endgame:
                            pos_bonus = self.position_tables[PieceType.KING]['endgame'][row][col]
                        else:
                            pos_bonus = self.position_tables[PieceType.KING]['midgame'][row][col]
                    else:
                        pos_bonus = self.position_tables[piece.type][row][col]
                    
                    # Rotate position table for black
                    if piece.color == Color.BLACK:
                        pos_bonus = self.position_tables[piece.type][7 - row][col]
                    
                    # Add piece value and position bonus
                    if piece.color == Color.WHITE:
                        score += piece_value + pos_bonus
                    else:
                        score -= piece_value + pos_bonus
        
        # Add mobility bonus
        white_mobility = len(board.get_all_valid_moves(Color.WHITE))
        black_mobility = len(board.get_all_valid_moves(Color.BLACK))
        score += (white_mobility - black_mobility) * 5
        
        # Add king safety bonus
        white_king_pos = board.get_king_position(Color.WHITE)
        black_king_pos = board.get_king_position(Color.BLACK)
        
        if white_king_pos:
            score += self._evaluate_king_safety(board, white_king_pos, Color.WHITE)
        if black_king_pos:
            score -= self._evaluate_king_safety(board, black_king_pos, Color.BLACK)
        
        return score
    
    def _evaluate_king_safety(self, board: Board, king_pos: Tuple[int, int], 
                              color: Color) -> int:
        """Evaluate the safety of the king at the given position."""
        score = 0
        row, col = king_pos
        opponent = Color.BLACK if color == Color.WHITE else Color.WHITE
        
        # Check if king is in the center
        if 3 <= col <= 4:
            score -= 20  # Penalize exposed king
        if 3 <= row <= 4:
            score -= 20
        
        # Check pawn shield
        direction = 1 if color == Color.WHITE else -1
        for dc in [-1, 0, 1]:
            new_row, new_col = row + direction, col + dc
            if board.is_valid_position(new_row, new_col):
                piece = board.get_piece(new_row, new_col)
                if piece and piece.type == PieceType.PAWN and piece.color == color:
                    score += 10
        
        return score
    
    def _order_moves(self, board: Board, moves: List[Tuple[Tuple[int, int], Tuple[int, int]]]) -> list:
        """Order moves for better alpha-beta pruning (MVV-LVA and capture ordering)."""
        def move_score(move):
            from_pos, to_pos = move
            piece = board.get_piece(*from_pos)
            target = board.get_piece(*to_pos)
            
            # Prioritize captures (Most Valuable Victim - Least Valuable Aggressor)
            if target:
                return 1000 + target.get_value() - piece.get_value()
            
            # Prioritize checks
            temp_board = board.copy()
            temp_board._execute_move_internal(from_pos, to_pos)
            opponent = Color.BLACK if board.turn == Color.WHITE else Color.WHITE
            if temp_board.is_in_check(opponent):
                return 500
            
            # Prioritize castling
            if piece.type == PieceType.KING and abs(to_pos[1] - from_pos[1]) == 2:
                return 200
            
            return 0
        
        return sorted(moves, key=move_score, reverse=True)
    
    def _get_opening_book_move(self, board: Board, color: Color) -> Optional[Tuple[Tuple[int, int], Tuple[int, int]]]:
        """Get a move from the opening book based on the board position."""
        opening_moves = self.opening_book[color]
        move_index = self.opening_moves_played[color]
        
        if move_index >= len(opening_moves):
            return None
        
        # Convert algebraic notation to board positions
        move_str = opening_moves[move_index]
        files = "abcdefgh"
        
        from_str = move_str[:2]
        to_str = move_str[2:]
        
        from_col = files.index(from_str[0])
        from_row = 8 - int(from_str[1])
        to_col = files.index(to_str[0])
        to_row = 8 - int(to_str[1])
        
        from_pos = (from_row, from_col)
        to_pos = (to_row, to_col)
        
        # Check if the move is valid
        valid_moves = board.get_all_valid_moves(color)
        if (from_pos, to_pos) in valid_moves:
            return (from_pos, to_pos)
        
        return None
    
    def set_depth(self, depth: int):
        """Set the search depth for the AI."""
        self.depth = depth
    
    def set_opening_book_enabled(self, enabled: bool):
        """Enable or disable the opening book."""
        self.use_opening_book = enabled
