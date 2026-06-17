export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function angleDiff(a: number, b: number): number {
  let diff = b - a;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

export function latLngTo3D(lat: number, lng: number, scale: number): [number, number, number] {
  const x = lng * scale;
  const y = 30 + Math.sin(lat * 0.1) * 40 + Math.cos(lng * 0.15) * 20;
  const z = lat * scale;
  return [x, y, z];
}
