// ═══════════════════════════════════════════════════════════════
// ENGINE: CONSTANTS
// All physics constants, game settings, configuration
// ═══════════════════════════════════════════════════════════════

const PHYS = {
  // Vehicle
  mass: 1350,           // kg
  enginePower: 650,     // HP
  maxRpm: 9000,
  idleRpm: 800,
  brakeTorque: 18000,   // Nm
  dragCoeff: 0.32,
  frontalArea: 2.1,     // m²
  downforceCoeff: 0.45,
  tireGrip: 1.05,
  weightDistFront: 0.48,
  aeroFront: 0.32,
  aeroRear: 0.38,
  maxSpeed: 480,        // km/h
  // Drivetrain
  gearRatios: [3.5, 2.3, 1.7, 1.3, 1.05, 0.85],
  finalDrive: 3.2,
  wheelRadius: 0.33,    // m
  shiftTime: 0.3,       // seconds
};

const AIR_DENSITY = 1.225;

const CAM_VIEWS = ['chase', 'cockpit', 'hood', 'bumper'];
const CAM_LABELS = { chase: 'CHASE CAM', cockpit: 'COCKPIT CAM', hood: 'HOOD CAM', bumper: 'BUMPER CAM' };

const TOTAL_LAPS = 3;
const NITRO_MAX = 100;
const NITRO_REGEN_RATE = 0.3;      // per frame at 60fps
const NITRO_CONSUME_RATE = 1.2;    // per frame at 60fps
const NITRO_BOOST = 5;             // km/h per frame

const OPPONENT_COUNT = 4;
const OPPONENT_NAMES = ['BLADE', 'VIPER', 'NOVA', 'SHADOW'];
const OPPONENT_COLORS = [0xff0000, 0xffff00, 0x00ff00, 0xff8800];

const PARTICLE_COUNT = 1000;

const KEY_BINDINGS = {
  accelerate: ['ArrowUp', 'w', 'W'],
  brake:      ['ArrowDown', 's', 'S'],
  left:       ['ArrowLeft', 'a', 'A'],
  right:      ['ArrowRight', 'd', 'D'],
  nitro:      [' '],
  drift:      ['Shift'],
  camera:     ['c', 'C'],
  escape:     ['Escape'],
};

// Quality presets
const QUALITY = {
  low:    { particles: 200,  bloom: false, shadows: false, buildingCount: 20,  antialias: false, pixelRatio: 1 },
  medium: { particles: 500,  bloom: true,  shadows: false, buildingCount: 40,  antialias: true,  pixelRatio: 1 },
  high:   { particles: 1000, bloom: true,  shadows: true,  buildingCount: 60,  antialias: true,  pixelRatio: 2 },
};
