import * as THREE from 'three';
import { TRACKS, getTrackScale } from './data';
import { scene } from '../engine/scene';
import { latLngTo3D } from '../utils/math';

export let trackCurve: THREE.CatmullRomCurve3 | null = null;
export const trackMeshes: THREE.Object3D[] = [];
export const TRACK_WIDTH = 24;

export function generateTrack(trackKey: string) {
  const td = TRACKS[trackKey];
  const th = td.theme;
  const sc = getTrackScale(trackKey);

  const pts = td.waypoints.map(w => {
    const [x, y, z] = latLngTo3D(w.lat, w.lng, sc);
    return new THREE.Vector3(x, y, z);
  });
  trackCurve = new THREE.CatmullRomCurve3(pts, true);

  for (const m of trackMeshes) scene.remove(m);
  trackMeshes.length = 0;

  const tubeGeo = new THREE.TubeGeometry(trackCurve, 120, TRACK_WIDTH, 6, true);
  const tubeMat = new THREE.MeshStandardMaterial({
    color: th.track, emissive: th.trackEmissive, emissiveIntensity: 0.3,
    transparent: true, opacity: 0.7, side: THREE.DoubleSide,
  });
  const tube = new THREE.Mesh(tubeGeo, tubeMat);
  scene.add(tube);
  trackMeshes.push(tube);

  const edgeG = new THREE.Group();
  for (let side = -1; side <= 1; side += 1) {
    const sidePts: THREE.Vector3[] = [];
    for (let i = 0; i <= 120; i++) {
      const t = i / 120;
      const f = trackCurve!.getPointAt(t);
      const tan = trackCurve!.getTangentAt(t);
      const nrm = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
      sidePts.push(f.clone().add(nrm.multiplyScalar(TRACK_WIDTH * side)));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(sidePts);
    const mat = new THREE.LineBasicMaterial({
      color: side > 0 ? th.edge1 : th.edge2, transparent: true, opacity: 0.8,
    });
    edgeG.add(new THREE.Line(geo, mat));
  }
  scene.add(edgeG);

  const dashPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 120; i++) dashPts.push(trackCurve!.getPointAt(i / 120));
  const dashGeo = new THREE.BufferGeometry().setFromPoints(dashPts);
  const dashMat = new THREE.LineDashedMaterial({
    color: th.center, transparent: true, opacity: 0.4, dashSize: 3, gapSize: 4,
  });
  const dash = new THREE.Line(dashGeo, dashMat);
  dash.computeLineDistances();
  scene.add(dash);
  trackMeshes.push(dash);

  const pillarGeo = new THREE.CylinderGeometry(0.3, 0.3, 20, 8);
  const startMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.6 });
  const restMat = new THREE.MeshBasicMaterial({ color: th.edge1, transparent: true, opacity: 0.6 });

  td.waypoints.forEach((w, i) => {
    const [px, py, pz] = latLngTo3D(w.lat, w.lng, sc);
    const mat = i === 0 ? startMat : restMat;
    const m = new THREE.Mesh(pillarGeo, mat);
    m.position.set(px, py + 10, pz);
    scene.add(m);
    trackMeshes.push(m);

    const gGeo = new THREE.SphereGeometry(1.5, 16, 16);
    const gMat = i === 0
      ? new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.8 })
      : new THREE.MeshBasicMaterial({ color: th.edge2, transparent: true, opacity: 0.8 });
    const g = new THREE.Mesh(gGeo, gMat);
    g.position.set(px, py + 20, pz);
    scene.add(g);
    trackMeshes.push(g);

    if (i === 0) {
      const pl = new THREE.PointLight(0x00ff00, 5, 30);
      pl.position.set(px, py + 20, pz);
      scene.add(pl);
      trackMeshes.push(pl);
    }
  });

  [0.25, 0.5, 0.75].forEach(t => {
    const p = trackCurve!.getPointAt(t);
    const tan = trackCurve!.getTangentAt(t);
    const ag = new THREE.TorusGeometry(TRACK_WIDTH, 0.3, 8, 16, Math.PI);
    const am = new THREE.MeshBasicMaterial({ color: 0xff8800, transparent: true, opacity: 0.7 });
    const arch = new THREE.Mesh(ag, am);
    arch.position.copy(p);
    arch.position.y += 5;
    arch.lookAt(p.clone().add(tan));
    arch.rotateX(Math.PI / 2);
    scene.add(arch);
    trackMeshes.push(arch);
  });

  const bh = trackKey === 'starwars' ? 60 : 120;
  const ib = new THREE.InstancedMesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({ vertexColors: true, emissiveIntensity: 0.5, transparent: true }),
    bh,
  );
  const db = new THREE.Color();
  for (let i = 0; i < bh; i++) {
    const ti = Math.random();
    const p = trackCurve!.getPointAt(ti);
    const tan = trackCurve!.getTangentAt(ti);
    const nrm = new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize();
    const side = Math.random() > 0.5 ? 1 : -1;
    const dist = 60 + Math.random() * 200;
    const h = 30 + Math.random() * 150;
    const w = 8 + Math.random() * 20;
    const d = 8 + Math.random() * 20;
    db.setHSL(th.buildingHue[0] + Math.random() * (th.buildingHue[1] - th.buildingHue[0]), 0.8, 0.05);
    const obj = new THREE.Object3D();
    obj.position.copy(p).add(nrm.multiplyScalar(dist * side));
    obj.scale.set(w, h, d);
    obj.updateMatrix();
    ib.setMatrixAt(i, obj.matrix);
    ib.setColorAt(i, db);
  }
  ib.instanceMatrix.needsUpdate = true;
  scene.add(ib);
  trackMeshes.push(ib);

  document.getElementById('track-name')!.textContent = td.name;
}
