import JSZip from 'jszip';
import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';

export const PRINTERS = [
  ['bambu_a1', 'Bambu Lab A1', 256, 256],
  ['bambu_a1mini', 'Bambu Lab A1 Mini', 180, 180],
  ['bambu_p1s', 'Bambu Lab P1S', 256, 256],
  ['bambu_x1c', 'Bambu Lab X1 Carbon', 256, 256],
  ['bambu_h2s', 'Bambu Lab H2S', 350, 320],
  ['bambu_h2d', 'Bambu Lab H2D', 350, 320],
  ['creality_k1', 'Creality K1', 220, 220],
  ['creality_k2', 'Creality K2 Plus', 350, 350],
  ['creality_ender3', 'Creality Ender 3', 220, 220],
  ['creality_ad5x', 'Creality AD5X', 220, 220],
];

function parseTransform(str) {
  const n = (str || '').trim().split(/\s+/).map(Number);
  if (n.length !== 12 || n.some(Number.isNaN)) return { m: [1, 0, 0, 0, 1, 0, 0, 0, 1], t: [0, 0, 0] };
  return { m: [n[0], n[1], n[2], n[3], n[4], n[5], n[6], n[7], n[8]], t: [n[9], n[10], n[11]] };
}
function serializeTransform(m, t) {
  return `${m[0]} ${m[1]} ${m[2]} ${m[3]} ${m[4]} ${m[5]} ${m[6]} ${m[7]} ${m[8]} ${t[0]} ${t[1]} ${t[2]}`;
}

function vertexBBox(meshEl) {
  const verts = meshEl.querySelectorAll('vertices > vertex');
  let min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  verts.forEach((v) => {
    const x = parseFloat(v.getAttribute('x')), y = parseFloat(v.getAttribute('y')), z = parseFloat(v.getAttribute('z'));
    min = [Math.min(min[0], x), Math.min(min[1], y), Math.min(min[2], z)];
    max = [Math.max(max[0], x), Math.max(max[1], y), Math.max(max[2], z)];
  });
  return { min, max };
}

/** Processa um .3mf: recentraliza/pousa os objetos na mesa da impressora de destino, mantendo a malha intacta (copiada byte a byte). */
export async function process3MF(file, { bedX = 256, bedY = 256, center = true, dropToPlate = true } = {}) {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const modelPath = Object.keys(zip.files).find((n) => /3dmodel\.model$/i.test(n)) || '3D/3dmodel.model';
  const xmlStr = await zip.file(modelPath).async('string');
  const doc = new DOMParser().parseFromString(xmlStr, 'application/xml');

  const objects = {};
  doc.querySelectorAll('object').forEach((o) => {
    const mesh = o.querySelector('mesh');
    if (mesh) objects[o.getAttribute('id')] = vertexBBox(mesh);
  });

  const items = doc.querySelectorAll('build > item');
  let warn = null;
  let overallMinX = Infinity, overallMinY = Infinity, overallMaxX = -Infinity, overallMaxY = -Infinity;

  items.forEach((item) => {
    const objId = item.getAttribute('objectid');
    const bbox = objects[objId];
    if (!bbox) return;
    const { m, t } = parseTransform(item.getAttribute('transform'));
    const cx = (bbox.min[0] + bbox.max[0]) / 2, cy = (bbox.min[1] + bbox.max[1]) / 2;
    const width = bbox.max[0] - bbox.min[0], depth = bbox.max[1] - bbox.min[1];
    if (width > bedX || depth > bedY) warn = `O modelo (${width.toFixed(0)}×${depth.toFixed(0)}mm) é maior que a mesa selecionada (${bedX}×${bedY}mm).`;

    let tx = t[0], ty = t[1], tz = t[2];
    if (center) { tx = bedX / 2 - cx; ty = bedY / 2 - cy; }
    if (dropToPlate) tz = -bbox.min[2];

    item.setAttribute('transform', serializeTransform(m, [tx, ty, tz]));
    overallMinX = Math.min(overallMinX, tx + bbox.min[0]); overallMaxX = Math.max(overallMaxX, tx + bbox.max[0]);
    overallMinY = Math.min(overallMinY, ty + bbox.min[1]); overallMaxY = Math.max(overallMaxY, ty + bbox.max[1]);
  });

  const newXml = new XMLSerializer().serializeToString(doc);
  zip.file(modelPath, newXml);
  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'model/3mf' });
  return { blob, warn, bbox: { minX: overallMinX, maxX: overallMaxX, minY: overallMinY, maxY: overallMaxY } };
}

/** Processa um .stl: centraliza/pousa e reexporta (STL não guarda perfil de impressora). */
export async function processSTL(file, { bedX = 256, bedY = 256, center = true, dropToPlate = true, scaleToFit = false } = {}) {
  const geo = new STLLoader().parse(await file.arrayBuffer());
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  const width = bb.max.x - bb.min.x, depth = bb.max.y - bb.min.y;
  let warn = null;
  let scale = 1;
  if (width > bedX || depth > bedY) {
    if (scaleToFit) scale = Math.min(bedX / width, bedY / depth) * 0.98;
    else warn = `O modelo (${width.toFixed(0)}×${depth.toFixed(0)}mm) é maior que a mesa selecionada (${bedX}×${bedY}mm).`;
  }
  const mesh = new THREE.Mesh(geo);
  if (scale !== 1) mesh.scale.setScalar(scale);
  mesh.updateMatrixWorld(true);
  const cx = (bb.min.x + bb.max.x) / 2 * scale, cy = (bb.min.y + bb.max.y) / 2 * scale;
  mesh.position.x = center ? bedX / 2 - cx : 0;
  mesh.position.y = center ? bedY / 2 - cy : 0;
  mesh.position.z = dropToPlate ? -bb.min.z * scale : 0;
  const stl = new STLExporter().parse(mesh, { binary: true });
  return { blob: new Blob([stl], { type: 'application/octet-stream' }), warn };
}

export async function processFile(file, opts) {
  if (/\.3mf$/i.test(file.name)) return { ...(await process3MF(file, opts)), ext: '3mf' };
  return { ...(await processSTL(file, opts)), ext: 'stl' };
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
