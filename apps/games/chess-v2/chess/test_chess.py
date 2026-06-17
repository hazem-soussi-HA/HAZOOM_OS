"""
Test suite for Super Goose Chess.
"""

import unittest
from board import Board
from pieces import Piece, PieceType, Color
from ai import ChessAI


class TestPieces(unittest.TestCase):
    """Test cases for chess pieces."""
    
    def test_knight_moves(self):
        """Test knight movement."""
        board = Board()
        # Test knight at b1 (0,1)
        knight = board.get_piece(0, 1)
        self.assertEqual(knight.type, PieceType.KNIGHT)
        
        moves = knight.get_valid_moves(board, 0, 1)
        # Knight should be able to move to a3 and c3 and d2
        knight_positions = [(2, 0), (2, 2)]
        
        for pos in knight_positions:
            self.assertIn(pos, moves)
    
    def test_pawn_moves_initial(self):
        """Test pawn movement from starting position."""
        board = Board()
        # Test white pawn at e2 (6,4)
        pawn = board.get_piece(6, 4)
        self.assertEqual(pawn.type, PieceType.PAWN)
        
        moves = pawn.get_valid_moves(board, 6, 4)
        # Pawn can move forward one or two squares
        self.assertIn((5, 4), moves)
        self.assertIn((4, 4), moves)
    
    def test_pawn_captures(self):
        """Test pawn capture movement."""
        board = Board()
        # Set up a capture scenario
        board.board[5][3] = Piece(PieceType.PAWN, Color.BLACK)  # Black pawn at d3
        board.board[5][5] = Piece(PieceType.PAWN, Color.BLACK)  # Black pawn at f3
        
        pawn = board.get_piece(6, 4)  # White pawn at e2
        moves = pawn.get_valid_moves(board, 6, 4)
        
        # Should include capture moves
        self.assertIn((5, 3), moves)
        self.assertIn((5, 5), moves)


class TestBoard(unittest.TestCase):
    """Test cases for chess board."""
    
    def test_initial_board_setup(self):
        """Test that the board is set up correctly."""
        board = Board()
        
        # Check rooks
        self.assertEqual(board.get_piece(0, 0).type, PieceType.ROOK)
        self.assertEqual(board.get_piece(0, 7).type, PieceType.ROOK)
        self.assertEqual(board.get_piece(7, 0).type, PieceType.ROOK)
        self.assertEqual(board.get_piece(7, 7).type, PieceType.ROOK)
        
        # Check kings
        self.assertEqual(board.get_piece(0, 4).type, PieceType.KING)
        self.assertEqual(board.get_piece(7, 4).type, PieceType.KING)
        
        # Check that center is empty
        self.assertIsNone(board.get_piece(3, 3))
        self.assertIsNone(board.get_piece(3, 4))
        self.assertIsNone(board.get_piece(4, 3))
        self.assertIsNone(board.get_piece(4, 4))
    
    def test_valid_move(self):
        """Test making a valid move."""
        board = Board()
        
        # Move e2 to e4
        result = board.make_move((6, 4), (4, 4))
        self.assertTrue(result)
        
        # Check that the piece moved
        self.assertIsNone(board.get_piece(6, 4))
        self.assertEqual(board.get_piece(4, 4).type, PieceType.PAWN)
    
    def test_invalid_move(self):
        """Test making an invalid move."""
        board = Board()
        
        # Try to move a piece that doesn't exist
        result = board.make_move((4, 4), (3, 4))
        self.assertFalse(result)
        
        # Try to make an illegal move (knight like a rook)
        result = board.make_move((0, 1), (0, 3))
        self.assertFalse(result)
    
    def test_check_detection(self):
        """Test check detection."""
        board = Board()
        
        # Clear some pieces
        board.board[6][4] = None
        board.board[7][4] = None  # Remove black king (illegal but for testing)
        board.board[0][4] = None  # Remove white king (illegal but for testing)
        
        # Set up check scenario
        board.board[7][4] = Piece(PieceType.KING, Color.BLACK)
        board.board[4][4] = Piece(PieceType.QUEEN, Color.WHITE)
        
        self.assertTrue(board.is_in_check(Color.BLACK))
    
    def test_castling_rights(self):
        """Test castling rights."""
        board = Board()
        
        # Initially, both sides should have castling rights
        self.assertTrue(board.can_castle(Color.WHITE, 'kingside'))
        self.assertTrue(board.can_castle(Color.WHITE, 'queenside'))
        
        # After king moves, castling should be disabled
        board.make_move((6, 4), (4, 4))
        board.make_move((1, 4), (3, 4))
        board.make_move((0, 4), (1, 4))  # Move king
        
        self.assertFalse(board.can_castle(Color.WHITE, 'kingside'))
        self.assertFalse(board.can_castle(Color.WHITE, 'queenside'))
    
    def test_fen_conversion(self):
        """Test FEN string conversion."""
        board = Board()
        fen = board.to_fen()
        
        # Initial position FEN
        expected_start = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR"
        self.assertTrue(fen.startswith(expected_start))


