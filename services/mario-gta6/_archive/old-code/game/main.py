"""Main entry point for Super Mario GTA6."""
import os, sys, traceback
os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = '1'
os.environ['SDL_AUDIODRIVER'] = 'disk'
import pygame
from .game import Game, preload_all
from .constants import W, H, FPS


def main():
    try:
        pygame.init()
        screen = pygame.display.set_mode((W, H))
        pygame.display.set_caption('Super Mario GTA6 — V3.0.0 Unified')
        clock = pygame.time.Clock()
        preload_all()
        game = Game()
        print("SUPER MARIO GTA6 V3.0.0 — Starting", flush=True)
        running = True
        while running:
            dt = clock.tick(FPS) / 1000.0
            dt = min(dt, 0.05)
            for ev in pygame.event.get():
                if ev.type == pygame.QUIT: running = False
                if ev.type == pygame.KEYDOWN and ev.key == pygame.K_ESCAPE: running = False
                if ev.type == pygame.KEYDOWN and ev.key == pygame.K_p: game.paused = not game.paused
            keys = pygame.key.get_pressed()
            game.run(dt, keys)
            game.draw(screen)
            pygame.display.flip()
    except Exception as e:
        print(f"ERROR:{e}", flush=True); traceback.print_exc()
    finally:
        pygame.quit(); print("GAME EXITED", flush=True)


if __name__ == '__main__':
    main()
