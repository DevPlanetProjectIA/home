import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import JSZip from 'jszip';
import { downloadBlob } from './export.js';

export function downloadColoredGLB(geometry, filename = 'peca-colorida.glb') {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true });
  const mesh = new THREE.Mesh(geometry, mat);
  const exporter = new GLTFExporter();
  exporter.parse(mesh, (result) => downloadBlob(new Blob([result], { type: 'model/gltf-binary' }), filename),
    (err) => console.error(err), { binary: true });
}

function nearest(color, palette) {
  let best = 0, bd = Infinity;
  palette.forEach((p, i) => { const c = new THREE.Color(p); const d = c.r ? (c.r - color.r) ** 2 + (c.g - color.g) ** 2 + (c.b - color.b) ** 2 : 0; if (d < bd) { bd = d; best = i; } });
  return best;
}

export async function downloadColoredOBJ(geometry, palette, filename = 'peca-colorida') {
  const pos = geometry.attributes.position, col = geometry.attributes.color;
  const triCount = pos.count / 3;
  const groups = palette.map(() => []);
  const c = new THREE.Color();
  for (let t = 0; t < triCount; t++) {
    c.setRGB(col.getX(t * 3), col.getY(t * 3), col.getZ(t * 3));
    const idx = nearest(c, palette);
    groups[idx].push(t);
  }
  let obj = '# Cordeiro Paint — export colorido\nmtllib peca.mtl\n';
  let mtl = '';
  let vOffset = 1;
  palette.forEach((hex, gi) => {
    if (!groups[gi].length) return;
    const cc = new THREE.Color(hex);
    mtl += `newmtl cor_${gi}\nKd ${cc.r.toFixed(3)} ${cc.g.toFixed(3)} ${cc.b.toFixed(3)}\n`;
    obj += `usemtl cor_${gi}\n`;
    groups[gi].forEach((t) => {
      for (let j = 0; j < 3; j++) { const i = t * 3 + j; obj += `v ${pos.getX(i)} ${pos.getY(i)} ${pos.getZ(i)}\n`; }
      obj += `f ${vOffset} ${vOffset + 1} ${vOffset + 2}\n`;
      vOffset += 3;
    });
  });
  const zip = new JSZip();
  zip.file(`${filename}.obj`, obj);
  zip.file(`peca.mtl`, mtl);
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, `${filename}.zip`);
}
