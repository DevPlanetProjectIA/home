import * as THREE from 'three';

const key = (x, y, z) => `${x.toFixed(3)}_${y.toFixed(3)}_${z.toFixed(3)}`;

export function ensureVertexColors(geometry, baseColor = new THREE.Color(0x9aa4b2)) {
  const geo = geometry.index ? geometry.toNonIndexed() : geometry;
  const count = geo.attributes.position.count;
  if (!geo.attributes.color) {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) { arr[i * 3] = baseColor.r; arr[i * 3 + 1] = baseColor.g; arr[i * 3 + 2] = baseColor.b; }
    geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  }
  return geo;
}

/** Constrói adjacência de triângulos (por aresta compartilhada) para o balde de tinta. */
export function buildAdjacency(geo) {
  const pos = geo.attributes.position;
  const triCount = pos.count / 3;
  const edgeMap = new Map();
  const triKeys = [];
  for (let t = 0; t < triCount; t++) {
    const ks = [0, 1, 2].map((j) => key(pos.getX(t * 3 + j), pos.getY(t * 3 + j), pos.getZ(t * 3 + j)));
    triKeys.push(ks);
    for (let e = 0; e < 3; e++) {
      const a = ks[e], b = ks[(e + 1) % 3];
      const ek = a < b ? `${a}|${b}` : `${b}|${a}`;
      if (!edgeMap.has(ek)) edgeMap.set(ek, []);
      edgeMap.get(ek).push(t);
    }
  }
  const adj = Array.from({ length: triCount }, () => new Set());
  for (const tris of edgeMap.values()) {
    for (let i = 0; i < tris.length; i++) for (let j = i + 1; j < tris.length; j++) { adj[tris[i]].add(tris[j]); adj[tris[j]].add(tris[i]); }
  }
  return adj;
}

export function paintBrush(geo, point, radiusSq, color) {
  const pos = geo.attributes.position, col = geo.attributes.color;
  const v = new THREE.Vector3();
  let changed = false;
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    if (v.distanceToSquared(point) <= radiusSq) {
      col.setXYZ(i, color.r, color.g, color.b);
      changed = true;
    }
  }
  if (changed) col.needsUpdate = true;
  return changed;
}

export function bucketFill(geo, adjacency, startTri, color, tolerance = 0.12) {
  const col = geo.attributes.color;
  const start = new THREE.Color(col.getX(startTri * 3), col.getY(startTri * 3), col.getZ(startTri * 3));
  const visited = new Set([startTri]);
  const stack = [startTri];
  const c = new THREE.Color();
  while (stack.length) {
    const t = stack.pop();
    c.setRGB(col.getX(t * 3), col.getY(t * 3), col.getZ(t * 3));
    if (c.getHexString() !== start.getHexString()) {
      const d = Math.abs(c.r - start.r) + Math.abs(c.g - start.g) + Math.abs(c.b - start.b);
      if (d > tolerance) continue;
    }
    for (let j = 0; j < 3; j++) col.setXYZ(t * 3 + j, color.r, color.g, color.b);
    (adjacency[t] || []).forEach((n) => { if (!visited.has(n)) { visited.add(n); stack.push(n); } });
  }
  col.needsUpdate = true;
}
