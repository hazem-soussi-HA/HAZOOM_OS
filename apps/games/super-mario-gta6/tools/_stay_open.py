"""Test: does pygame window stay open?"""
import os
os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = '1'
os.environ['SDL_AUDIODRIVER'] = 'disk'
os.environ['SDL_VIDEODRIVER'] = 'x11'

import pygame, time

pygame.init()
screen = pygame.display.set_mode((1280, 720))
pygame.display.set_caption('STAY OPEN TEST')
clock = pygame.time.Clock()

font = pygame.font.Font(None, 48)
running = True
frame = 0
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            print(f"QUIT event at frame {frame}")
            running = False
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                print(f"ESC at frame {frame}")
                running = False

    screen.fill((50, 100, 200))
    text = font.render(f'Frame {frame} - Window stays open', True, (255,255,0))
    screen.blit(text, (100, 100))
    pygame.display.flip()
    clock.tick(60)
    frame += 1
    if frame > 600:  # 10 seconds
        running = False

pygame.quit()
print(f"Exited after {frame} frames")
