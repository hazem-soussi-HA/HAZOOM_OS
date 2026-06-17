// ═══════════════════════════════════════════════════════════════
// SYSTEMS: AI DRIVER
// AI logic for computer-controlled opponents
// ═══════════════════════════════════════════════════════════════

const AIDriver = {
  // AI for demo mode (controls the player car)
  drivePlayer() {
    const lookAhead = 0.015 + (Physics.v / PHYS.maxSpeed) * 0.025;
    const targetT = (Player.progress + lookAhead) % 1;
    const curve = Environment.getCurve();
    if (!curve) return;

    const target = curve.getPointAt(targetT);
    const targetAngle = Math.atan2(target.z - Player.z, target.x - Player.x);
    const tan = curve.getTangentAt(Player.progress);
    const currentAngle = Physics.totalAngle + Math.atan2(tan.z, tan.x);
    let diff = targetAngle - currentAngle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;

    Input.keys['ArrowLeft'] = diff < -0.04;
    Input.keys['ArrowRight'] = diff > 0.04;

    const absDiff = Math.abs(diff);
    Input.keys['Shift'] = absDiff > 0.4 && Physics.v > 25;

    let speedTarget;
    if (absDiff < 0.15) speedTarget = 280;
    else if (absDiff < 0.3) speedTarget = 220;
    else if (absDiff < 0.6) speedTarget = 150;
    else speedTarget = 80;

    Input.keys['ArrowUp'] = Physics.v < speedTarget;
    Input.keys['ArrowDown'] = Physics.v > speedTarget + 8;
    Input.keys[' '] = absDiff < 0.1 && Player.nitro > 40 && Physics.v > 180;
  }
};

// Ensure AI keys are cleared when not in AI mode
function clearAIKeys() {
  delete Input.keys['ArrowLeft'];
  delete Input.keys['ArrowRight'];
  delete Input.keys['ArrowUp'];
  delete Input.keys['ArrowDown'];
  delete Input.keys[' '];
  delete Input.keys['Shift'];
}
