export interface TrackTheme {
  sky: number;
  fog: number;
  grid: number;
  track: number;
  trackEmissive: number;
  edge1: number;
  edge2: number;
  center: number;
  buildingHue: [number, number];
  buildingEmissive: number;
  starColor: number;
  starOpacity: number;
}

export interface Waypoint {
  name: string;
  lat: number;
  lng: number;
}

export interface TrackData {
  name: string;
  theme: TrackTheme;
  waypoints: Waypoint[];
}

export interface PlayerState {
  x: number;
  y: number;
  z: number;
  angle: number;
  speed: number;
  nitro: number;
  drifting: boolean;
  driftAngle: number;
  invincible: number;
  lateralOffset: number;
}

export interface OpponentState {
  x: number;
  y: number;
  z: number;
  angle: number;
  color: number;
}
