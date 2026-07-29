"""Quick 2D render test using PIL."""
import os
from PIL import Image, ImageDraw, ImageFont
import math, random

W, H = 1280, 720
img = Image.new('RGB', (W, H))
draw = ImageDraw.Draw(img)

# Sky gradient
for y in range(H):
    t = y / H
    r, g, b = int(100+80*t), int(170+50*t), int(255-55*t)
    draw.line([(0,y),(W,y)], fill=(r,g,b))

# Sun
draw.ellipse([W-200, 40, W-80, 160], fill=(255,240,180), outline=(255,220,120))

# Far buildings
random.seed(42)
for x in [20, 80, 160, 250, 340, 430, 520, 610, 700, 790, 880, 970, 1060, 1150, 1240]:
    bh, bw = random.randint(60,180), random.randint(25,45)
    draw.rectangle([x, H-200-bh, x+bw, H-200], fill=(140,150,170))

# Mid buildings with windows
for x in [50, 180, 350, 500, 680, 850, 1020, 1180]:
    bh, bw = random.randint(40,120), random.randint(30,50)
    draw.rectangle([x, H-200-bh, x+bw, H-200], fill=(160,165,175))
    for wy in range(H-200-bh+10, H-220, 18):
        for wx in range(x+5, x+bw-5, 12):
            draw.rectangle([wx, wy, wx+7, wy+10],
                           fill=(255,240,150) if random.random()>0.4 else (40,40,50))

# Ground + road
draw.rectangle([0, H-200, W, H-160], fill=(90,140,50))
draw.rectangle([0, H-160, W, H-110], fill=(58,58,66))
draw.rectangle([0, H-165, W, H-153], fill=(176,168,152))
for x in range(0, W, 40):
    draw.rectangle([x, H-138, x+20, H-135], fill=(255,210,50))

# Mario sprite
mx, my = 380, H-210
draw.ellipse([mx-12,my+46,mx+12,my+54], fill=(30,30,30))
draw.rectangle([mx-8,my+36,mx+2,my+44], fill=(90,55,25))
draw.rectangle([mx+2,my+36,mx+12,my+44], fill=(90,55,25))
draw.rectangle([mx-7,my+20,mx+7,my+38], fill=(30,60,200))
draw.rectangle([mx-8,my+18,mx+8,my+22], fill=(60,40,15))
draw.rectangle([mx-10,my-2,mx+10,my+22], fill=(220,30,30))
draw.rectangle([mx-14,my+1,mx-8,my+17], fill=(220,30,30))
draw.rectangle([mx+8,my+1,mx+14,my+17], fill=(220,30,30))
draw.ellipse([mx-16,my+15,mx-6,my+25], fill=(255,255,255))
draw.ellipse([mx+6,my+15,mx+16,my+25], fill=(255,255,255))
draw.ellipse([mx-10,my-24,mx+10,my-4], fill=(245,210,160))
draw.rounded_rectangle([mx-11,my-34,mx+11,my-22], radius=4, fill=(220,30,30))
draw.rectangle([mx-12,my-26,mx+14,my-21], fill=(220,30,30))
draw.rectangle([mx-3,my-31,mx+3,my-25], fill=(255,255,255))
draw.ellipse([mx-6,my-19,mx-2,my-14], fill=(15,15,15))
draw.ellipse([mx+2,my-19,mx+6,my-14], fill=(15,15,15))
draw.ellipse([mx-4,my-15,mx+4,my-10], fill=(245,210,160))
draw.rounded_rectangle([mx-7,my-12,mx+7,my-8], radius=2, fill=(50,30,10))

# Car
cx, cy = 650, H-210
draw.rounded_rectangle([cx-35,cy+8,cx+35,cy+28], radius=4, fill=(220,40,40))
draw.rounded_rectangle([cx-22,cy-6,cx+24,cy+12], radius=3, fill=(60,60,70))
draw.rectangle([cx-18,cy-4,cx+18,cy+6], fill=(150,200,240))
draw.ellipse([cx+33,cy+14,cx+41,cy+22], fill=(255,255,220))
draw.ellipse([cx-41,cy+14,cx-33,cy+22], fill=(255,255,220))
draw.ellipse([cx-24,cy+22,cx-8,cy+38], fill=(30,30,30))
draw.ellipse([cx+8,cy+22,cx+24,cy+38], fill=(30,30,30))
draw.ellipse([cx-20,cy+26,cx-12,cy+34], fill=(80,80,80))
draw.ellipse([cx+12,cy+26,cx+20,cy+34], fill=(80,80,80))

# Coins
random.seed(123)
for i in range(10):
    coin_x = 100 + i*110
    coin_y = H-250-random.randint(0,50)
    draw.ellipse([coin_x-8,coin_y-8,coin_x+8,coin_y+8], fill=(255,200,0))
    draw.ellipse([coin_x-5,coin_y-5,coin_x+5,coin_y+5], fill=(200,160,0))

# HUD
try:
    fp = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
    if not os.path.exists(fp):
        fp = "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf"
    fL = ImageFont.truetype(fp, 32) if os.path.exists(fp) else ImageFont.load_default()
    fM = ImageFont.truetype(fp, 22) if os.path.exists(fp) else ImageFont.load_default()
    fS = ImageFont.truetype(fp, 16) if os.path.exists(fp) else ImageFont.load_default()
except:
    fL = fM = fS = ImageFont.load_default()

draw.rectangle([W//2-200, 8, W//2+200, 50], fill=(20,20,30))
draw.text((W//2-190, 12), "SUPER MARIO GTA6 2D", fill=(255,220,80), font=fL)
draw.text((20, 12), "COINS: 42", fill=(255,220,60), font=fM)
draw.text((20, 42), "Render test — PIL/offscreen", fill=(180,180,220), font=fS)
draw.rectangle([20, H-60, 550, H-15], fill=(20,20,30))
draw.text((30, H-55), "A/D: Move | SHIFT: Sprint | SPACE/W: Jump | F: Car", fill=(200,200,200), font=fS)

img.save('/home/hazem/mario_gta6/render_test_2d_pil.png')
print("RENDER_OK")
