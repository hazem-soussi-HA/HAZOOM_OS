import init, { GameState, InputState } from './wasm-pkg/neon_drift_wasm.js';

let wasmInitialized = false;
let gameState: GameState | null = null;

export async function initWasm(): Promise<void> {
  if (wasmInitialized) return;
  await init();
  wasmInitialized = true;
}

export function getGameState(): GameState {
  if (!gameState) {
    gameState = new GameState();
  }
  return gameState;
}

export function createInputState(
  accelerating: boolean, braking: boolean, boosting: boolean,
  left: boolean, right: boolean, drifting: boolean,
): InputState {
  return new InputState(accelerating, braking, boosting, left, right, drifting);
}

export function resetGameState() {
  if (gameState) {
    gameState.reset();
  }
}

export function initTrack(waypointsFlat: Float64Array, scale: number) {
  const gs = getGameState();
  gs.init_track(waypointsFlat, scale);
}
