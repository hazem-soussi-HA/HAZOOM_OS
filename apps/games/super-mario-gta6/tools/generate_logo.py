"""Generate professional logo for Super Mario GTA6."""
import os
os.environ['PYGAME_HIDE_SUPPORT_PROMPT'] = '1'
import pygame
import math

pygame.init()

# ═══ CREATE LOGO ═══
logo_w, logo_h = 512, 256
logo = pygame.Surface((logo_w, logo_h), pygame.SRCALPHA)

# Background gradient (dark blue to black)
for y in range(logo_h):
    t = y / logo_h
    r = int(10 + 20 * t)
    g = int(20 + 40 * t)
    b = int(60 + 100 * t)
    pygame.draw.line(logo, (r, g, b), (0, y), (logo_w, y))

# Stars
random_seed = 42
import random
random.seed(random_seed)
for _ in range(30):
    sx = random.randint(0, logo_w)
    sy = random.randint(0, logo_h)
    sr = random.randint(1, 3)
    brightness = random.randint(150, 255)
    pygame.draw.circle(logo, (brightness, brightness, brightness), (sx, sy), sr)

# ═══ DRAW MARIO MASCOT (simplified pixel art) ═══
mx, my = 120, 160  # Mario position

# Shadow
pygame.draw.ellipse(logo, (0, 0, 0, 100), (mx - 40, my + 50, 80, 15))

# Shoes
pygame.draw.rect(logo, (128, 64, 0), (mx - 30, my + 38, 22, 14))
pygame.draw.rect(logo, (128, 64, 0), (mx + 8, my + 38, 22, 14))

# Legs (blue)
pygame.draw.rect(logo, (30, 60, 200), (mx - 22, my - 2, 44, 42))

# Belt
pygame.draw.rect(logo, (60, 40, 15), (mx - 20, my + 30, 40, 6))
pygame.draw.rect(logo, (200, 180, 50), (mx - 4, my + 30, 8, 6))

# Torso (red)
pygame.draw.rect(logo, (220, 30, 30), (mx - 26, my - 42, 52, 44))

# Arms
pygame.draw.rect(logo, (220, 30, 30), (mx - 34, my - 32, 10, 30))
pygame.draw.rect(logo, (220, 30, 30), (mx + 24, my - 32, 10, 30))
pygame.draw.circle(logo, (255, 255, 255), (mx - 29, my - 3), 6)
pygame.draw.circle(logo, (255, 255, 255), (mx + 29, my - 3), 6)

# Head (skin)
pygame.draw.rect(logo, (248, 184, 120), (mx - 16, my - 70, 32, 30))

# Cap (red)
pygame.draw.rect(logo, (220, 30, 30), (mx - 20, my - 80, 40, 14))
pygame.draw.rect(logo, (220, 30, 30), (mx - 16, my - 86, 32, 8))
# Brim
pygame.draw.rect(logo, (220, 30, 30), (mx - 24, my - 76, 14, 6))
# M emblem
pygame.draw.rect(logo, (255, 255, 255), (mx - 4, my - 78, 8, 8))

# Eyes
pygame.draw.circle(logo, (0, 0, 0), (mx + 8, my - 58), 4)
pygame.draw.circle(logo, (255, 255, 255), (mx + 9, my - 59), 2)

# Nose
pygame.draw.ellipse(logo, (248, 184, 120), (mx + 10, my - 54, 10, 8))

# Mustache
pygame.draw.rect(logo, (50, 30, 10), (mx - 2, my - 46, 20, 6))
pygame.draw.circle(logo, (50, 30, 10), (mx - 2, my - 44), 3)
pygame.draw.circle(logo, (50, 30, 10), (mx + 18, my - 44), 3)

# Hair
pygame.draw.rect(logo, (50, 30, 10), (mx - 14, my - 64, 18, 6))

# ═══ DRAW GTA-STYLE CAR ═══
cx, cy = 380, 190

# Car shadow
pygame.draw.ellipse(logo, (0, 0, 0, 80), (cx - 50, cy + 42, 100, 12))

