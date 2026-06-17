// ═══════════════════════════════════════════════════════════════
// RENDER: CAMERA
// Multi-view camera system with smooth following
// ═══════════════════════════════════════════════════════════════

const Camera = {
  viewIndex: 0,
  targetPos: new THREE.Vector3(),
  targetLook: new THREE.Vector3(),

  cycle() {
    this.viewIndex = (this.viewIndex + 1) % CAM_VIEWS.length;
    const label = CAM_LABELS[CAM_VIEWS[this.viewIndex]];
    UI.setCameraLabel(label);
  },

  getView() { return CAM_VIEWS[this.viewIndex]; },

  update(player, trackCurve, gameTime) {
    if (!trackCurve) return;

    const view = this.getView();
    const speedRatio = Math.min(1, Physics.v / 300);
    const carPos = new THREE.Vector3(player.x, player.y, player.z);
    const up = new THREE.Vector3(0, 1, 0);
    const tan = trackCurve.getPointAt(0); // placeholder
    const trackAngle = Math.atan2(
      trackCurve.getTangentAt(player.progress).z,
      trackCurve.getTangentAt(player.progress).x
    );
    const totalAngle = trackAngle + Physics.totalAngle + player.driftAngle;
    const dir = new THREE.Vector3(-Math.cos(totalAngle), 0, -Math.sin(totalAngle));
    const right = new THREE.Vector3().crossVectors(dir, up).normalize();

    let targetPos, targetLook;

    switch (view) {
      case 'chase':
        targetPos = carPos.clone()
          .add(dir.clone().multiplyScalar(-(14 - speedRatio * 5)))
          .add(up.clone().multiplyScalar(7 - speedRatio * 2.5));
        targetLook = carPos.clone().add(dir.clone().multiplyScalar(5)).add(up.clone().multiplyScalar(1));
        break;
      case 'cockpit': {
        const eyeH = 1.6;
        const lookAhead = 40 + speedRatio * 50;
        const headTilt = right.clone().multiplyScalar(-Physics.lateralAccel * 0.04);
        const headNod = dir.clone().multiplyScalar(-Physics.longitudinalAccel * 0.02);
        targetPos = carPos.clone().add(up.clone().multiplyScalar(eyeH)).add(headTilt).add(headNod);
        targetLook = carPos.clone().add(dir.clone().multiplyScalar(lookAhead)).add(up.clone().multiplyScalar(0.3));
        break;
      }
      case 'hood':
        targetPos = carPos.clone().add(dir.clone().multiplyScalar(2)).add(up.clone().multiplyScalar(0.8));
        targetLook = carPos.clone().add(dir.clone().multiplyScalar(100)).add(up.clone().multiplyScalar(-0.5));
        break;
      case 'bumper':
        targetPos = carPos.clone().add(dir.clone().multiplyScalar(-0.5)).add(up.clone().multiplyScalar(0.15));
        targetLook = carPos.clone().add(dir.clone().multiplyScalar(60)).add(up.clone().multiplyScalar(-1));
        break;
    }

    const smoothFactor = view === 'chase' ? 0.08 : 0.15;
    this.targetPos.lerp(targetPos, smoothFactor);
    this.targetLook.lerp(targetLook, smoothFactor + 0.02);
    Engine.camera.position.copy(this.targetPos);
    Engine.camera.lookAt(this.targetLook);

    const targetFov = 70 + speedRatio * 12;
    Engine.camera.fov += (targetFov - Engine.camera.fov) * 0.03;
    Engine.camera.updateProjectionMatrix();
  }
};
