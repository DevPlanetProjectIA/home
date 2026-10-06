import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { roundedRectShape } from './shapes.js';

function extrudeFlat(shape, depth) {
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 24 });
}

/** Caixa oca com paredes arredondadas, fundo sólido e divisórias internas em grade. */
export function buildBoxGeometry({ w = 100, d = 100, h = 28, wall = 5, rOuter = 4, rInner = 2, cols = 1, rows = 1 } = {}) {
  const parts = [];

  // Fundo sólido
  const bottom = extrudeFlat(roundedRectShape(w, d, rOuter), wall);
  parts.push(bottom);

  // Parede (anel extrudado)
  const outer = roundedRectShape(w, d, rOuter);
  const inner = roundedRectShape(w - wall * 2, d - wall * 2, Math.max(0.5, rInner));
  const holePath = new THREE.Path(inner.getPoints(32));
  outer.holes.push(holePath);
  const wallGeo = extrudeFlat(outer, h - wall);
  wallGeo.translate(0, 0, wall);
  parts.push(wallGeo);

  // Divisórias internas
  const innerW = w - wall * 2, innerD = d - wall * 2;
  const divH = h - wall - 0.5;
  for (let c = 1; c < cols; c++) {
    const x = -innerW / 2 + (innerW / cols) * c;
    const g = extrudeFlat(roundedRectShape(wall * 0.8, innerD, 0), divH);
    g.rotateX(0); g.translate(x, 0, wall);
    parts.push(g);
  }
  for (let r = 1; r < rows; r++) {
    const y = -innerD / 2 + (innerD / rows) * r;
    const g = extrudeFlat(roundedRectShape(innerW, wall * 0.8, 0), divH);
    g.translate(0, y, wall);
    parts.push(g);
  }

  const merged = mergeGeometries(parts, false);
  merged.computeVertexNormals();
  return merged;
}

export function buildLidGeometry({ w = 100, d = 100, wall = 5, rOuter = 4, lidH = 8 } = {}) {
  const outer = roundedRectShape(w, d, rOuter);
  const lid = extrudeFlat(outer, wall * 0.6);
  const inner = roundedRectShape(w - wall * 2.6, d - wall * 2.6, Math.max(0.5, rOuter - 2));
  const skirt = extrudeFlat(inner, lidH);
  skirt.translate(0, 0, wall * 0.6);
  const merged = mergeGeometries([lid, skirt], false);
  merged.computeVertexNormals();
  return merged;
}
