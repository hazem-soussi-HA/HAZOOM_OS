"""Check Ursina 8.x API availability"""
import ursina

checks = ['lerp', 'lerp_angle', 'AmbientLight', 'DirectionalLight', 'Sky', 'distance', 'invoke']
for name in checks:
    found = hasattr(ursina, name)
    print(f"{name}: {'OK' if found else 'MISSING'}")

# Also check color module
from ursina import color
color_checks = ['darken', 'lighten', 'rgba', 'hsv', 'rgb']
print("\ncolor module:")
for name in color_checks:
    print(f"  color.{name}: {'OK' if hasattr(color, name) else 'MISSING'}")

# Check if lerp_angle is in math module alternative
import math
print(f"\nmath.degrees: {'OK' if hasattr(math, 'degrees') else 'MISSING'}")
print(f"math.atan2: {'OK' if hasattr(math, 'atanan2') else 'MISSING'}")
