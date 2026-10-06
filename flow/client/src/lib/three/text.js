import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

const cache = {};
const loader = new FontLoader();

const FONTS = {
  bold: '/fonts/helvetiker_bold.typeface.json',
  regular: '/fonts/helvetiker_regular.typeface.json',
  display: '/fonts/optimer_bold.typeface.json',
};

export function loadFont(key = 'bold') {
  if (cache[key]) return cache[key];
  cache[key] = new Promise((resolve, reject) => loader.load(FONTS[key] || FONTS.bold, resolve, undefined, reject));
  return cache[key];
}

export async function textGeometry(text, { font = 'bold', size = 10, height = 4, curveSegments = 6, bevel = false } = {}) {
  const f = await loadFont(font);
  const geo = new TextGeometry(text || ' ', {
    font: f, size, height, curveSegments,
    bevelEnabled: bevel, bevelThickness: 0.4, bevelSize: 0.3, bevelSegments: 2,
  });
  geo.center();
  geo.computeBoundingBox();
  return geo;
}

/** Retorna {width, height} aproximados de um texto sem gerar a malha (para layout). */
export async function measureText(text, opts) {
  const geo = await textGeometry(text, opts);
  const bb = geo.boundingBox;
  return { width: bb.max.x - bb.min.x, height: bb.max.y - bb.min.y, geo };
}
