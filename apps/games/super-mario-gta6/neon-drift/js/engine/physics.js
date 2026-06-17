// ═══════════════════════════════════════════════════════════════
// ENGINE: PHYSICS
// Car simulation physics — forces, gearbox, tire model
// Completely decoupled from rendering
// ═══════════════════════════════════════════════════════════════

const Physics = {
  // State
  v: 0,              // speed km/h
  rpm: 800,
  gear: 0,           // -1=R, 0=N, 1-6=forward
  throttle: 0,
  brake: 0,
  steerInput: 0,
  steerAngle: 0,
  slipAngle: 0,
  lateralAccel: 0,   // G
  longitudinalAccel: 0, // G
  tireSlip: 0,
  brakeGlow: 0,
  wheelSpeed: 0,
  shiftTimer: 0,
  shifting: false,
  clutch: 1,

  // Car orientation (for rendering)
  totalAngle: 0,
  angularVel: 0,

  reset() {
    this.v = 0; this.rpm = PHYS.idleRpm; this.gear = 0;
    this.throttle = 0; this.brake = 0; this.steerInput = 0;
    this.steerAngle = 0; this.slipAngle = 0;
    this.lateralAccel = 0; this.longitudinalAccel = 0;
    this.tireSlip = 0; this.brakeGlow = 0;
    this.wheelSpeed = 0; this.shiftTimer = 0;
    this.shifting = false; this.clutch = 1;
    this.totalAngle = 0; this.angularVel = 0;
  },

  update(dt, input) {
    const dtSec = dt / 60;

    const throttleInput = input.accelerate ? 1 : 0;
    const brakeInput = input.brake ? 1 : 0;
    const steerVal = (input.left ? -1 : 0) + (input.right ? 1 : 0);
    const boosting = input.nitro;

    // Smooth input
    this.throttle += (throttleInput - this.throttle) * Math.min(1, dtSec * 6);
    this.brake += (brakeInput - this.brake) * Math.min(1, dtSec * 8);
    this.steerInput += (steerVal - this.steerInput) * Math.min(1, dtSec * 12);

    const speedMs = this.v / 3.6;
    const steerSpeedFactor = Math.max(0.12, 1 - speedMs * 0.012);
    const maxSteer = 0.5 * steerSpeedFactor;
    this.steerAngle = this.steerInput * maxSteer;
    this.steerAngle *= 0.9;

    // Gearbox
    if (this.shifting) {
      this.shiftTimer -= dtSec;
      if (this.shiftTimer <= 0) { this.shifting = false; this.clutch = 1; }
      else { this.clutch = Math.min(1, this.shiftTimer / PHYS.shiftTime); }
    }

    if (!this.shifting) {
      // Auto-engage first gear when accelerating from neutral
      if (this.gear === 0 && this.throttle > 0.2 && this.v < 1) {
        this.gear = 1; this.shifting = true; this.shiftTimer = PHYS.shiftTime; this.clutch = 0;
      } else if (this.rpm > PHYS.maxRpm - 200 && this.gear < PHYS.gearRatios.length && this.throttle > 0.3) {
        if (this.gear < PHYS.gearRatios.length - 1) {
          this.gear++; this.shifting = true; this.shiftTimer = PHYS.shiftTime; this.clutch = 0;
        }
      } else if (this.rpm < 2800 && this.gear > 0 && this.throttle < 0.1) {
        this.gear--; this.shifting = true; this.shiftTimer = PHYS.shiftTime * 0.5; this.clutch = 0;
      }
    }
    if (this.v < 0.1 && brakeInput > 0.5 && this.gear === 0 && this.throttle < 0.1) this.gear = -1;
    if (this.v < -1 && this.gear === -1 && throttleInput > 0.5) this.gear = 0;

    const gearRatio = this.gear > 0 ? PHYS.gearRatios[this.gear - 1] : this.gear < 0 ? -3.0 : 1;
    const totalRatio = gearRatio * PHYS.finalDrive;
    this.wheelSpeed = speedMs / PHYS.wheelRadius;

    if (this.gear === 0 || this.gear === -1) {
      this.rpm += (PHYS.idleRpm - this.rpm) * dtSec * 5;
    } else {
      // In gear: engine RPM is driven by wheel speed AND throttle (allows launch from standstill)
      const wheelRpm = this.wheelSpeed * totalRatio * 60 / (2 * Math.PI);
      const throttleRpm = PHYS.idleRpm + this.throttle * 5000;
      const targetRpm = Math.max(wheelRpm, throttleRpm);
      this.rpm += (targetRpm - this.rpm) * dtSec * 8;
      this.rpm = Math.max(PHYS.idleRpm, Math.min(PHYS.maxRpm, this.rpm));
    }

    // Torque curve — peak at 5500 RPM, with a non-zero floor so the car can launch from standstill
    const torqueCurve = 0.35 + 0.65 * Math.max(0, 1 - Math.pow((this.rpm - 5500) / 4000, 2));
    const engineTorque = PHYS.enginePower * (5500 / Math.max(1, this.rpm)) * torqueCurve * this.throttle * this.clutch;
    const driveTorque = this.gear > 0 ? engineTorque * totalRatio : 0;
    const driveForce = driveTorque / PHYS.wheelRadius;
    const brakingForce = this.brake * PHYS.brakeTorque / PHYS.wheelRadius;

    const dragForce = 0.5 * AIR_DENSITY * PHYS.dragCoeff * PHYS.frontalArea * speedMs * speedMs;
    const downforce = 0.5 * AIR_DENSITY * PHYS.downforceCoeff * PHYS.frontalArea * speedMs * speedMs;

    const accelForce = driveForce - dragForce * Math.sign(this.v > 0 ? 1 : -1) - brakingForce;
    const longG = accelForce / (PHYS.mass * 9.81);
    this.longitudinalAccel = longG;

    const weightTransferLong = longG * PHYS.mass * 9.81 * 0.5;
    const loadFront = PHYS.mass * 9.81 * PHYS.weightDistFront - weightTransferLong + downforce * PHYS.aeroFront;
    const loadRear = PHYS.mass * 9.81 * (1 - PHYS.weightDistFront) + weightTransferLong + downforce * PHYS.aeroRear;

    // Tire slip
    this.slipAngle = -this.steerAngle * (1 + speedMs * 0.018);
    if (this.v > 1) {
      const latForceMax = (loadFront * PHYS.tireGrip + loadRear * PHYS.tireGrip) * 0.5;
      const latForce = Math.min(
        Math.abs(this.slipAngle) * PHYS.tireGrip * 2 * (loadFront + loadRear) * 0.01,
        latForceMax
      ) * Math.sign(this.slipAngle);
      this.lateralAccel = latForce / (PHYS.mass * 9.81);
      const angVelTarget = -this.slipAngle * speedMs * 0.18 / (1 + speedMs * 0.04);
      this.angularVel += (angVelTarget - this.angularVel) * dtSec * 5;
    } else {
      this.lateralAccel = 0;
      this.angularVel *= 0.9;
    }

    const netForce = driveForce - brakingForce - dragForce * Math.sign(this.v + 0.01);
    const acceleration = netForce / PHYS.mass;
    this.v += acceleration * dtSec;

    // Nitro boost
    if (boosting && Player.nitro > 0) {
      this.v += NITRO_BOOST * dtSec;
      Player.nitro -= NITRO_CONSUME_RATE * dtSec * 60;
      Player.nitro = Math.max(0, Player.nitro);
    } else {
      Player.nitro += NITRO_REGEN_RATE * dtSec * 60;
      Player.nitro = Math.min(NITRO_MAX, Player.nitro);
    }

    this.v = Math.max(-30, Math.min(PHYS.maxSpeed, this.v));

    // Tire slip for audio/visual
    const absSlip = Math.abs(this.slipAngle);
    this.tireSlip = boosting ? 0.8 : Math.min(1, absSlip * 3);

    // Brake glow
    this.brakeGlow += (this.brake - this.brakeGlow) * Math.min(1, dtSec * 10);

    // Drift detection
    Player.drifting = absSlip > 0.12 && this.v > 15;

    // Audio
    Audio.updateEngine(this.rpm, this.gear, this.throttle);
    Audio.updateTire(this.tireSlip);
  }
};
