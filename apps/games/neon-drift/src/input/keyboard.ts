const keys: Record<string, boolean> = {};

document.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  e.preventDefault();
});

document.addEventListener('keyup', e => {
  keys[e.key.toLowerCase()] = false;
});

export function isKeyDown(key: string): boolean {
  return !!keys[key.toLowerCase()];
}

export function getInputState() {
  return {
    accelerating: isKeyDown('arrowup') || isKeyDown('w'),
    braking: isKeyDown('arrowdown') || isKeyDown('s'),
    boosting: isKeyDown(' '),
    left: isKeyDown('arrowleft') || isKeyDown('a'),
    right: isKeyDown('arrowright') || isKeyDown('d'),
    drifting: isKeyDown('shift'),
    escape: isKeyDown('escape'),
  };
}

export function isEscapePressed(): boolean {
  return isKeyDown('escape');
}
