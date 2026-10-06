import { roundShape, ellipseShape, triangleShape, heartShape, starShape, roundedRectShape, ringFlatShape, mouthShape } from './shapes.js';

// Cada feature: { shape: fn(sz)=>THREE.Shape, x, y, role, rot? }
// role: 'base' | 'detail' (olhos/traços escuros) | 'accent' (cor extra)

const face = (extras) => (sz = 30) => ({
  base: { shape: roundShape(sz), x: 0, y: 0, role: 'base' },
  extras: extras(sz),
});

const EMOTICONS = {
  feliz: face((sz) => [
    { shape: roundShape(sz * 0.1), x: -sz * 0.32, y: sz * 0.15, role: 'detail' },
    { shape: roundShape(sz * 0.1), x: sz * 0.32, y: sz * 0.15, role: 'detail' },
    { shape: mouthShape(sz * 0.55, sz * 0.22, sz * 0.12), x: 0, y: -sz * 0.15, role: 'detail' },
  ]),
  piscando: face((sz) => [
    { shape: roundedRectShape(sz * 0.22, sz * 0.06, sz * 0.03), x: -sz * 0.32, y: sz * 0.15, role: 'detail' },
    { shape: roundShape(sz * 0.1), x: sz * 0.32, y: sz * 0.15, role: 'detail' },
    { shape: mouthShape(sz * 0.5, sz * 0.24, sz * 0.12), x: 0, y: -sz * 0.15, role: 'detail' },
  ]),
  apaixonado: face((sz) => [
    { shape: heartShape(sz * 0.16), x: -sz * 0.32, y: sz * 0.06, role: 'accent' },
    { shape: heartShape(sz * 0.16), x: sz * 0.32, y: sz * 0.06, role: 'accent' },
    { shape: mouthShape(sz * 0.5, sz * 0.22, sz * 0.12), x: 0, y: -sz * 0.15, role: 'detail' },
  ]),
  triste: face((sz) => [
    { shape: roundShape(sz * 0.09), x: -sz * 0.32, y: sz * 0.15, role: 'detail' },
    { shape: roundShape(sz * 0.09), x: sz * 0.32, y: sz * 0.15, role: 'detail' },
    { shape: mouthShape(sz * 0.45, -sz * 0.16, sz * 0.1), x: 0, y: -sz * 0.28, role: 'detail' },
  ]),
  bravo: face((sz) => [
    { shape: roundedRectShape(sz * 0.24, sz * 0.07, sz * 0.02), x: -sz * 0.32, y: sz * 0.24, role: 'detail', rot: -0.35 },
    { shape: roundedRectShape(sz * 0.24, sz * 0.07, sz * 0.02), x: sz * 0.32, y: sz * 0.24, role: 'detail', rot: 0.35 },
    { shape: roundShape(sz * 0.09), x: -sz * 0.32, y: sz * 0.1, role: 'detail' },
    { shape: roundShape(sz * 0.09), x: sz * 0.32, y: sz * 0.1, role: 'detail' },
    { shape: mouthShape(sz * 0.4, -sz * 0.14, sz * 0.1), x: 0, y: -sz * 0.22, role: 'detail' },
  ]),
  lingua: face((sz) => [
    { shape: roundShape(sz * 0.1), x: -sz * 0.32, y: sz * 0.15, role: 'detail' },
    { shape: roundShape(sz * 0.1), x: sz * 0.32, y: sz * 0.15, role: 'detail' },
    { shape: roundShape(sz * 0.2), x: 0, y: -sz * 0.15, role: 'detail' },
    { shape: ellipseShape(sz * 0.12, sz * 0.18), x: 0, y: -sz * 0.42, role: 'accent' },
  ]),
  cool: face((sz) => [
    { shape: roundedRectShape(sz * 0.62, sz * 0.22, sz * 0.08), x: 0, y: sz * 0.15, role: 'detail' },
    { shape: mouthShape(sz * 0.4, sz * 0.14, sz * 0.1), x: 0, y: -sz * 0.16, role: 'detail' },
  ]),
  beijo: face((sz) => [
    { shape: roundShape(sz * 0.09), x: -sz * 0.32, y: sz * 0.15, role: 'detail' },
    { shape: roundShape(sz * 0.09), x: sz * 0.32, y: sz * 0.15, role: 'detail' },
    { shape: ellipseShape(sz * 0.12, sz * 0.09), x: 0, y: -sz * 0.2, role: 'accent' },
  ]),
  morto: face((sz) => [
    { shape: roundedRectShape(sz * 0.2, sz * 0.06, sz * 0.02), x: -sz * 0.32, y: sz * 0.15, role: 'detail', rot: 0.5 },
    { shape: roundedRectShape(sz * 0.2, sz * 0.06, sz * 0.02), x: -sz * 0.32, y: sz * 0.15, role: 'detail', rot: -0.5 },
    { shape: roundedRectShape(sz * 0.2, sz * 0.06, sz * 0.02), x: sz * 0.32, y: sz * 0.15, role: 'detail', rot: 0.5 },
    { shape: roundedRectShape(sz * 0.2, sz * 0.06, sz * 0.02), x: sz * 0.32, y: sz * 0.15, role: 'detail', rot: -0.5 },
    { shape: mouthShape(sz * 0.4, -sz * 0.1, sz * 0.1), x: 0, y: -sz * 0.2, role: 'detail' },
  ]),
};

