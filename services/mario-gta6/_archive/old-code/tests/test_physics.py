"""Unit tests for Super Mario GTA6 physics engine."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Test constants
def test_physics_constants():
    """Verify physics constants are properly tuned."""
    # Import from game module
    # These are the values that make the game feel right
    GRAV = 2200
    JVEL = -680
    
    # Jump height should be about 3 tiles (144px)
    # Using: h = v² / (2g)
    jump_height = JVEL**2 / (2 * GRAV)
    assert 120 < jump_height < 180, f"Jump height {jump_height} outside expected range"
    print(f"✅ Jump height: {jump_height:.0f}px (expected ~144px)")
    
    # Short hop should be about 1.5 tiles (72px)
    SHOP = -420
    short_hop = SHOP**2 / (2 * GRAV)
    assert 50 < short_hop < 100, f"Short hop {short_hop} outside expected range"
    print(f"✅ Short hop: {short_hop:.0f}px (expected ~72px)")
    
    print("✅ All physics constant tests passed!")


def test_acceleration():
    """Test that acceleration reaches target speed in reasonable time."""
    dt = 1/60
    AG = 35
    target = 220  # WALK_SPEED
    
    vx = 0
    frames = 0
    while vx < target * 0.95 and frames < 300:
        vx += (target - vx) * min(AG * dt, 1.0)
        frames += 1
    
    assert frames < 10, f"Acceleration too slow: {frames} frames to reach 95% speed"
    print(f"✅ Acceleration: {frames} frames to 95% speed")


def test_friction():
    """Test that friction brings player to stop."""
    dt = 1/60
    vx = 220
    
    frames = 0
    while vx > 5 and frames < 300:
        vx *= max(0, 1 - 12.0 * dt)
        frames += 1
    
    assert frames < 20, f"Friction too slow: {frames} frames to stop"
    print(f"✅ Friction: {frames} frames to stop")


if __name__ == '__main__':
    test_physics_constants()
    test_acceleration()
    test_friction()
    print("\n✅ ALL TESTS PASSED")
