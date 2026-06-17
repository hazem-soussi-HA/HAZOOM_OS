import * as THREE from 'three';
import { audio } from '../audio/engine';
import { isKeyDown } from '../input/keyboard';
import { renderer, composer } from '../engine/renderer';
import { scene, camera } from '../engine/scene';
import { trackCurve, TRACK_WIDTH } from '../track/builder';

let active = false;
let value = 3;
let rafId: number | null = null;

export function isCountdownActive(): boolean { return active; }

export function startCountdown(
  playerPos: { x: number; y: number; z: number },
  playerAngle: number,
  lateralOffset: number,
  onDone: () => void,
) {
  active = true;
  value = 3;
  const el = document.getElementById('countdown')!;
  const instruction = document.getElementById('countdown-instruction')!;
  const flash = document.getElementById('go-flash')!;
  el.style.display = 'block';
  instruction.style.display = 'block';

  function countdownRender() {
    if (!active) return;
    const left = isKeyDown('arrowleft') || isKeyDown('a');
    const right = isKeyDown('arrowright') || isKeyDown('d');
    let angle = playerAngle;
    if (left) angle -= 0.02 * 0.3;
    if (right) angle += 0.02 * 0.3;

    if (trackCurve) {
      const pos = trackCurve.getPointAt(0);
      const tan = trackCurve.getTangentAt(0);
      const normal = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
      camera.position.set(
        pos.x + normal.x * lateralOffset,
        pos.y + 10,
        pos.z + normal.z * lateralOffset - 20,
      );
      camera.lookAt(pos);
    }

    if (composer) {
      composer.render();
    } else if (renderer) {
      renderer.render(scene, camera);
    }
    rafId = requestAnimationFrame(countdownRender);
  }
  countdownRender();

  function tick() {
    if (!active) return;
    if (value > 0) {
      el.textContent = value.toString();
      el.style.color = value === 1 ? '#f00' : '#0ff';
      el.style.textShadow = value === 1
        ? '0 0 50px #f00,0 0 100px #f00'
        : '0 0 50px #0ff,0 0 100px #0ff';
      audio.playCountdownBeep(value);
      value--;
      setTimeout(tick, 1000);
    } else {
      el.textContent = 'GO!';
      el.style.color = '#0f0';
      el.style.textShadow = '0 0 50px #0f0,0 0 100px #0f0';
      instruction.style.display = 'none';
      flash.style.display = 'block';
      audio.playGoBeep();
      setTimeout(() => { flash.style.display = 'none'; }, 300);
      setTimeout(() => {
        el.style.display = 'none';
        active = false;
        if (rafId) cancelAnimationFrame(rafId);
        onDone();
      }, 500);
    }
  }
  tick();
}

export function cancelCountdown() {
  active = false;
  if (rafId) cancelAnimationFrame(rafId);
  document.getElementById('countdown')!.style.display = 'none';
  document.getElementById('countdown-instruction')!.style.display = 'none';
}
