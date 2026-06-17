"""Debug version of the game with error catching."""
import os, sys, traceback
os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = '1'
os.environ['SDL_AUDIODRIVER'] = 'disk'

import pygame, math, random

try:
    pygame.init()
    W, H = 1280, 720
    screen = pygame.display.set_mode((W, H))
    pygame.display.set_caption('DEBUG')
    clock = pygame.time.Clock()

    print("pygame initialized", flush=True)

    running = True
    frame = 0
    while running:
        try:
            dt = clock.tick(60) / 1000.0
            dt = min(dt, 0.05)

            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    print(f"QUIT event at frame {frame}", flush=True)
                    running = False
                if event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_ESCAPE:
                        running = False

            keys = pygame.key.get_pressed()

            # Simple test — just draw a moving rectangle
            screen.fill((100, 170, 255))
            
            # Draw a simple player
            px = int((frame * 5) % W)
            pygame.draw.rect(screen, (220, 30, 30), (px, H-250, 20, 50))
            pygame.draw.ellipse(screen, (245, 210, 160), (px-2, H-280, 24, 24))
            pygame.draw.rect(screen, (220, 30, 30), (px-3, H-300, 26, 15))
            
            # Road
            pygame.draw.rect(screen, (58, 58, 66), (0, H-200, W, 50))
            
            pygame.display.flip()
            frame += 1

            if frame % 60 == 0:
                print(f"Frame {frame} alive", flush=True)

        except Exception as e:
            print(f"ERROR in frame {frame}: {e}", flush=True)
            traceback.print_exc()
            running = False

    pygame.quit()
    print(f"EXITED normally after {frame} frames", flush=True)

except Exception as e:
    print(f"FATAL ERROR: {e}", flush=True)
    traceback.print_exc()
    pygame.quit()
