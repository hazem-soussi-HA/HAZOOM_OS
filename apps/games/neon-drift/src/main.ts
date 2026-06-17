import * as THREE from 'three';
import { initWasm, getGameState, createInputState, initTrack, resetGameState } from './bridge';
import { initRenderer, renderer, composer, bloom } from './engine/renderer';
import { scene, camera, applyTheme } from './engine/scene';
import { audio } from './audio/engine';
import { getInputState, isEscapePressed } from './input/keyboard';
import { TRACKS, getTrackScale, getTrackWaypointsFlat } from './track/data';
import { generateTrack, trackCurve, trackMeshes, TRACK_WIDTH } from './track/builder';
import { renderMinimap, setSelectedTrack, getSelectedTrack } from './track/minimap';
import { createLuxuryCar } from './car/factory';
import { spawnNitroTrail, spawnDriftSparks, updateParticles, particleSystem } from './particles/pool';
import { updateHUD, updateLapTimes } from './ui/hud';
import { startCountdown, cancelCountdown, isCountdownActive } from './ui/countdown';
import { showGameOver, hideGameOver } from './ui/gameover';

let carGroup: THREE.Group | null = null;
let opponentMeshes: THREE.Group[] = [];
let gameRunning = false;
let aiMode = false;
let lastTime = 0;
let lastDriftSound = 0;

function init() {
  initRenderer();
  applyTheme(TRACKS['command-center'].theme);

  generateTrack('command-center');

  carGroup = createLuxuryCar(0x00ffff);
  scene.add(carGroup);

  const initPos = trackCurve!.getPointAt(0);
  camera.position.set(initPos.x, initPos.y + 10, initPos.z - 20);
  camera.lookAt(initPos);

  composer?.render() ?? renderer.render(scene, camera);

  setupUI();
  createStartBackground();
}

function setupUI() {
  document.querySelectorAll('.track-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.track-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      setSelectedTrack(card.dataset.track!);
    });
  });

  document.getElementById('sound-toggle')!.addEventListener('click', function () {
    const enabled = audio.toggle();
    (this as HTMLElement).textContent = enabled ? '🔊' : '🔇';
    (this as HTMLElement).classList.toggle('muted', !enabled);
  });

  document.getElementById('start-btn')!.addEventListener('click', startGame);
  document.getElementById('restart-btn')!.addEventListener('click', startGame);
  document.getElementById('ai-btn')!.addEventListener('click', function () {
    this.classList.toggle('active');
  });
}

function createStartBackground() {
  const container = document.getElementById('start-bg')!;
  for (let i = 0; i < 50; i++) {
    const p = document.createElement('div');
    p.className = 'start-particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = (3 + Math.random() * 7) + 's';
    p.style.animationDelay = Math.random() * 5 + 's';
    p.style.width = p.style.height = (1 + Math.random() * 3) + 'px';
    p.style.background = ['#0ff', '#f0f', '#ff0', '#f80'][Math.floor(Math.random() * 4)];
    container.appendChild(p);
  }
}

async function startGame() {
  try {
    if (!audio.ctx) audio.init();

    document.getElementById('start-screen')!.style.display = 'none';
    hideGameOver();

    const trackKey = getSelectedTrack();
    const th = TRACKS[trackKey].theme;
    applyTheme(th);
    generateTrack(trackKey);

    if (carGroup) scene.remove(carGroup);
    for (const m of opponentMeshes) scene.remove(m);
    opponentMeshes.length = 0;
    carGroup = createLuxuryCar(0x00ffff);
    scene.add(carGroup);

    const waypointsFlat = getTrackWaypointsFlat(trackKey);
    const scale = getTrackScale(trackKey);
    await initWasm();
    initTrack(waypointsFlat, scale);
    resetGameState();

    aiMode = document.getElementById('ai-btn')!.classList.contains('active');

    const startPos = trackCurve!.getPointAt(0);
    const startTan = trackCurve!.getTangentAt(0);

    startCountdown(
      { x: startPos.x, y: startPos.y + 2, z: startPos.z },
      Math.atan2(startTan.z, startTan.x),
      0,
      () => {
        gameRunning = true;
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
      },
    );
  } catch (err) {
    console.error('startGame error:', err);
    document.getElementById('start-screen')!.style.display = 'flex';
  }
}

