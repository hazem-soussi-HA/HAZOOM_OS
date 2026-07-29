"""
SUPER MARIO GTA6 — Level Editor
═══════════════════════════════════════════════════════════════

Visual level editor with:
- Tile palette (19 tile types)
- Entity placement (defenders, power-ups, cars)
- Click to place, right-click to erase
- Scroll to pan, zoom in/out
- Save/Load levels as JSON
- Test play (press Space to play current level)
- Grid snapping
- Undo/Redo
- Layer visibility toggles

Controls:
- Left click: place tile/entity
- Right click: erase
- Scroll: pan camera
- Ctrl+Scroll: zoom
- S: save level
- L: load level
- Space: test play
- Tab: toggle grid
- 1-9: select tile type
- E: entity mode
- T: tile mode
- Z: undo
- Y: redo
- G: toggle grid
- H: toggle HUD
- +/-: zoom in/out
- Arrow keys: pan
- Escape: quit
"""

import os, sys, json, math, copy, pygame

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from game.constants import *
from game.tiles import get_tile_surface as get_tile, _tile_cache
from game.level import parse_level, LEVELS


# ═══════════════════════════════════════════════════════════════
# EDITOR CONSTANTS
# ═══════════════════════════════════════════════════════════════

EDITOR_W, EDITOR_H = 1600, 900
PALETTE_W = 200
TOOLBAR_H = 40
GRID_COLOR = (100, 100, 100, 60)
GRID_HIGHLIGHT = (255, 255, 0, 80)
BG_COLOR = (30, 30, 40)
PANEL_BG = (40, 40, 55)
PANEL_BORDER = (80, 80, 100)
TEXT_COLOR = (220, 220, 230)
HIGHLIGHT_COLOR = (100, 150, 255)
BUTTON_COLOR = (60, 60, 80)
BUTTON_HOVER = (80, 80, 110)
BUTTON_ACTIVE = (100, 100, 140)

# Tile names for display
TILE_NAMES = {
    0: "Empty", 1: "Ground", 2: "Brick", 3: "Question",
    4: "Pipe L", 5: "Pipe R", 6: "Pipe TL", 7: "Pipe TR",
    8: "Used", 9: "Dirt", 10: "Spike", 11: "Spring",
    12: "Flag", 13: "Checkpoint", 14: "Platform", 15: "Coin",
    16: "Dash Panel", 17: "Shield Zone", 18: "Harmony Flower",
}

ENTITY_TYPES = {
    'defender_goomba': {'name': 'Goomba', 'color': GOM, 'w': 40, 'h': 40},
    'defender_koopa': {'name': 'Koopa', 'color': SHELL_GRN, 'w': 40, 'h': 56},
    'powerup_mushroom': {'name': 'Mushroom', 'color': MUSHROOM_RED, 'w': 36, 'h': 36},
    'powerup_fire': {'name': 'Fire Flower', 'color': FIRE_RED, 'w': 36, 'h': 36},
    'powerup_star': {'name': 'Star', 'color': STAR_COLOR, 'w': 36, 'h': 36},
    'powerup_shield': {'name': 'Shield', 'color': SHIELD_BLUE, 'w': 36, 'h': 36},
    'powerup_harmony': {'name': 'Harmony', 'color': HARMONY_GREEN, 'w': 36, 'h': 36},
    'powerup_oneup': {'name': '1-Up', 'color': (0, 200, 0), 'w': 36, 'h': 36},
    'car': {'name': 'Car', 'color': (220, 40, 40), 'w': 96, 'h': 24},
    'player_spawn': {'name': 'Player Start', 'color': (100, 200, 255), 'w': 36, 'h': 40},
}

SAVE_DIR = os.path.join(os.path.dirname(__file__), '..', 'levels')
os.makedirs(SAVE_DIR, exist_ok=True)


# ═══════════════════════════════════════════════════════════════
# UNDO/REDO SYSTEM
# ═══════════════════════════════════════════════════════════════

