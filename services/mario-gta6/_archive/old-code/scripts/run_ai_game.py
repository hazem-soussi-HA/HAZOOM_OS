#!/usr/bin/env python3
"""
Super Mario GTA6 — AI Game Runner
Runs the game with AI player controlling Mario.
"""
import os, sys, time

os.environ['DISPLAY'] = os.environ.get('DISPLAY', ':99')
os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = '1'
os.environ['SDL_AUDIODRIVER'] = 'disk'

import pygame
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from mario_gta6_2d import Game, W, H, FPS, TILE, WW, WH
from python.ai import MarioAgent, AgentConfig, NetworkConfig
from python.ai.utils import preprocess_frame
import numpy as np

# Action to pygame key constants
ACTION_TO_KEYS = {
    0: [],
    1: [pygame.K_LEFT],
    2: [pygame.K_RIGHT],
    3: [pygame.K_SPACE],
    4: [pygame.K_LSHIFT],
    5: [pygame.K_SPACE, pygame.K_LSHIFT],
    6: [pygame.K_f],
    7: [pygame.K_LEFT, pygame.K_SPACE],
}

def make_key_state(held_keys):
    """
    Build a pygame.key.get_pressed()-compatible state array.
    Posts KEYDOWN/KEYUP events to set the desired state, then calls get_pressed().
    """
    # Get current pressed state
    keys = pygame.key.get_pressed()

    # Release all keys first by posting KEYUP for everything currently held
    for i in range(len(keys)):
        if keys[i]:
            ev = pygame.event.Event(pygame.KEYUP, {'key': i, 'mod': 0, 'unicode': '', 'scancode': 0})
            pygame.event.post(ev)

    # Press desired keys
    for k in held_keys:
        ev = pygame.event.Event(pygame.KEYDOWN, {'key': k, 'mod': 0, 'unicode': chr(k) if k < 128 else '', 'scancode': 0})
        pygame.event.post(ev)

    # Re-read state
    pygame.event.pump()
    return pygame.key.get_pressed()


def main():
    pygame.init()
    screen = pygame.display.set_mode((W, H))
    pygame.display.set_caption('Super Mario GTA6 — AI Player (OWL)')
    clock = pygame.time.Clock()

    game = Game()

    # Setup AI agent
    model_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'checkpoints', 'mario_ppo_final.pt')
    use_ai = os.path.exists(model_path)
    agent = None
    if use_ai:
        config = AgentConfig(network=NetworkConfig(device='cpu'), model_path=model_path, deterministic=True)
        agent = MarioAgent(config)
        print("AI model loaded:", model_path)
    else:
        print("No checkpoint found — running with random actions")

    font = pygame.font.Font(None, 24)

    print("="*50)
    print("  SUPER MARIO GTA6 — AI PLAYER MODE")
    print("  AI:", "ON" if use_ai else "OFF (random)")
    print("  Press ESC to quit")
    print("="*50)

    running = True
    total_frames = 0
    start_time = time.time()
    episode = 1
    ai_mode = True

    while running:
        dt = clock.tick(FPS) / 1000.0
        dt = min(dt, 0.05)

        # Events
        for ev in pygame.event.get():
            if ev.type == pygame.QUIT:
                running = False
            if ev.type == pygame.KEYDOWN:
                if ev.key == pygame.K_ESCAPE:
                    running = False
                if ev.key == pygame.K_h:
                    ai_mode = not ai_mode
                    print(f"  Mode: {'AI' if ai_mode else 'HUMAN'}")

        # Get action
        if ai_mode and agent is not None:
            # Capture frame from screen
            frame = pygame.surfarray.array3d(screen)
            frame = frame.transpose(1, 0, 2)  # (W,H,3) -> (H,W,3)

            # Build game state
            gs = {
                'px': game.px, 'py': game.py, 'pvx': game.pvx, 'pvy': game.pvy,
                'p_mode': game.p_mode, 'p_inv': game.p_inv, 'p_star': game.p_star,
                'coins': game.coins, 'score': game.score, 'time': game.time,
                'lives': game.lives, 'p_on_car': game.p_on_car,
                'p_air': game.p_air, 'p_dir': game.p_dir,
                'cam_x': game.cam, 'level_progress': game.px / (WW * TILE),
            }

            action = agent.act(frame, gs)
            keys = make_key_state(ACTION_TO_KEYS.get(action, []))

        elif ai_mode:
            # Random actions
            import random
            action = random.randint(0, 7)
            keys = make_key_state(ACTION_TO_KEYS.get(action, []))
        else:
            keys = pygame.key.get_pressed()

        # Step game
        game.run(dt, keys)
        game.draw(screen)

        # Overlay
        elapsed = time.time() - start_time
        total_frames += 1
        mode_str = "AI" if ai_mode else "HUMAN"
        texts = [
            f"Mode: {mode_str} | Ep: {episode}",
            f"Score: {game.score} | Coins: {game.coins} | Lives: {game.lives}",
            f"X: {game.px:.0f} | Time: {game.time:.0f} | FPS: {total_frames/max(elapsed,0.01):.0f}",
        ]
        if ai_mode:
            texts.append(f"Action: {action}")
        y = H - 80
        for text in texts:
            surf = font.render(text, True, (255, 255, 0))
            screen.blit(surf, (10, y))
            y += 22

        pygame.display.flip()

        # Game over handling
        if game.game_over:
            elapsed = time.time() - start_time
            print(f"\n  GAME OVER — Episode {episode}")
            print(f"  Score: {game.score} | Coins: {game.coins} | Frames: {total_frames} | FPS: {total_frames/elapsed:.1f}")

            episode += 1
            if episode > 3:
                running = False
            else:
                game = Game()
                if agent:
                    agent.reset()
                print(f"  Starting episode {episode}...")

    pygame.quit()
    print("\n  GAME EXITED")

if __name__ == '__main__':
    main()
