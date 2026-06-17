"""Debug: speed test to a file, no display needed."""
import os, sys, math, random
os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = '1'
os.environ['SDL_AUDIODRIVER'] = 'disk'
os.environ['SDL_VIDEODRIVER'] = 'dummy'

import pygame
pygame.init()
screen = pygame.display.set_mode((1280, 720))

# Import the game
sys.path.insert(0, '/home/hazem/mario_gta6')

# Simulate 3 seconds of gameplay at 60fps
FPS = 60
GRAVITY = 55
JUMP_VEL = 20
SHORT_HOP = 11
WALK_SPEED = 10
SPRINT_SPEED = 20
COYOTE = 0.12
JUMP_BUF = 0.12
JUMP_HOLD = 0.18
ACCEL_G = 80
ACCEL_A = 50
DECEL_G = 60
DECEL_A = 20

# Simulate holding D for 3 seconds
vel_x = 0.0
x = 300.0
speed = WALK_SPEED
accel = ACCEL_G
dt = 1.0 / FPS

print(f"=== Speed simulation: WALK_SPEED={WALK_SPEED}, ACCEL_G={accel} ===")
print(f"dt = {dt:.4f}")
print(f"accel * dt = {accel * dt:.4f}")

positions = []
for frame in range(FPS * 3):  # 3 seconds
    target = speed  # holding D
    vel_x += (target - vel_x) * min(accel * dt, 1.0)
    x += vel_x * dt
    
    if frame % 10 == 0:
        print(f"  Frame {frame:3d} ({frame/FPS:.2f}s): vel_x={vel_x:7.2f}  x={x:8.2f}  dx/frame={vel_x*dt:6.3f}")
    positions.append(x)

print(f"\n=== After 1 second ===")
print(f"vel_x = {vel_x:.2f}")
print(f"Total distance = {x - 300:.2f} pixels in 3 seconds")
print(f"Average speed = {(x-300)/3:.2f} pixels/second")
print(f"Speed/second in km/h equiv = {(x-300)/3 * 3.6:.1f}")

# Now the same with old values for comparison
print(f"\n=== OLD values: WALK_SPEED=7, ACCEL_G=50, dt*0.1 factor ===")
vel_x_old = 0.0
x_old = 300.0
speed_old = 7
accel_old = 50
for frame in range(FPS * 3):
    target = speed_old
    vel_x_old += (target - vel_x_old) * accel_old * dt * 0.1
    x_old += vel_x_old * dt
    if frame == 59:
        print(f"  After 1s: vel_x={vel_x_old:.2f}, x={x_old:.2f}")
    if frame == 179:
        print(f"  After 3s: vel_x={vel_x_old:.2f}, x={x_old:.2f}")

print(f"\nOld: distance after 3s = {x_old - 300:.2f}")
print(f"New: distance after 3s = {x - 300:.2f}")
print(f"Speedup factor = {(x-300)/(x_old-300):.1f}x")

pygame.quit()
