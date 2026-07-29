# Physics Engine Documentation

## Constants

| Constant | Value | Unit | Purpose |
|----------|-------|------|---------|
| GRAVITY | 2200 | px/s² | Downward acceleration |
| JUMP_VEL | -680 | px/s | Full jump initial velocity |
| SHORT_HOP | -420 | px/s | Tap jump initial velocity |
| MAX_FALL | 900 | px/s | Terminal velocity |
| WALK_SPEED | 220 | px/s | Walking max speed |
| RUN_SPEED | 380 | px/s | Running max speed |
| COYOTE_TIME | 0.10 | s | Edge forgiveness window |
| JUMP_BUF | 0.12 | s | Input buffer duration |
| JUMP_HOLD | 0.15 | s | Variable jump window |
| AG | 35 | /s | Ground acceleration rate |
| AY | 22 | /s | Air acceleration rate |
| DG | 28 | /s | Ground deceleration rate |
| DA | 15 | /s | Air deceleration rate |

## Jump Mechanics

### Variable Jump Height
- **Tap jump**: `SHORT_HOP = -420 px/s` → ~1.5 tile height
- **Full jump**: `JUMP_VEL = -680 px/s` → ~3.2 tile height
- **Hold bonus**: First 150ms of upward velocity uses 40% gravity

### Formula
```
if jump_held and ascending:
    vy += GRAVITY * 0.4 * dt  # Reduced gravity
else:
    vy += GRAVITY * 1.0 * dt  # Full gravity
```

### Coyote Time
After leaving a ledge, player has 100ms to still jump. This prevents
frustration from near-misses.

### Jump Buffer
Jump input is buffered for 120ms before landing. If player presses jump
before hitting ground, jump executes on contact.

## Movement Mechanics

### Acceleration Model
Uses exponential decay approach:
```
vx += (target_vx - vx) * min(accel * dt, 1.0)
```

### Friction Model (when not pressing keys)
```
vx *= max(0, 1 - friction * dt)
```

### Ground vs Air
- Ground: Higher accel (35), higher decel (28)
- Air: Lower accel (22), lower decel (15)
- This creates the classic "slippery air, grippy ground" feel

## Squash & Stretch

### Jump Stretch
- squash_y = 0.7 (compress vertically)
- squash_x = 1.3 (expand horizontally)

### Landing Squash
- squash_y = 1.0 + impact * 0.4 (expand vertically)
- squash_x = 1.0 - impact * 0.25 (compress horizontally)

### Recovery
All squash values spring back to 1.0 at rate 14*dt per frame.