# Car body
pygame.draw.rect(logo, (220, 40, 40), (cx - 50, cy + 10, 100, 28), border_radius=8)
pygame.draw.rect(logo, (60, 60, 70), (cx - 25, cy - 10, 50, 24), border_radius=6)
pygame.draw.rect(logo, (150, 200, 240), (cx - 20, cy - 6, 40, 14), border_radius=4)

# Headlights
pygame.draw.circle(logo, (255, 255, 220), (cx + 48, cy + 20), 5)
pygame.draw.circle(logo, (255, 40, 40), (cx - 48, cy + 18), 4)

# Wheels
pygame.draw.circle(logo, (30, 30, 30), (cx - 30, cy + 40), 10)
pygame.draw.circle(logo, (80, 80, 80), (cx - 30, cy + 40), 6)
pygame.draw.circle(logo, (30, 30, 30), (cx + 30, cy + 40), 10)
pygame.draw.circle(logo, (80, 80, 80), (cx + 30, cy + 40), 6)

# ═══ TEXT ═══
try:
    font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    if not os.path.exists(font_path):
        font_path = "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf"
    big_font = pygame.font.Font(font_path, 48) if os.path.exists(font_path) else pygame.font.Font(None, 48)
    med_font = pygame.font.Font(font_path, 24) if os.path.exists(font_path) else pygame.font.Font(None, 24)
    sm_font = pygame.font.Font(font_path, 16) if os.path.exists(font_path) else pygame.font.Font(None, 16)
except:
    big_font = pygame.font.Font(None, 48)
    med_font = pygame.font.Font(None, 24)
    sm_font = pygame.font.Font(None, 16)

# Title with glow
title_text = "SUPER MARIO"
for offset in range(3, 0, -1):
    glow_surf = big_font.render(title_text, True, (255, 200 - offset * 40, 0))
    glow_rect = glow_surf.get_rect(center=(logo_w // 2 + 60, 60))
    logo.blit(glow_surf, (glow_rect.x + offset, glow_rect.y + offset))

title_surf = big_font.render(title_text, True, (255, 255, 255))
title_rect = title_surf.get_rect(center=(logo_w // 2 + 60, 60))
logo.blit(title_surf, title_rect)

# GTA6 subtitle
gta_surf = med_font.render("G  T  A  6", True, (255, 220, 0))
gta_rect = gta_surf.get_rect(center=(logo_w // 2 + 60, 100))
logo.blit(gta_surf, gta_rect)

# Tagline
tag_surf = sm_font.render("THE UNIFIED VISION", True, (150, 200, 255))
tag_rect = tag_surf.get_rect(center=(logo_w // 2 + 60, 130))
logo.blit(tag_surf, tag_rect)

# Copyright
copy_surf = sm_font.render("\u00a9 2026 Hazem Soussi (HA). All Rights Reserved.", True, (180, 180, 200))
copy_rect = copy_surf.get_rect(center=(logo_w // 2, logo_h - 20))
logo.blit(copy_surf, copy_rect)

# Version
ver_surf = sm_font.render("V1.0.0", True, (255, 200, 0))
ver_rect = ver_surf.get_rect(topright=(logo_w - 10, 10))
logo.blit(ver_surf, ver_rect)

# Decorative line
pygame.draw.line(logo, (255, 220, 0), (20, 145), (logo_w - 20, 145), 2)

# ═══ SAVE ═══
pygame.image.save(logo, "/home/hazem/mario_gta6/assets/logo.png")

# Also create a banner (1280x640 for GitHub social preview)
banner = pygame.Surface((1280, 640), pygame.SRCALPHA)
# Background
for y in range(640):
    t = y / 640
    r, g, b = int(10 + 30*t), int(20 + 50*t), int(60 + 120*t)
    pygame.draw.line(banner, (r, g, b), (0, y), (1280, y))
# Stars
random.seed(42)
for _ in range(60):
    sx, sy = random.randint(0, 1280), random.randint(0, 640)
    pygame.draw.circle(banner, (255, 255, 255, random.randint(100, 255)), (sx, sy), random.randint(1, 3))

# Large centered logo
large_logo = pygame.transform.scale(logo, (800, 400))
banner.blit(large_logo, (240, 120))

pygame.image.save(banner, "/home/hazem/mario_gta6/assets/banner.png")

print("Logo generated: assets/logo.png")
print("Banner generated: assets/banner.png")
