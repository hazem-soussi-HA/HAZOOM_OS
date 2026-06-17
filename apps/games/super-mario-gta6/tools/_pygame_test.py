"""Quick pygame display test."""
import os
os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = '1'
os.environ['SDL_AUDIODRIVER'] = 'disk'
import pygame

pygame.init()
W, H = 640, 360
screen = pygame.display.set_mode((W, H))
pygame.display.set_caption('Mario GTA6 2D')
clock = pygame.time.Clock()

running = True
frame = 0
while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
            running = False

    screen.fill((100, 170, 255))
    font = pygame.font.Font(None, 36)
    screen.blit(font.render('PYGAME OK - Frame %d' % frame, True, (255,255,0)), (20, 20))
    pygame.display.flip()
    clock.tick(60)
    frame += 1

pygame.quit()
print('DONE')