class UndoManager:
    def __init__(self, max_history=50):
        self._history = []
        self._index = -1
        self._max = max_history
    
    def push(self, state):
        """Push a state snapshot."""
        # Remove any redo states
        self._history = self._history[:self._index + 1]
        self._history.append(copy.deepcopy(state))
        if len(self._history) > self._max:
            self._history.pop(0)
        else:
            self._index += 1
    
    def undo(self):
        if self._index > 0:
            self._index -= 1
            return copy.deepcopy(self._history[self._index])
        return None
    
    def redo(self):
        if self._index < len(self._history) - 1:
            self._index += 1
            return copy.deepcopy(self._history[self._index])
        return None
    
    @property
    def can_undo(self):
        return self._index > 0
    
    @property
    def can_redo(self):
        return self._index < len(self._history) - 1


# ═══════════════════════════════════════════════════════════════
# LEVEL DATA
# ═══════════════════════════════════════════════════════════════

def create_empty_level(width=WW, height=WH):
    return {
        'version': '4.0',
        'width': width,
        'height': height,
        'tiles': [[0] * width for _ in range(height)],
        'entities': [],
        'spawn_x': 3 * TILE,
        'spawn_y': (height - 3) * TILE,
    }

def save_level(level, filename):
    path = os.path.join(SAVE_DIR, filename)
    with open(path, 'w') as f:
        json.dump(level, f, indent=2)
    return path

def load_level(filename):
    path = os.path.join(SAVE_DIR, filename)
    if not os.path.exists(path):
        return None
    with open(path, 'r') as f:
        return json.load(f)


# ═══════════════════════════════════════════════════════════════
# MAIN EDITOR
# ═══════════════════════════════════════════════════════════════