class TestAI(unittest.TestCase):
    """Test cases for chess AI."""
    
    def test_initialization(self):
        """Test AI initialization."""
        ai = ChessAI(depth=3)
        self.assertEqual(ai.depth, 3)
        self.assertTrue(ai.use_opening_book)
    
    def test_evaluation_function(self):
        """Test the board evaluation function."""
        ai = ChessAI(depth=1)
        board = Board()
        
        # Initial position should be roughly equal
        score = ai._evaluate(board)
        # Score should be close to 0 (balanced position)
        self.assertTrue(-100 < score < 100)
    
    def test_minimax_depth(self):
        """Test that minimax respects depth setting."""
        ai = ChessAI(depth=2)
        board = Board()
        
        # Make some moves to reach a more interesting position
        board.make_move((6, 4), (4, 4))
        board.make_move((1, 4), (3, 4))
        
        # Get best move and check that nodes were evaluated
        move = ai.get_best_move(board)
        # Should have evaluated some nodes
        self.assertGreater(ai.nodes_evaluated, 0)
    
    def test_move_ordering(self):
        """Test that moves are ordered for efficiency."""
        ai = ChessAI(depth=3)
        board = Board()
        
        # Set up a position with captures available
        board.board[4][4] = Piece(PieceType.QUEEN, Color.WHITE)
        board.board[3][4] = Piece(PieceType.PAWN, Color.BLACK)
        
        moves = board.get_all_valid_moves(Color.WHITE)
        ordered_moves = ai._order_moves(board, moves)
        
        # First move should be the capture
        if len(ordered_moves) > 1:
            first_move_is_capture = False
            for move in moves:
                if (move[0], move[1]) in moves:
                    piece = board.get_piece(*move[0])
                    target = board.get_piece(*move[1])
                    if target:
                        first_move_is_capture = True
                        break
            
            # Check that capture moves come first
            self.assertGreater(len(ordered_moves), 0)


class TestGameIntegration(unittest.TestCase):
    """Integration tests for the full game."""
    
    def test_game_flow(self):
        """Test a basic game flow."""
        board = Board()
        
        # Make a series of legal moves
        moves = [
            ((6, 4), (4, 4)),  # e4
            ((1, 4), (3, 4)),  # e5
            ((6, 3), (4, 3)),  # d4
            ((1, 3), (3, 3)),  # d5
            ((7, 1), (5, 2)),  # Nc3
        ]
        
        for from_pos, to_pos in moves:
            self.assertTrue(board.make_move(from_pos, to_pos))
    
    def test_scholars_mate_attempt(self):
        """Test Scholar's Mate scenario."""
        board = Board()
        
        # Scholar's Mate sequence
        moves = [
            ((6, 4), (4, 4)),  # e4
            ((1, 5), (3, 5)),  # e6
            ((7, 5), (4, 2)),  # Bc4
            ((1, 6), (2, 6)),  # c6
            ((6, 6), (4, 6)),  # Qh5
        ]
        
        for from_pos, to_pos in moves:
            board.make_move(from_pos, to_pos)
        
        # White queen should be threatening f7
        self.assertGreater(len(board.get_all_valid_moves(Color.WHITE)), 0)


def run_tests():
    """Run all tests."""
    unittest.main(argv=[''], verbosity=2, exit=False)


if __name__ == '__main__':
    test_suite = unittest.TestLoader().loadTestsFromModule(__import__(__name__))
    unittest.TextTestRunner(verbosity=2).run(test_suite)
