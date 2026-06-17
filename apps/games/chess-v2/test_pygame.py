import pygame
import sys

# Initialize pygame
pygame.init()

# Set up the display
screen = pygame.display.set_mode((640, 480))
pygame.display.set_caption("Pygame Test")

# Colors
WHITE = (255, 255, 255)
BLUE = (0, 0, 255)

# Main loop
running = True
clock = pygame.time.Clock()

while running:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
    
    # Fill the screen with white
    screen.fill(WHITE)
    
    # Draw a blue rectangle
    pygame.draw.rect(screen, BLUE, (250, 200, 140, 80))
    
    # Update the display
    pygame.display.flip()
    clock.tick(60)

pygame.quit()
sys.exit()