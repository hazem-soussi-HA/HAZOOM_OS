import * as THREE from 'three';
import type { TrackTheme } from '../types/game';

export const scene = new THREE.Scene();
export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);

let ambientLight: THREE.AmbientLight;
let sunLight: THREE.DirectionalLight;
let starField: THREE.Points | null = null;
let gridHelper: THREE.GridHelper | null = null;

export function initScene() {
  scene.background = new THREE.Color(0x030308);
  scene.fog = new THREE.FogExp2(0x030308, 0.0008);

  ambientLight = new THREE.AmbientLight(0x222244, 0.5);
  scene.add(ambientLight);

  sunLight = new THREE.DirectionalLight(0x4444ff, 0.3);
  sunLight.position.set(100, 200, 100);
  scene.add(sunLight);
}

export function createStarfield(color: number, opacity: number) {
  if (starField) scene.remove(starField);
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(3000 * 3);
  for (let i = 0; i < pos.length; i++) pos[i] = (Math.random() - 0.5) * 4000;
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  starField = new THREE.Points(geo, new THREE.PointsMaterial({ color, size: 1.5, transparent: true, opacity }));
  scene.add(starField);
}

export function createGrid(color: number) {
  if (gridHelper) scene.remove(gridHelper);
  gridHelper = new THREE.GridHelper(4000, 80, color, 0x110022);
  gridHelper.position.y = -200;
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = 0.25;
  scene.add(gridHelper);
}

export function applyTheme(theme: TrackTheme) {
  scene.background = new THREE.Color(theme.sky);
  scene.fog = new THREE.FogExp2(theme.fog, 0.0008);
  createStarfield(theme.starColor, theme.starOpacity);
  createGrid(theme.grid);
}
