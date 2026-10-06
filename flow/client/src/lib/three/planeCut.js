import * as THREE from 'three';

function toNonIndexed(geo) {
  return geo.index ? geo.toNonIndexed() : geo;
}

function triangleIntersectPlane(p0, p1, p2, plane) {
  const pts = [p0, p1, p2];
  const d = pts.map((p) => plane.distanceToPoint(p) + 1e-7);
  const pos = [], neg = [];
  for (let i = 0; i < 3; i++) (d[i] >= 0 ? pos : neg).push(i);

  if (pos.length === 3) return { side: 'pos', tris: [[p0, p1, p2]] };
  if (neg.length === 3) return { side: 'neg', tris: [[p0, p1, p2]] };

  const edgePoint = (i, j) => {
    const t = d[i] / (d[i] - d[j]);
    return pts[i].clone().lerp(pts[j], t);
  };

  if (pos.length === 1) {
    const [a] = pos, [b, c] = neg;
    const ab = edgePoint(a, b), ac = edgePoint(a, c);
    return { posTris: [[pts[a], ab, ac]], negTris: [[pts[b], pts[c], ab], [pts[c], ac, ab]], cut: [ab, ac] };
  }
  // pos.length === 2
  const [a, b] = pos, [c] = neg;
  const ac = edgePoint(a, c), bc = edgePoint(b, c);
  return { posTris: [[pts[a], pts[b], bc], [pts[a], bc, ac]], negTris: [[pts[c], ac, bc]], cut: [ac, bc] };
}

function buildLoops(segments) {
  // liga segmentos (par de pontos) em laços fechados por proximidade de extremidades
  const key = (v) => `${v.x.toFixed(3)},${v.y.toFixed(3)},${v.z.toFixed(3)}`;
  const adj = new Map();
  segments.forEach(([a, b]) => {
    const ka = key(a), kb = key(b);
    if (!adj.has(ka)) adj.set(ka, []);
    if (!adj.has(kb)) adj.set(kb, []);
    adj.get(ka).push({ p: b, k: kb });
    adj.get(kb).push({ p: a, k: ka });
  });
  const visited = new Set();
  const loops = [];
  for (const [k, v] of adj) {
    if (visited.has(k) || !v.length) continue;
    const loop = [];
    let curKey = k, curPoint = v[0] ? (adj.get(k)[0] ? null : null) : null;
    // percorre a cadeia
    let prevKey = null, currentKey = k;
    let currentPoint = null;
    // encontra ponto real correspondente à key inicial
    currentPoint = segments.flat().find((p) => key(p) === k);
    let steps = 0;
    while (currentKey && !visited.has(currentKey) && steps < 5000) {
      visited.add(currentKey);
      loop.push(currentPoint);
      const neighbors = adj.get(currentKey) || [];
      const next = neighbors.find((n) => n.k !== prevKey && !visited.has(n.k)) || neighbors.find((n) => !visited.has(n.k));
      if (!next) break;
      prevKey = currentKey; currentKey = next.k; currentPoint = next.p;
      steps++;
    }
    if (loop.length >= 3) loops.push(loop);
  }
  return loops;
}

function capLoop(loop, plane, flipForPos) {
  const normal = plane.normal;
  const u = new THREE.Vector3(); const arbitrary = Math.abs(normal.x) < 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  u.crossVectors(normal, arbitrary).normalize();
  const v = new THREE.Vector3().crossVectors(normal, u);
  const origin = loop[0];
  const pts2d = loop.map((p) => new THREE.Vector2(p.clone().sub(origin).dot(u), p.clone().sub(origin).dot(v)));
  let tris2d;
  try { tris2d = THREE.ShapeUtils.triangulateShape(pts2d, []); } catch { return []; }
  const out = [];
  tris2d.forEach(([i0, i1, i2]) => {
    const tri = flipForPos ? [loop[i0], loop[i2], loop[i1]] : [loop[i0], loop[i1], loop[i2]];
    out.push(tri);
  });
  return out;
}

function trisToGeometry(tris) {
  const pos = new Float32Array(tris.length * 9);
  tris.forEach((t, i) => { t.forEach((p, j) => { pos[i * 9 + j * 3] = p.x; pos[i * 9 + j * 3 + 1] = p.y; pos[i * 9 + j * 3 + 2] = p.z; }); });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return geo;
}

/** Corta uma geometria por um plano, retornando { pos, neg } geometrias fechadas (com tampa no corte). */
export function cutGeometryByPlane(geometry, plane) {
  const geo = toNonIndexed(geometry);
  const posArr = geo.attributes.position;
  const posTris = [], negTris = [];
  const cutSegments = [];

  for (let i = 0; i < posArr.count; i += 3) {
    const p0 = new THREE.Vector3().fromBufferAttribute(posArr, i);
    const p1 = new THREE.Vector3().fromBufferAttribute(posArr, i + 1);
    const p2 = new THREE.Vector3().fromBufferAttribute(posArr, i + 2);
    const r = triangleIntersectPlane(p0, p1, p2, plane);
    if (r.side === 'pos') posTris.push(r.tris[0]);
    else if (r.side === 'neg') negTris.push(r.tris[0]);
    else {
      posTris.push(...r.posTris);
      negTris.push(...r.negTris);
      cutSegments.push(r.cut);
    }
  }

  const loops = buildLoops(cutSegments);
  loops.forEach((loop) => {
    posTris.push(...capLoop(loop, plane, false));
    negTris.push(...capLoop(loop, plane, true));
  });

  return { pos: trisToGeometry(posTris), neg: trisToGeometry(negTris) };
}