const ANIMAIS = {
  gato: (sz = 30) => ({
    base: { shape: roundShape(sz * 0.85), x: 0, y: -sz * 0.08, role: 'base' },
    extras: [
      { shape: triangleShape(sz * 0.38, sz * 0.42), x: -sz * 0.55, y: sz * 0.55, role: 'base' },
      { shape: triangleShape(sz * 0.38, sz * 0.42), x: sz * 0.55, y: sz * 0.55, role: 'base' },
      { shape: roundShape(sz * 0.07), x: -sz * 0.25, y: sz * 0.05, role: 'detail' },
      { shape: roundShape(sz * 0.07), x: sz * 0.25, y: sz * 0.05, role: 'detail' },
      { shape: triangleShape(sz * 0.12, sz * 0.1), x: 0, y: -sz * 0.15, role: 'accent' },
    ],
  }),
  cachorro: (sz = 30) => ({
    base: { shape: roundShape(sz * 0.85), x: 0, y: -sz * 0.05, role: 'base' },
    extras: [
      { shape: ellipseShape(sz * 0.22, sz * 0.38), x: -sz * 0.62, y: sz * 0.28, role: 'base', rot: 0.3 },
      { shape: ellipseShape(sz * 0.22, sz * 0.38), x: sz * 0.62, y: sz * 0.28, role: 'base', rot: -0.3 },
      { shape: roundShape(sz * 0.07), x: -sz * 0.24, y: sz * 0.08, role: 'detail' },
      { shape: roundShape(sz * 0.07), x: sz * 0.24, y: sz * 0.08, role: 'detail' },
      { shape: roundShape(sz * 0.12), x: 0, y: -sz * 0.2, role: 'detail' },
    ],
  }),
  coelho: (sz = 30) => ({
    base: { shape: roundShape(sz * 0.78), x: 0, y: -sz * 0.15, role: 'base' },
    extras: [
      { shape: ellipseShape(sz * 0.15, sz * 0.5), x: -sz * 0.25, y: sz * 0.75, role: 'base' },
      { shape: ellipseShape(sz * 0.15, sz * 0.5), x: sz * 0.25, y: sz * 0.75, role: 'base' },
      { shape: roundShape(sz * 0.07), x: -sz * 0.22, y: 0, role: 'detail' },
      { shape: roundShape(sz * 0.07), x: sz * 0.22, y: 0, role: 'detail' },
      { shape: triangleShape(sz * 0.12, sz * 0.1), x: 0, y: -sz * 0.22, role: 'accent' },
    ],
  }),
  urso: (sz = 30) => ({
    base: { shape: roundShape(sz * 0.85), x: 0, y: 0, role: 'base' },
    extras: [
      { shape: roundShape(sz * 0.22), x: -sz * 0.58, y: sz * 0.55, role: 'base' },
      { shape: roundShape(sz * 0.22), x: sz * 0.58, y: sz * 0.55, role: 'base' },
      { shape: roundShape(sz * 0.07), x: -sz * 0.24, y: sz * 0.1, role: 'detail' },
      { shape: roundShape(sz * 0.07), x: sz * 0.24, y: sz * 0.1, role: 'detail' },
      { shape: roundShape(sz * 0.2), x: 0, y: -sz * 0.15, role: 'accent' },
      { shape: roundShape(sz * 0.06), x: 0, y: -sz * 0.2, role: 'detail' },
    ],
  }),
};

