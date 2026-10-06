import * as THREE from 'three';

export function roundShape(r = 20) {
  const s = new THREE.Shape();
  s.absarc(0, 0, r, 0, Math.PI * 2, false);
  return s;
}

export function boneShape(w = 44, h = 20) {
  // silhueta de "osso" — cápsula alongada com lóbulos nas pontas
  const s = new THREE.Shape();
  const lobeR = h * 0.62, midR = h * 0.34, x1 = w / 2 - lobeR;
  s.absarc(-x1, lobeR - midR, lobeR, Math.PI * 0.55, Math.PI * 1.45, false);
  s.absarc(-x1, -(lobeR - midR), lobeR, Math.PI * 0.55, -Math.PI * 0.55, true);
  s.lineTo(x1, -midR);
  s.absarc(x1, -(lobeR - midR), lobeR, -Math.PI * 0.45, Math.PI * 0.45, false);
  s.absarc(x1, lobeR - midR, lobeR, -Math.PI * 0.45, Math.PI * 0.55 + Math.PI, true);
  s.lineTo(-x1, midR);
  return s;
}

export function heartShape(size = 22) {
  const s = new THREE.Shape();
  const x = 0, y = 0;
  s.moveTo(x, y + size * 0.3);
  s.bezierCurveTo(x, y + size * 0.1, x - size * 0.5, y - size * 0.35, x - size * 0.95, y + size * 0.15);
  s.bezierCurveTo(x - size * 1.3, y + size * 0.6, x - size * 0.6, y + size * 1.05, x, y + size * 1.5);
  s.bezierCurveTo(x + size * 0.6, y + size * 1.05, x + size * 1.3, y + size * 0.6, x + size * 0.95, y + size * 0.15);
  s.bezierCurveTo(x + size * 0.5, y - size * 0.35, x, y + size * 0.1, x, y + size * 0.3);
  const box = new THREE.Box2().setFromPoints(s.getPoints(64));
  const cx = (box.min.x + box.max.x) / 2, cy = (box.min.y + box.max.y) / 2;
  s.curves.forEach(() => {});
  const s2 = new THREE.Shape(s.getPoints(64).map((p) => new THREE.Vector2(p.x - cx, p.y - cy)));
  return s2;
}

export function starShape(outerR = 24, innerR = 10, points = 5) {
  const s = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    i === 0 ? s.moveTo(x, y) : s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

export function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
  return s;
}

export const SHAPE_BUILDERS = {
  redondo: (sz = 30) => roundShape(sz),
  osso: (sz = 30) => boneShape(sz * 1.8, sz),
  coracao: (sz = 30) => heartShape(sz * 0.9),
  estrela: (sz = 30) => starShape(sz, sz * 0.42),
};

export function ringGeometry(radius = 5, tube = 1.6, segments = 24) {
  return new THREE.TorusGeometry(radius, tube, 10, segments);
}

export function ellipseShape(rx = 10, ry = 14, cx = 0, cy = 0) {
  const s = new THREE.Shape();
  s.absellipse(cx, cy, rx, ry, 0, Math.PI * 2, false, 0);
  return s;
}
export function triangleShape(w = 20, h = 20) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(0, h / 2); s.closePath();
  return s;
}
export function polygonShape(r = 20, sides = 6, rot = 0) {
  const s = new THREE.Shape();
  for (let i = 0; i < sides; i++) {
    const a = (i / sides) * Math.PI * 2 + rot;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    i === 0 ? s.moveTo(x, y) : s.lineTo(x, y);
  }
  s.closePath();
  return s;
}
export function ringFlatShape(rOuter = 20, rInner = 9) {
  const s = new THREE.Shape();
  s.absarc(0, 0, rOuter, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, rInner, 0, Math.PI * 2, true);
  s.holes.push(hole);
  return s;
}
/** Boca fina em forma de crescente: dip>0 = sorriso (U), dip<0 = triste (∩) */
export function mouthShape(width = 14, dip = 5, thickness = 2.4) {
  const s = new THREE.Shape();
  const hw = width / 2;
  s.moveTo(-hw, 0);
  s.quadraticCurveTo(0, -dip, hw, 0);
  s.quadraticCurveTo(0, -dip - thickness * Math.sign(dip || 1), -hw, -thickness * 0);
  s.lineTo(-hw, 0);
  return s;
}
export function barShape(w = 14, h = 3, rot = 0) {
  const s = roundedRectShape(w, h, h / 2);
  if (rot) s.getPoints().forEach(() => {});
  return s;
}

