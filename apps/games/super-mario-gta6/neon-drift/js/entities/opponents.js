// ═══════════════════════════════════════════════════════════════
// ENTITIES: OPPONENTS
// AI racers — car models, AI driving logic
// ═══════════════════════════════════════════════════════════════

const Opponents = {
  meshes: [],
  data: [],

  init() {
    this.meshes.forEach(m => Engine.scene.remove(m));
    this.meshes = [];
    this.data = [];

    for (let i = 0; i < OPPONENT_COUNT; i++) {
      const group = CarBuilder.create(OPPONENT_COLORS[i]);
      Engine.scene.add(group);
      this.meshes.push(group);
      this.data.push({
        progress: (i + 1) / 10,
        baseSpeed: 0.0003 + Math.random() * 0.0002,
        name: OPPONENT_NAMES[i],
        color: OPPONENT_COLORS[i],
        lap: 1,
        racingLine: 0,
        targetRacingLine: 0
      });
    }
  },

  reset() {
    this.data.forEach((opp, i) => {
      opp.progress = (i + 1) / 10;
      opp.lap = 1;
    });
  },

  update(dt, playerProgress, trackCurve, trackWidth) {
    if (!trackCurve) return;

    this.data.forEach((opp, i) => {
      opp.progress += opp.baseSpeed * dt;
      if (opp.progress > 1) { opp.progress -= 1; opp.lap++; }
      if (opp.progress < 0) opp.progress += 1;

      const oppPos = trackCurve.getPointAt(opp.progress);
      const oppTan = trackCurve.getTangentAt(opp.progress);
      const oppNormal = new THREE.Vector3().crossVectors(oppTan, new THREE.Vector3(0, 1, 0)).normalize();

      opp.racingLine += (opp.targetRacingLine - opp.racingLine) * 0.05;
      if (Math.random() < 0.02) opp.targetRacingLine = (Math.random() - 0.5) * 2;

      const offsetPos = oppPos.clone().add(oppNormal.multiplyScalar(opp.racingLine * 8));
      this.meshes[i].position.set(offsetPos.x, oppPos.y + 2, offsetPos.z);
      this.meshes[i].lookAt(offsetPos.x + oppTan.x, oppPos.y + 2, offsetPos.z + oppTan.z);
    });
  },

  checkCollision(playerX, playerZ, playerInvincible) {
    if (playerInvincible > 0) return false;
    for (let i = 0; i < this.data.length; i++) {
      const opp = this.data[i];
      const oppPos = Environment.getCurve().getPointAt(opp.progress);
      const oppTan = Environment.getCurve().getTangentAt(opp.progress);
      const oppNormal = new THREE.Vector3().crossVectors(oppTan, new THREE.Vector3(0, 1, 0)).normalize();
      const offsetPos = oppPos.clone().add(oppNormal.multiplyScalar(opp.racingLine * 8));
      const dx = playerX - offsetPos.x;
      const dz = playerZ - offsetPos.z;
      if (Math.sqrt(dx * dx + dz * dz) < 4) return true;
    }
    return false;
  },

  getRank(playerLap, playerProgress) {
    let rank = 1;
    this.data.forEach(opp => {
      if ((opp.lap - 1) + opp.progress > (playerLap - 1) + playerProgress) rank++;
    });
    return rank;
  }
};