const COMIDA = {
  pizza: (sz = 30) => ({
    base: { shape: triangleShape(sz * 1.5, sz * 1.6), x: 0, y: 0, role: 'base' },
    extras: [
      { shape: roundShape(sz * 0.09), x: -sz * 0.12, y: sz * 0.1, role: 'accent' },
      { shape: roundShape(sz * 0.09), x: sz * 0.18, y: -sz * 0.15, role: 'accent' },
      { shape: roundShape(sz * 0.09), x: 0, y: -sz * 0.45, role: 'accent' },
    ],
  }),
  hamburguer: (sz = 30) => ({
    base: { shape: roundedRectShape(sz * 1.5, sz * 1.3, sz * 0.5), x: 0, y: 0, role: 'base' },
    extras: [
      { shape: roundedRectShape(sz * 1.35, sz * 0.22, sz * 0.06), x: 0, y: sz * 0.15, role: 'detail' },
      { shape: roundedRectShape(sz * 1.35, sz * 0.22, sz * 0.06), x: 0, y: -sz * 0.15, role: 'accent' },
    ],
  }),
  sorvete: (sz = 30) => ({
    base: { shape: roundShape(sz * 0.6), x: 0, y: sz * 0.45, role: 'base' },
    extras: [{ shape: triangleShape(sz * 0.65, sz * 0.9), x: 0, y: -sz * 0.35, role: 'accent' }],
  }),
  donut: (sz = 30) => ({
    base: { shape: ringFlatShape(sz * 0.7, sz * 0.32), x: 0, y: 0, role: 'base' },
    extras: [
      { shape: roundShape(sz * 0.05), x: -sz * 0.25, y: sz * 0.45, role: 'detail' },
      { shape: roundShape(sz * 0.05), x: sz * 0.1, y: sz * 0.5, role: 'detail' },
      { shape: roundShape(sz * 0.05), x: sz * 0.35, y: sz * 0.3, role: 'detail' },
    ],
  }),
};

const FORMAS = {
  circulo: (sz = 30) => ({ base: { shape: roundShape(sz * 0.8), x: 0, y: 0, role: 'base' }, extras: [] }),
  quadrado: (sz = 30) => ({ base: { shape: roundedRectShape(sz * 1.4, sz * 1.4, sz * 0.22), x: 0, y: 0, role: 'base' }, extras: [] }),
  coracao: (sz = 30) => ({ base: { shape: heartShape(sz * 0.7), x: 0, y: 0, role: 'base' }, extras: [] }),
  estrela: (sz = 30) => ({ base: { shape: starShape(sz * 0.85, sz * 0.36), x: 0, y: 0, role: 'base' }, extras: [] }),
};

export const CHAVEIRO_CATEGORIES = { Formas: FORMAS, Emoticons: EMOTICONS, Animais: ANIMAIS, Comida: COMIDA };
