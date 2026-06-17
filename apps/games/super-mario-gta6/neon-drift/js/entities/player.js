// ═══════════════════════════════════════════════════════════════
// ENTITIES: PLAYER
// Player state — position, nitro, lap tracking
// ═══════════════════════════════════════════════════════════════

const Player = {
  x: 0, y: 0, z: 0,
  speed: 0,
  nitro: NITRO_MAX,
  maxNitro: NITRO_MAX,
  invincible: 0,
  collisionCooldown: 0,
  drifting: false,
  driftAngle: 0,
  lateralOffset: 0,
  progress: 0,
  lap: 1,
  lapTriggered: false,
  lapStartTime: 0,
  bestLapTime: Infinity,
  lapTimes: [],
  topSpeed: 0,
  gameTime: 0,

  reset() {
    this.x = 0; this.y = 0; this.z = 0;
    this.speed = 0; this.nitro = NITRO_MAX;
    this.invincible = 0; this.collisionCooldown = 0;
    this.drifting = false; this.driftAngle = 0;
    this.lateralOffset = 0; this.progress = 0;
    this.lap = 1; this.lapTriggered = false;
    this.lapStartTime = 0; this.bestLapTime = Infinity;
    this.lapTimes = []; this.topSpeed = 0; this.gameTime = 0;
  },

  updateTrackPosition(trackCurve, trackWidth, dt) {
    if (!trackCurve) return;
    const trackSpeed = Physics.v / 300000;
    this.progress += trackSpeed * dt;
    if (this.progress > 1) this.progress -= 1;
    if (this.progress < 0) this.progress += 1;

    const pos = trackCurve.getPointAt(this.progress);
    const tan = trackCurve.getTangentAt(this.progress);
    const normal = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();

    Physics.angularVel *= 0.97;
    Physics.totalAngle += Physics.angularVel * (dt / 60);
    Physics.totalAngle *= 0.97;

    const trackAngle = Math.atan2(tan.z, tan.x);
    this.x = pos.x + normal.x * this.lateralOffset;
    this.y = pos.y + 2;
    this.z = pos.z + normal.z * this.lateralOffset;

    const lateralTarget = Physics.steerInput * trackWidth * 0.3;
    this.lateralOffset += (lateralTarget - this.lateralOffset) * (dt / 60) * 2;
    this.lateralOffset = Math.max(-trackWidth * 0.7, Math.min(trackWidth * 0.7, this.lateralOffset));

    const speedKmh = Math.floor(Physics.v);
    if (speedKmh > this.topSpeed) this.topSpeed = speedKmh;
    this.speed = Physics.v;
  },

  checkLap(gameTime) {
    if (this.progress > 0.95 && !this.lapTriggered) this.lapTriggered = true;
    if (this.lapTriggered && this.progress < 0.05 && this.progress > 0) {
      if (this.lapStartTime > 0) {
        const lt = gameTime - this.lapStartTime;
        this.lapTimes.push(lt);
        if (lt < this.bestLapTime) this.bestLapTime = lt;
      }
      this.lap++;
      this.lapStartTime = gameTime;
      Audio.playLap();
      if (this.lap > TOTAL_LAPS) return true; // race complete
    }
    if (this.progress > 0.4 && this.progress < 0.6) this.lapTriggered = false;
    return false;
  }
};
