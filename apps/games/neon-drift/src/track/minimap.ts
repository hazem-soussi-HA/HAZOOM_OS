import * as THREE from 'three';
import { trackCurve, TRACK_WIDTH } from './builder';
import { TRACKS } from './data';

let selectedTrack = 'command-center';
export function setSelectedTrack(track: string) { selectedTrack = track; }
export function getSelectedTrack(): string { return selectedTrack; }

export function renderMinimap(
  playerX: number, playerZ: number, playerAngle: number,
  aiPositions: { x: number; z: number; color: number }[],
) {
  const canvas = document.getElementById('minimap') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, 140, 140);

  const mx = 70, my = 70, scale = 0.16;

  ctx.fillStyle = '#f80';
  ctx.font = '7px Courier New';
  ctx.textAlign = 'center';
  ctx.fillText(TRACKS[selectedTrack].name, 70, 10);

  ctx.strokeStyle = '#0ff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i <= 60; i++) {
    const p = trackCurve!.getPointAt(i / 60);
    const x = mx + p.x * scale;
    const y = my + p.z * scale;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();

  for (const ai of aiPositions) {
    ctx.fillStyle = '#' + ai.color.toString(16).padStart(6, '0');
    ctx.beginPath();
    ctx.arc(mx + ai.x * scale, my + ai.z * scale, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#f0f';
  ctx.shadowBlur = 5;
  ctx.shadowColor = '#f0f';
  const px = mx + playerX * scale;
  const py = my + playerZ * scale;
  ctx.beginPath();
  ctx.arc(px, py, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f0f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.lineTo(px + Math.cos(playerAngle) * 8, py + Math.sin(playerAngle) * 8);
  ctx.stroke();
  ctx.shadowBlur = 0;
}
