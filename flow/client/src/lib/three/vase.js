import * as THREE from 'three';
import { splineAt } from './spline.js';

/**
 * Gera um jarro paramétrico oco (parede + fundo com espessura) com ondas radiais opcionais.
 * Réplica funcional do "Gerador de Jarros": altura, raio base, raio boca, barriga, pescoço, torção,
 * ondas/força (textura) e parede/fundo/qualidade (acabamento).
 */
export function buildVaseGeometry({
  height = 160, raioBase = 46, raioBoca = 35, barriga = 28, pescoco = 16,
  torcao = 0, ondas = 0, forca = 0, parede = 2, fundo = 3, qualidade = 64,
} = {}) {
  const radial = Math.max(16, Math.round(qualidade));
  const hSeg = 48;
  const outerPts = [[0, raioBase], [0.12, raioBase * 0.97], [0.42, barriga], [0.8, pescoco], [1, raioBoca]];
  const outerR = (yFrac) => Math.max(1, splineAt(outerPts, yFrac));
  const twistAt = (yFrac) => (torcao * Math.PI / 180) * yFrac;

  const positions = [];
  const indices = [];

  const ring = (yFrac, radiusFn, wave) => {
    const y = yFrac * height;
    const twist = twistAt(yFrac);
    const start = positions.length / 3;
    for (let i = 0; i <= radial; i++) {
      const theta = (i / radial) * Math.PI * 2 + twist;
      const r = radiusFn(yFrac) + (wave ? forca * Math.sin(ondas * theta) : 0);
      positions.push(r * Math.cos(theta), y, r * Math.sin(theta));
    }
    return start;
  };
  const connect = (a, b) => {
    for (let i = 0; i < radial; i++) {
      const a0 = a + i, a1 = a + i + 1, b0 = b + i, b1 = b + i + 1;
      indices.push(a0, b0, b1, a0, b1, a1);
    }
  };
  const cap = (yFrac, radiusFn, flip) => {
    const y = yFrac * height;
    const center = positions.length / 3;
    positions.push(0, y, 0);
    const start = positions.length / 3;
    const twist = twistAt(yFrac);
    for (let i = 0; i <= radial; i++) {
      const theta = (i / radial) * Math.PI * 2 + twist;
      const r = radiusFn(yFrac);
      positions.push(r * Math.cos(theta), y, r * Math.sin(theta));
    }
    for (let i = 0; i < radial; i++) {
      if (flip) indices.push(center, start + i + 1, start + i);
      else indices.push(center, start + i, start + i + 1);
    }
  };

  // Parede externa (com ondas), de baixo (0) até o topo (1)
  const outerRings = [];
  for (let j = 0; j <= hSeg; j++) outerRings.push(ring(j / hSeg, outerR, true));
  for (let j = 0; j < hSeg; j++) connect(outerRings[j], outerRings[j + 1]);

  // Fundo externo sólido
  cap(0, outerR, true);

  const innerR = (yFrac) => Math.max(0.6, outerR(yFrac) - parede);
  const yFundo = Math.min(0.92, fundo / height);

  // Lábio da boca (liga parede externa à parede interna no topo)
  const topOuter = outerRings[hSeg];
  const topInner = ring(1, innerR, false);
  connect(topOuter, topInner); // observação: sentido invertido é aceitável para pré-visualização

  // Parede interna, descendo até o fundo interno
  const innerRings = [topInner];
  const innerSteps = 24;
  for (let k = 1; k <= innerSteps; k++) {
    const yFrac = 1 - (1 - yFundo) * (k / innerSteps);
    innerRings.push(ring(yFrac, innerR, false));
  }
  for (let k = 0; k < innerRings.length - 1; k++) connect(innerRings[k + 1], innerRings[k]);

  // Fundo interno (fecha a cavidade)
  cap(yFundo, innerR, false);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

export const VASE_PRESETS = {
  classico: { height: 160, raioBase: 46, raioBoca: 35, barriga: 28, pescoco: 16, torcao: 0, ondas: 6, forca: 4 },
  moderno: { height: 180, raioBase: 38, raioBoca: 40, barriga: 55, pescoco: 30, torcao: 0, ondas: 0, forca: 0 },
  bojudinho: { height: 120, raioBase: 34, raioBoca: 24, barriga: 62, pescoco: 20, torcao: 0, ondas: 0, forca: 0 },
  torcido: { height: 170, raioBase: 40, raioBoca: 32, barriga: 46, pescoco: 24, torcao: 220, ondas: 8, forca: 3 },
};
