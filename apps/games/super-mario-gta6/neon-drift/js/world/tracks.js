// ═══════════════════════════════════════════════════════════════
// WORLD: TRACKS
// Track data definitions — waypoints, themes, metadata
// ═══════════════════════════════════════════════════════════════

const TRACKS = {
  'command-center': {
    name: 'QUANTUM COMMAND',
    theme: {
      sky: 0x030308, fog: 0x030308,
      grid: 0xff00ff, track: 0x0a1a2a, trackEmissive: 0x001122,
      edge1: 0xff00ff, edge2: 0x00ffff, center: 0x00ffff,
      buildingHue: [0.5, 0.8], buildingEmissive: 0.08,
      starColor: 0xffffff, starOpacity: 0.6
    },
    waypoints: [
      {name:'Neo-Tokyo',lat:35.7,lng:139.7},
      {name:'Zenith-7',lat:41.9,lng:12.5},
      {name:'Cyber-Paris',lat:48.9,lng:2.3},
      {name:'New Berlin',lat:52.5,lng:13.4},
      {name:'Mega-London',lat:51.5,lng:-0.1},
      {name:'Neo-Moscow',lat:55.8,lng:37.6},
      {name:'Quantum-Haven',lat:-33.9,lng:18.4},
      {name:'Void-Station',lat:0,lng:0},
      {name:'Eclipse-City',lat:-12.0,lng:-77.0},
      {name:'Solaris-9',lat:15.3,lng:-45.7},
      {name:'Nova-Prime',lat:34.1,lng:-118.2},
      {name:'Silicon Valley',lat:37.4,lng:-122.1}
    ],
    scale: 3
  },
  'starwars': {
    name: 'GALACTIC CORE',
    theme: {
      sky: 0x000000, fog: 0x000000,
      grid: 0xffff00, track: 0x111111, trackEmissive: 0x002200,
      edge1: 0xffff00, edge2: 0xff0000, center: 0xff8800,
      buildingHue: [0.05, 0.15], buildingEmissive: 0.12,
      starColor: 0xffff00, starOpacity: 0.8
    },
    waypoints: [
      {name:'Core World Alpha',lat:10,lng:20},
      {name:'Core World Beta',lat:-10,lng:-20},
      {name:'Outer Rim Gamma',lat:50,lng:-50},
      {name:'Outer Rim Delta',lat:-50,lng:50}
    ],
    scale: 8
  },
  'world-map': {
    name: 'EARTH CIRCUIT',
    theme: {
      sky: 0x0a1a3a, fog: 0x0a1a3a,
      grid: 0x00ff00, track: 0x0a2a1a, trackEmissive: 0x002200,
      edge1: 0x00ff00, edge2: 0x00ffff, center: 0x00ff88,
      buildingHue: [0.25, 0.45], buildingEmissive: 0.06,
      starColor: 0xaaccff, starOpacity: 0.4
    },
    waypoints: [
      {name:'New York',lat:40.7,lng:-74.0},
      {name:'London',lat:51.5,lng:-0.1},
      {name:'Paris',lat:48.9,lng:2.4},
      {name:'Cairo',lat:30.0,lng:31.2},
      {name:'Tokyo',lat:35.7,lng:139.7},
      {name:'Beijing',lat:39.9,lng:116.4},
      {name:'Sydney',lat:-33.9,lng:151.2},
      {name:'Rio',lat:-22.9,lng:-43.2}
    ],
    scale: 4
  }
};

function latLngTo3D(lat, lng, scale) {
  return {
    x: lng * scale,
    y: 30 + Math.sin(lat * 0.1) * 40 + Math.cos(lng * 0.15) * 20,
    z: lat * scale
  };
}
