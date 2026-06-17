"""
Enhanced GUI for Super Goose Chess with debugging capabilities
"""

import pygame
import pygame_menu
from board import Board
from pieces import Color, PieceType
import os
import traceback


class ChessLearningGUI:
    def __init__(self):
        print("Initializing pygame...")
        pygame.init()
        print("Setting caption...")
        pygame.display.set_caption("Super Goose Chess - Learn & Play")

        print("Creating board...")
        self.board = Board()
        self.square_size = 60
        self.board_size = 8 * self.square_size
        self.sidebar_width = 300

        self.width = self.board_size + self.sidebar_width
        self.height = self.board_size
        print(f"Creating screen with dimensions: {self.width}x{self.height}")
        self.screen = pygame.display.set_mode((self.width, self.height))

        self.colors = {
            "white": (238, 238, 210),
            "black": (118, 150, 86),
            "selected": (255, 255, 0),
            "valid_move": (130, 151, 105),
            "sidebar": (50, 50, 50),
            "text": (255, 255, 255),
            "highlight": (100, 200, 255),
            "hint": (255, 200, 100)
        }

        print("Loading pieces...")
        self.piece_images = {}
        self.load_pieces()

        self.selected_piece = None
        self.valid_moves = []
        self.game_mode = None
        self.ai = None
        self.hint_enabled = True
        self.last_hint = None
        self.show_help = False

        print("Loading AI...")
        self.load_ai()
        print("Creating main menu...")
        self.create_main_menu()
        print("Initialization complete!")

    def load_ai(self):
        from ai import ChessAI
        self.ai = ChessAI(depth=4, use_opening_book=True)

    def load_pieces(self):
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
                filename = f"{color_char}{piece_char}.png"
                path = os.path.join('assets', filename)

                try:
                    print(f"Loading piece image: {path}")
                    image = pygame.image.load(path)
                    image = pygame.transform.scale(image, (self.square_size, self.square_size))
                    self.piece_images[(piece_type, color)] = image
                    print(f"Successfully loaded: {path}")
                except pygame.error as e:
                    print(f"Error loading piece image: {path}")
                    print(f"Error details: {e}")
                    print(f"Available assets in assets/: {os.listdir('assets')}")
                    # Continue without exiting to see if other pieces load

    def create_main_menu(self):
        print("Creating main menu...")
        self.main_menu = pygame_menu.Menu(
            'Super Goose Chess',
            500, 400,
            theme=pygame_menu.themes.THEME_DARK
        )

        self.main_menu.add.button('Play vs AI', self.start_vs_ai)
        self.main_menu.add.button('Play vs Human', self.start_vs_human)
        self.main_menu.add.button('Tutorial Mode', self.start_tutorial)
        self.main_menu.add.button('Learning Resources', self.show_learning_resources)
        self.main_menu.add.button('Settings', self.show_settings)
        self.main_menu.add.button('Quit', pygame_menu.events.EXIT)

    def run(self):
        print("Starting main game loop...")
        running = True

        while running:
            events = pygame.event.get()
            for event in events:
                if event.type == pygame.QUIT:
                    print("Received QUIT event")
                    running = False

            if self.game_mode is None:
                print("Drawing main menu...")
                if self.main_menu.is_enabled():
                    self.main_menu.draw(self.screen)
                pygame.display.flip()
            else:
                self.handle_game_events(events)
                self.draw_game()
                pygame.display.flip()

        print("Quitting pygame...")
        pygame.quit()

    def handle_game_events(self, events):
        for event in events:
            if event.type == pygame.QUIT:
                self.game_mode = None
                self.main_menu.enable()
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    self.game_mode = None
                    self.main_menu.enable()
                elif event.key == pygame.K_h:
                    self.show_hint()
                elif event.key == pygame.K_u:
                    self.show_help = not self.show_help
                elif event.key == pygame.K_r:
                    self.reset_game()
            elif event.type == pygame.MOUSEBUTTONDOWN:
                pos = pygame.mouse.get_pos()
                if pos[0] < self.board_size:
                    self.handle_board_click(pos)
                else:
                    self.handle_sidebar_click(pos)

    def handle_board_click(self, pos):
        row, col = pos[1] // self.square_size, pos[0] // self.square_size

        if self.selected_piece:
            if (row, col) in self.valid_moves:
                from_pos = self.selected_piece
                to_pos = (row, col)
                self.make_move(from_pos, to_pos)
                self.selected_piece = None
                self.valid_moves = []
                self.last_hint = None
            elif self.board.get_piece(row, col) and self.board.get_piece(row, col).color == self.board.turn:
                self.selected_piece = (row, col)
                self.valid_moves = self.board.get_valid_moves(row, col)
            else:
                self.selected_piece = None
                self.valid_moves = []
        else:
            piece = self.board.get_piece(row, col)
            if piece and piece.color == self.board.turn:
                self.selected_piece = (row, col)
                self.valid_moves = self.board.get_valid_moves(row, col)

    def handle_sidebar_click(self, pos):
        sidebar_x = pos[0] - self.board_size
        y = pos[1]

        if 10 <= sidebar_x <= 110 and 10 <= y <= 50:
            self.show_hint()
        elif 120 <= sidebar_x <= 220 and 10 <= y <= 50:
            self.show_help = not self.show_help
        elif 230 <= sidebar_x <= 290 and 10 <= y <= 50:
            self.game_mode = None
            self.main_menu.enable()

    def make_move(self, from_pos, to_pos):
        success = self.board.make_move(from_pos, to_pos)

        if success:
            if self.game_mode == 'vs_ai' and self.board.turn != Color.WHITE:
                self.ai_move()

    def ai_move(self):
        if self.ai:
            move = self.ai.get_best_move(self.board)
            if move:
                from_pos, to_pos = move
                self.board.make_move(from_pos, to_pos)

    def show_hint(self):
        if self.hint_enabled and self.ai:
            move = self.ai.get_best_move(self.board)
            if move:
                from_pos, to_pos = move
                self.last_hint = (from_pos, to_pos)

    def reset_game(self):
        self.board = Board()
        self.selected_piece = None
        self.valid_moves = []
        self.last_hint = None

    def draw_game(self):
        self.draw_board()
        self.highlight_squares()
        self.draw_pieces()
        self.draw_sidebar()

        if self.board.is_checkmate(Color.WHITE) or self.board.is_checkmate(Color.BLACK):
            self.draw_game_over()

    def draw_board(self):
        for row in range(8):
            for col in range(8):
                color = self.colors["white"] if (row + col) % 2 == 0 else self.colors["black"]
                pygame.draw.rect(self.screen, color, (col * self.square_size, row * self.square_size, self.square_size, self.square_size))

    def highlight_squares(self):
        if self.selected_piece:
            row, col = self.selected_piece
            pygame.draw.rect(self.screen, self.colors["selected"], (col * self.square_size, row * self.square_size, self.square_size, self.square_size), 3)

            for r, c in self.valid_moves:
                pygame.draw.circle(self.screen, self.colors["valid_move"], (c * self.square_size + self.square_size // 2, r * self.square_size + self.square_size // 2), 10)

        if self.last_hint:
            from_pos, to_pos = self.last_hint
            row, col = from_pos
            to_row, to_col = to_pos
            pygame.draw.rect(self.screen, self.colors["hint"], (col * self.square_size, row * self.square_size, self.square_size, self.square_size), 2)
            pygame.draw.rect(self.screen, self.colors["hint"], (to_col * self.square_size, to_row * self.square_size, self.square_size, self.square_size), 2)

    def draw_pieces(self):
        for row in range(8):
            for col in range(8):
                piece = self.board.get_piece(row, col)
                if piece:
                    image = self.piece_images.get((piece.type, piece.color))
                    if image:
                        x = col * self.square_size
                        y = row * self.square_size
                        self.screen.blit(image, (x, y))

    def draw_sidebar(self):
        pygame.draw.rect(self.screen, self.colors["sidebar"], (self.board_size, 0, self.sidebar_width, self.height))

        font = pygame.font.Font(None, 24)
        small_font = pygame.font.Font(None, 20)

        buttons = [
            ("Hint (H)", 10, 10, 100, 40),
            ("Help (U)", 120, 10, 100, 40),
            ("Menu", 230, 10, 60, 40)
        ]

        for text, x, y, w, h in buttons:
            pygame.draw.rect(self.screen, (70, 70, 70), (self.board_size + x, y, w, h))
            text_surf = small_font.render(text, True, self.colors["text"])
            text_rect = text_surf.get_rect(center=(self.board_size + x + w // 2, y + h // 2))
            self.screen.blit(text_surf, text_rect)

        y_offset = 70
        title = font.render("Game Info", True, self.colors["text"])
        self.screen.blit(title, (self.board_size + 10, y_offset))
        y_offset += 30

        turn_text = f"Turn: {'White' if self.board.turn == Color.WHITE else 'Black'}"
        turn_surf = small_font.render(turn_text, True, self.colors["text"])
        self.screen.blit(turn_surf, (self.board_size + 10, y_offset))
        y_offset += 25

        move_text = f"Move: {self.board.fullmove_number}"
        move_surf = small_font.render(move_text, True, self.colors["text"])
        self.screen.blit(move_surf, (self.board_size + 10, y_offset))
        y_offset += 35

        if self.board.is_in_check(self.board.turn):
            check_text = f"{self.board.turn.value.upper()} IN CHECK!"
            check_surf = small_font.render(check_text, True, (255, 100, 100))
            self.screen.blit(check_surf, (self.board_size + 10, y_offset))
            y_offset += 25

        if self.show_help:
            y_offset = 150
            help_title = font.render("Controls", True, self.colors["highlight"])
            self.screen.blit(help_title, (self.board_size + 10, y_offset))
            y_offset += 30

            controls = [
                "Click - Select/Move piece",
                "H - Show hint",
                "U - Toggle help",
                "R - Reset game",
                "ESC - Main menu"
            ]

            for control in controls:
                control_surf = small_font.render(control, True, self.colors["text"])
                self.screen.blit(control_surf, (self.board_size + 10, y_offset))
                y_offset += 20

        if self.last_hint:
            y_offset = self.height - 100
            hint_title = font.render("Hint", True, self.colors["hint"])
            self.screen.blit(hint_title, (self.board_size + 10, y_offset))
            y_offset += 25

            files = "abcdefgh"
            from_pos, to_pos = self.last_hint
            hint_text = f"{files[from_pos[1]]}{8-from_pos[0]} -> {files[to_pos[1]]}{8-to_pos[0]}"
            hint_surf = small_font.render(hint_text, True, self.colors["text"])
            self.screen.blit(hint_surf, (self.board_size + 10, y_offset))

    def draw_game_over(self):
        overlay = pygame.Surface((self.board_size, self.height))
        overlay.set_alpha(200)
        overlay.fill((0, 0, 0))
        self.screen.blit(overlay, (0, 0))

        font = pygame.font.Font(None, 48)

        if self.board.is_checkmate(Color.WHITE):
            winner = "Black"
        else:
            winner = "White"

        text = f"{winner} Wins!"
        text_surf = font.render(text, True, (255, 255, 255))
        text_rect = text_surf.get_rect(center=(self.board_size // 2, self.height // 2))
        self.screen.blit(text_surf, text_rect)

        small_font = pygame.font.Font(None, 24)
        reset_text = "Press R to reset or ESC for menu"
        reset_surf = small_font.render(reset_text, True, (200, 200, 200))
        reset_rect = reset_surf.get_rect(center=(self.board_size // 2, self.height // 2 + 50))
        self.screen.blit(reset_surf, reset_rect)

    def start_vs_ai(self):
        self.game_mode = 'vs_ai'
        self.reset_game()
        self.main_menu.disable()

    def start_vs_human(self):
        self.game_mode = 'vs_human'
        self.reset_game()
        self.main_menu.disable()

    def start_tutorial(self):
        self.game_mode = 'tutorial'
        self.reset_game()
        self.main_menu.disable()

    def show_learning_resources(self):
        from learning_module import ChessLearningResources
        resources = ChessLearningResources()
        resources.show_menu(self.screen)

    def show_settings(self):
        pass


if __name__ == '__main__':
    try:
        print("Starting Super Goose Chess Enhanced GUI...")
        gui = ChessLearningGUI()
        print("Running the game...")
        gui.run()
        print("Game ended successfully")
    except Exception as e:
        print(f"An error occurred: {e}")
        print(traceback.format_exc())