function gameLoop(timestamp: number) {
  if (!gameRunning) return;

  const dt = Math.min((timestamp - lastTime) / 16.67, 3);
  lastTime = timestamp;

  const input = getInputState();

  if (isEscapePressed()) {
    if (isCountdownActive()) {
      cancelCountdown();
      gameRunning = false;
      document.getElementById('countdown')!.style.display = 'none';
      document.getElementById('start-screen')!.style.display = 'flex';
      return;
    } else {
      endGame();
      return;
    }
  }

  const gs = getGameState();
  const wasmInput = createInputState(
    input.accelerating, input.braking, input.boosting,
    input.left, input.right, input.drifting,
  );
  gs.update(wasmInput, dt, aiMode);

  const speedKmh = Math.floor(gs.player_speed() * 100000);
  if (input.boosting && gs.player_nitro() > 0) {
    spawnNitroTrail(gs.player_x(), gs.player_y(), gs.player_z(), gs.player_angle(), gs.player_nitro());
    if (Math.random() > 0.7) audio.playNitro();
  }
  if (gs.player_drifting() && Date.now() - lastDriftSound > 300) {
    spawnDriftSparks(gs.player_x(), gs.player_y(), gs.player_z(), gs.player_angle());
    audio.playDrift();
    lastDriftSound = Date.now();
  }

  updateParticles();
  audio.updateEngine(gs.player_speed());
  updateSpeedLines(gs.player_speed() / 0.0008);

  if (carGroup) {
    carGroup.position.set(gs.player_x(), gs.player_y(), gs.player_z());
    carGroup.rotation.y = gs.player_angle() + gs.player_drift_angle();
    carGroup.position.y += Math.sin(gs.game_time() * 3) * 0.3;

    const thruster = carGroup.getObjectByName('thruster') as THREE.PointLight;
    if (thruster) {
      const isNitro = input.boosting && gs.player_nitro() > 0;
      thruster.color.setHex(isNitro ? 0xff8800 : 0x00ffff);
      thruster.intensity = isNitro ? 15 + Math.sin(gs.game_time() * 20) * 5 : 5 + Math.sin(gs.game_time() * 10) * 2;
    }

    const underglow = carGroup.getObjectByName('underglow') as THREE.Mesh;
    if (underglow) {
      (underglow.material as THREE.MeshBasicMaterial).opacity = 0.12 + Math.sin(gs.game_time() * 2) * 0.05;
    }

    if (gs.player_invincible() > 0 && Math.floor(gs.player_invincible() * 10) % 3 < 2) {
      carGroup.visible = false;
    } else {
      carGroup.visible = true;
    }
  }

  const speedRatio = gs.player_speed() / 0.0008;
  const camDistance = 18 - speedRatio * 6;
  const camHeight = 8 - speedRatio * 2;
  if (carGroup) {
    const camOffset = new THREE.Vector3(0, camHeight, -camDistance);
    const camWorldOffset = camOffset.applyQuaternion(carGroup.quaternion);
    camera.position.lerp(carGroup.position.clone().add(camWorldOffset), 0.08);
    camera.lookAt(carGroup.position);
  }

  const aiPositions: { x: number; z: number; color: number }[] = [];
  for (let i = 0; i < gs.ai_count(); i++) {
    if (i >= opponentMeshes.length) {
      const aiGroup = createLuxuryCar(gs.ai_color(i));
      scene.add(aiGroup);
      opponentMeshes.push(aiGroup);
    }
    opponentMeshes[i].position.set(gs.ai_x(i), gs.ai_y(i), gs.ai_z(i));
    opponentMeshes[i].rotation.y = gs.ai_angle(i);
    aiPositions.push({ x: gs.ai_x(i), z: gs.ai_z(i), color: gs.ai_color(i) });
  }

  renderMinimap(gs.player_x(), gs.player_z(), gs.player_angle(), aiPositions);

  const currentLapTime = gs.game_time() - gs.lap_start_time();
  updateHUD(speedKmh, gs.player_nitro(), gs.lap(), gs.game_time(), currentLapTime, gs.player_rank());

  if (gs.lap_completed()) {
    audio.playLap();
  }

  if (gs.race_finished()) {
    endGame();
    return;
  }

  composer?.render() ?? renderer.render(scene, camera);
  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameRunning = false;
  const gs = getGameState();

  const lapTimesStr = gs.lap_times_json();
  const lapTimes: number[] = JSON.parse(lapTimesStr);
  const bestLap = gs.best_lap();

  showGameOver(gs.game_time(), bestLap, gs.top_speed(), gs.player_rank(), lapTimes);
  updateLapTimes(lapTimes, bestLap);
}

function updateSpeedLines(speedRatio: number) {
  const container = document.getElementById('speed-lines')!;
  if (speedRatio > 0.6) {
    container.style.opacity = (speedRatio - 0.6) * 2;
    if (container.children.length === 0) {
      for (let i = 0; i < 20; i++) {
        const line = document.createElement('div');
        line.className = 'speed-line';
        line.style.left = Math.random() * 100 + '%';
        line.style.height = (20 + Math.random() * 40) + 'px';
        line.style.animationDuration = (0.2 + Math.random() * 0.3) + 's';
        line.style.animationDelay = Math.random() * 0.5 + 's';
        container.appendChild(line);
      }
    }
  } else {
    container.style.opacity = 0;
    container.innerHTML = '';
  }
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