class LevelEditor:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((EDITOR_W, EDITOR_H))
        pygame.display.set_caption('Super Mario GTA6 — Level Editor')
        self.clock = pygame.time.Clock()
        self.font = pygame.font.Font(None, 20)
        self.font_small = pygame.font.Font(None, 16)
        self.font_large = pygame.font.Font(None, 28)
        
        # Level data
        self.level = create_empty_level()
        self.undo_mgr = UndoManager()
        self.undo_mgr.push(self.level)
        
        # Camera
        self.cam_x = 0
        self.cam_y = 0
        self.zoom = 1.0
        self.min_zoom = 0.25
        self.max_zoom = 3.0
        
        # Editor state
        self.mode = 'tile'  # 'tile' or 'entity'
        self.selected_tile = 1
        self.selected_entity = 'defender_goomba'
        self.show_grid = True
        self.show_hud = True
        self.mouse_world_pos = (0, 0)
        self.hover_tile = None
        self.is_painting = False
        self.status_message = ''
        self.status_timer = 0
        
        # UI state
        self.palette_scroll = 0
        self.entity_scroll = 0
        self.active_panel = None  # 'palette', 'entity', 'toolbar'
        
        # Buttons
        self.buttons = {}
        self._create_buttons()
    
    def _create_buttons(self):
        x = 10
        y = 5
        self.buttons['save'] = pygame.Rect(x, y, 60, 30); x += 65
        self.buttons['load'] = pygame.Rect(x, y, 60, 30); x += 65
        self.buttons['test'] = pygame.Rect(x, y, 60, 30); x += 65
        self.buttons['clear'] = pygame.Rect(x, y, 60, 30); x += 65
        self.buttons['undo'] = pygame.Rect(x, y, 40, 30); x += 45
        self.buttons['redo'] = pygame.Rect(x, y, 40, 30); x += 45
        self.buttons['grid'] = pygame.Rect(x, y, 50, 30); x += 55
        self.buttons['fill'] = pygame.Rect(x, y, 40, 30); x += 45
        self.buttons['resize'] = pygame.Rect(x, y, 60, 30)
    
    def run(self):
        running = True
        while running:
            dt = self.clock.tick(60) / 1000.0
            dt = min(dt, 0.05)
            
            # Events
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.KEYDOWN:
                    running = self._handle_key(event)
                elif event.type == pygame.MOUSEBUTTONDOWN:
                    self._handle_mouse_down(event)
                elif event.type == pygame.MOUSEBUTTONUP:
                    self._handle_mouse_up(event)
                elif event.type == pygame.MOUSEMOTION:
                    self._handle_mouse_motion(event)
                elif event.type == pygame.MOUSEWHEEL:
                    self._handle_scroll(event)
            
            # Update
            self._update(dt)
            
            # Render
            self._render()
            pygame.display.flip()
        
        pygame.quit()
    
    def _handle_key(self, event):
        key = event.key
        mod = event.mod
        
        if key == pygame.K_ESCAPE:
            return False  # quit
        
        # Save/Load
        if key == pygame.K_s and mod & pygame.KMOD_CTRL:
            self._save_dialog()
        elif key == pygame.K_o and mod & pygame.KMOD_CTRL:
            self._load_dialog()
        
        # Undo/Redo
        elif key == pygame.K_z and mod & pygame.KMOD_CTRL:
            self._undo()
        elif key == pygame.K_y and mod & pygame.KMOD_CTRL:
            self._redo()
        
        # Mode toggle
        elif key == pygame.K_t:
            self.mode = 'tile'
            self._set_status('Tile mode')
        elif key == pygame.K_e:
            self.mode = 'entity'
            self._set_status('Entity mode')
        
        # Grid toggle
        elif key == pygame.K_g:
            self.show_grid = not self.show_grid
            self._set_status(f'Grid: {"ON" if self.show_grid else "OFF"}')
        
        # HUD toggle
        elif key == pygame.K_h:
            self.show_hud = not self.show_hud
        
        # Zoom
        elif key == pygame.K_EQUALS or key == pygame.K_PLUS:
            self.zoom = min(self.max_zoom, self.zoom * 1.2)
        elif key == pygame.K_MINUS:
            self.zoom = max(self.min_zoom, self.zoom / 1.2)
        
        # Tile selection (1-9)
        elif pygame.K_1 <= key <= pygame.K_9:
            self.selected_tile = key - pygame.K_1 + 1
            if self.selected_tile > 18:
                self.selected_tile = 0
        
        # Test play
        elif key == pygame.K_SPACE:
            self._test_play()
        
        # Pan with arrow keys
        elif key == pygame.K_LEFT:
            self.cam_x -= 100
        elif key == pygame.K_RIGHT:
            self.cam_x += 100
        elif key == pygame.K_UP:
            self.cam_y -= 100
        elif key == pygame.K_DOWN:
            self.cam_y += 100
        
        # Delete selected
        elif key == pygame.K_DELETE or key == pygame.K_BACKSPACE:
            self._erase_at_mouse()
        
        return True  # continue running
    
    def _handle_mouse_down(self, event):
        mx, my = event.pos
        
        # Check button clicks
        for name, rect in self.buttons.items():
            if rect.collidepoint(mx, my):
                self._click_button(name)
                return
        
        # Check palette clicks
        if mx < PALETTE_W and my > TOOLBAR_H:
            self._click_palette(mx, my)
            return
        
        # Check entity panel clicks
        if mx > EDITOR_W - PALETTE_W and my > TOOLBAR_H:
            self._click_entity_panel(mx, my)
            return
        
        # World placement
        world_mx = (mx - PALETTE_W) / self.zoom + self.cam_x
        world_my = (my - TOOLBAR_H) / self.zoom + self.cam_y
        tx = int(world_mx // TILE)
        ty = int(world_my // TILE)
        
        if event.button == 1:  # Left click - place
            self.is_painting = True
            self._place_at(tx, ty)
        elif event.button == 3:  # Right click - erase
            self._erase_at(tx, ty)
    
    def _handle_mouse_up(self, event):
        if self.is_painting:
            self.is_painting = False
            self.undo_mgr.push(self.level)
    
    def _handle_mouse_motion(self, event):
        mx, my = event.pos
        world_mx = (mx - PALETTE_W) / self.zoom + self.cam_x
        world_my = (my - TOOLBAR_H) / self.zoom + self.cam_y
        self.mouse_world_pos = (world_mx, world_my)
        self.hover_tile = (int(world_mx // TILE), int(world_my // TILE))
        
        # Paint while dragging
        if self.is_painting and event.buttons[0]:
            tx, ty = self.hover_tile
            self._place_at(tx, ty)
    
    def _handle_scroll(self, event):
        mx, my = event.pos
        # Zoom with Ctrl+scroll
        keys = pygame.key.get_pressed()
        if keys[pygame.K_LCTRL] or keys[pygame.K_RCTRL]:
            if event.y > 0:
                self.zoom = min(self.max_zoom, self.zoom * 1.1)
            else:
                self.zoom = max(self.min_zoom, self.zoom / 1.1)
        else:
            # Pan
            self.cam_x -= event.x * 50
            self.cam_y -= event.y * 50
    
    def _place_at(self, tx, ty):
        if 0 <= tx < self.level['width'] and 0 <= ty < self.level['height']:
            if self.mode == 'tile':
                self.level['tiles'][ty][tx] = self.selected_tile
            elif self.mode == 'entity':
                # Remove existing entity at same position
                self.level['entities'] = [
                    e for e in self.level['entities']
                    if not (abs(e['x'] - tx * TILE) < TILE and abs(e['y'] - ty * TILE) < TILE)
                ]
                self.level['entities'].append({
                    'type': self.selected_entity,
                    'x': tx * TILE,
                    'y': ty * TILE,
                })
    
    def _erase_at(self, tx, ty):
        if 0 <= tx < self.level['width'] and 0 <= ty < self.level['height']:
            self.level['tiles'][ty][tx] = 0
            self.level['entities'] = [
                e for e in self.level['entities']
                if not (abs(e['x'] - tx * TILE) < TILE and abs(e['y'] - ty * TILE) < TILE)
            ]
    
    def _erase_at_mouse(self):
        if self.hover_tile:
            self._erase_at(*self.hover_tile)
    
    def _click_button(self, name):
        if name == 'save':
            self._save_dialog()
        elif name == 'load':
            self._load_dialog()
        elif name == 'test':
            self._test_play()
        elif name == 'clear':
            self.level = create_empty_level()
            self.undo_mgr.push(self.level)
            self._set_status('Level cleared')
        elif name == 'undo':
            self._undo()
        elif name == 'redo':
            self._redo()
        elif name == 'grid':
            self.show_grid = not self.show_grid
        elif name == 'fill':
            self._fill_floor()
        elif name == 'resize':
            self._resize_dialog()
    
    def _click_palette(self, mx, my):
        # Tile palette on left side
        cols = 4
        cell_size = (PALETTE_W - 20) // cols
        col = mx // cell_size
        row = (my - TOOLBAR_H - 10) // cell_size
        idx = row * cols + col
        if 0 <= idx <= 18:
            self.selected_tile = idx
            self.mode = 'tile'
    
    def _click_entity_panel(self, mx, my):
        # Entity panel on right side
        idx = (my - TOOLBAR_H - 10) // 35
        entity_keys = list(ENTITY_TYPES.keys())
        if 0 <= idx < len(entity_keys):
            self.selected_entity = entity_keys[idx]
            self.mode = 'entity'
    
    def _save_dialog(self):
        # Simple save with timestamp
        import time
        filename = f'level_{int(time.time())}.json'
        path = save_level(self.level, filename)
        self._set_status(f'Saved: {path}')
    
    def _load_dialog(self):
        # Load most recent level
        files = sorted(os.listdir(SAVE_DIR), reverse=True)
        if files:
            level = load_level(files[0])
            if level:
                self.level = level
                self.undo_mgr.push(self.level)
                self._set_status(f'Loaded: {files[0]}')
    
    def _test_play(self):
        self._set_status('Test play: close editor to play')
        # Save temp level and launch game
        save_level(self.level, '_temp_test.json')
        # Would launch game here
    
    def _undo(self):
        state = self.undo_mgr.undo()
        if state:
            self.level = state
            self._set_status('Undo')
    
    def _redo(self):
        state = self.undo_mgr.redo()
        if state:
            self.level = state
            self._set_status('Redo')
    
    def _fill_floor(self):
        """Fill bottom 2 rows with ground."""
        for x in range(self.level['width']):
            self.level['tiles'][self.level['height'] - 1][x] = 1
            self.level['tiles'][self.level['height'] - 2][x] = 1
        self.undo_mgr.push(self.level)
        self._set_status('Floor filled')
    
    def _resize_dialog(self):
        """Resize level (simplified)."""
        pass  # Would open a dialog
    
    def _set_status(self, msg):
        self.status_message = msg
        self.status_timer = 3.0
    
    def _update(self, dt):
        if self.status_timer > 0:
            self.status_timer -= dt
    
    def _render(self):
        self.screen.fill(BG_COLOR)
        
        # Calculate visible area
        view_x = PALETTE_W
        view_y = TOOLBAR_H
        view_w = EDITOR_W - PALETTE_W - PALETTE_W
        view_h = EDITOR_H - TOOLBAR_H
        
        # Set clip to viewport
        self.screen.set_clip(view_x, view_y, view_w, view_h)
        
        # Draw tiles
        start_tx = max(0, int(self.cam_x // TILE) - 1)
        end_tx = min(self.level['width'], int((self.cam_x + view_w / self.zoom) // TILE) + 2)
        start_ty = max(0, int(self.cam_y // TILE) - 1)
        end_ty = min(self.level['height'], int((self.cam_y + view_h / self.zoom) // TILE) + 2)
        
        for ty in range(start_ty, end_ty):
            for tx in range(start_tx, end_tx):
                tile_type = self.level['tiles'][ty][tx]
                if tile_type == 0:
                    continue
                surf = _tile_cache.get(tile_type)
                if surf:
                    sx = int(tx * TILE * self.zoom - self.cam_x * self.zoom + view_x)
                    sy = int(ty * TILE * self.zoom - self.cam_y * self.zoom + view_y)
                    if self.zoom != 1.0:
                        scaled = pygame.transform.scale(surf, (int(TILE * self.zoom), int(TILE * self.zoom)))
                        self.screen.blit(scaled, (sx, sy))
                    else:
                        self.screen.blit(surf, (sx, sy))
        
        # Draw entities
        for entity in self.level['entities']:
            etype = entity['type']
            if etype in ENTITY_TYPES:
                info = ENTITY_TYPES[etype]
                sx = int(entity['x'] * self.zoom - self.cam_x * self.zoom + view_x)
                sy = int(entity['y'] * self.zoom - self.cam_y * self.zoom + view_y)
                w = int(info['w'] * self.zoom)
                h = int(info['h'] * self.zoom)
                pygame.draw.rect(self.screen, info['color'], (sx, sy, w, h))
                pygame.draw.rect(self.screen, WHT, (sx, sy, w, h), 1)
        
        # Draw spawn point
        spawn_x = int(self.level['spawn_x'] * self.zoom - self.cam_x * self.zoom + view_x)
        spawn_y = int(self.level['spawn_y'] * self.zoom - self.cam_y * self.zoom + view_y)
        pygame.draw.circle(self.screen, (100, 200, 255), (spawn_x, spawn_y), int(10 * self.zoom), 2)
        
        # Grid
        if self.show_grid and self.zoom >= 0.5:
            grid_surf = pygame.Surface((view_w, view_h), pygame.SRCALPHA)
            for tx in range(start_tx, end_tx + 1):
                sx = int(tx * TILE * self.zoom - self.cam_x * self.zoom)
                pygame.draw.line(grid_surf, GRID_COLOR, (sx, 0), (sx, view_h))
            for ty in range(start_ty, end_ty + 1):
                sy = int(ty * TILE * self.zoom - self.cam_y * self.zoom)
                pygame.draw.line(grid_surf, GRID_COLOR, (0, sy), (view_w, sy))
            self.screen.blit(grid_surf, (view_x, view_y))
        
        # Hover highlight
        if self.hover_tile:
            hx, hy = self.hover_tile
            if 0 <= hx < self.level['width'] and 0 <= hy < self.level['height']:
                sx = int(hx * TILE * self.zoom - self.cam_x * self.zoom + view_x)
                sy = int(hy * TILE * self.zoom - self.cam_y * self.zoom + view_y)
                hover_surf = pygame.Surface((int(TILE * self.zoom), int(TILE * self.zoom)), pygame.SRCALPHA)
                hover_surf.fill(GRID_HIGHLIGHT)
                self.screen.blit(hover_surf, (sx, sy))
        
        self.screen.set_clip(None)
        
        # ═══ UI PANELS ═══
        
        # Toolbar
        pygame.draw.rect(self.screen, PANEL_BG, (0, 0, EDITOR_W, TOOLBAR_H))
        pygame.draw.line(self.screen, PANEL_BORDER, (0, TOOLBAR_H), (EDITOR_W, TOOLBAR_H))
        
        # Buttons
        for name, rect in self.buttons.items():
            color = BUTTON_ACTIVE if name in ['grid'] and self.show_grid else BUTTON_COLOR
            pygame.draw.rect(self.screen, color, rect, border_radius=3)
            pygame.draw.rect(self.screen, PANEL_BORDER, rect, 1, border_radius=3)
            label = self.font_small.render(name.upper(), True, TEXT_COLOR)
            self.screen.blit(label, (rect.centerx - label.get_width()//2, rect.centery - label.get_height()//2))
        
        # Mode indicator
        mode_text = f"Mode: {self.mode.upper()} | Tile: {TILE_NAMES.get(self.selected_tile, '?')} | Zoom: {self.zoom:.1f}x"
        if self.mode == 'entity':
            mode_text = f"Mode: {self.mode.upper()} | Entity: {ENTITY_TYPES.get(self.selected_entity, {}).get('name', '?')} | Zoom: {self.zoom:.1f}x"
        text = self.font.render(mode_text, True, TEXT_COLOR)
        self.screen.blit(text, (EDITOR_W - text.get_width() - 10, 10))
        
        # Left palette
        pygame.draw.rect(self.screen, PANEL_BG, (0, TOOLBAR_H, PALETTE_W, EDITOR_H - TOOLBAR_H))
        pygame.draw.line(self.screen, PANEL_BORDER, (PALETTE_W, TOOLBAR_H), (PALETTE_W, EDITOR_H))
        
        cols = 4
        cell_size = (PALETTE_W - 20) // cols
        for i in range(19):
            col = i % cols
            row = i // cols
            x = 10 + col * cell_size
            y = TOOLBAR_H + 10 + row * cell_size
            rect = pygame.Rect(x, y, cell_size - 4, cell_size - 4)
            
            # Highlight selected
            if self.mode == 'tile' and self.selected_tile == i:
                pygame.draw.rect(self.screen, HIGHLIGHT_COLOR, rect, border_radius=3)
            
            # Draw tile preview
            surf = _tile_cache.get(i)
            if surf:
                preview = pygame.transform.scale(surf, (min(40, cell_size-8), min(40, cell_size-8)))
                self.screen.blit(preview, (x + 2, y + 2))
            
            # Label
            name = TILE_NAMES.get(i, str(i))
            label = self.font_small.render(name[:8], True, TEXT_COLOR)
            self.screen.blit(label, (x, y + cell_size - 14))
        
        # Right entity panel
        panel_x = EDITOR_W - PALETTE_W
        pygame.draw.rect(self.screen, PANEL_BG, (panel_x, TOOLBAR_H, PALETTE_W, EDITOR_H - TOOLBAR_H))
        pygame.draw.line(self.screen, PANEL_BORDER, (panel_x, TOOLBAR_H), (panel_x, EDITOR_H))
        
        title = self.font.render("ENTITIES", True, HIGHLIGHT_COLOR)
        self.screen.blit(title, (panel_x + 10, TOOLBAR_H + 10))
        
        for idx, (etype, info) in enumerate(ENTITY_TYPES.items()):
            y = TOOLBAR_H + 40 + idx * 35
            rect = pygame.Rect(panel_x + 5, y, PALETTE_W - 10, 30)
            
            if self.mode == 'entity' and self.selected_entity == etype:
                pygame.draw.rect(self.screen, HIGHLIGHT_COLOR, rect, border_radius=3)
            
            # Color preview
            pygame.draw.rect(self.screen, info['color'], (panel_x + 10, y + 5, 20, 20))
            # Name
            label = self.font.render(info['name'], True, TEXT_COLOR)
            self.screen.blit(label, (panel_x + 35, y + 7))
        
        # Status bar
        if self.status_timer > 0:
            alpha = min(255, int(self.status_timer * 255))
            status_surf = pygame.Surface((EDITOR_W, 30), pygame.SRCALPHA)
            status_surf.fill((0, 0, 0, min(200, alpha)))
            self.screen.blit(status_surf, (0, EDITOR_H - 30))
            text = self.font.render(self.status_message, True, (255, 255, 255))
            self.screen.blit(text, (10, EDITOR_H - 25))
        
        # Help text
        help_text = "Ctrl+S:Save | Ctrl+O:Load | Space:Test | G:Grid | T:Tile | E:Entity | Z/Y:Undo/Redo | Del:Erase"
        help_surf = self.font_small.render(help_text, True, (150, 150, 170))
        self.screen.blit(help_surf, (10, EDITOR_H - 45))


def main():
    editor = LevelEditor()
    editor.run()


if __name__ == '__main__':
    main()
