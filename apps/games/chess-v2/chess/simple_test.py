import pygame
import sys

# Initialize pygame
pygame.init()

# Create a simple window
screen = pygame.display.set_mode((400, 300))
pygame.display.set_caption("Simple Pygame Test")

# Define colors
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)

# Main game loop
clock = pygame.time.Clock()
running = True

while running:
    # Handle events
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        elif event.type == pygame.KEYDOWN:
            if event.key == pygame.K_ESCAPE:
                running = False

    # Fill the screen with white
    screen.fill(WHITE)

    # Draw a simple shape
    pygame.draw.rect(screen, BLACK, (150, 100, 100, 100))

    # Update the display
    pygame.display.flip()
    clock.tick(60)

# Quit pygame
pygame.quit()
sys.exit()