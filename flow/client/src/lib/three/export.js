import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import JSZip from 'jszip';

const exporter = new STLExporter();

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Exporta um único STL binário a partir de uma lista de partes (mesclando tudo). */
export function downloadSingleSTL(parts, filename = 'modelo.stl') {
  const group = new THREE.Group();
  (parts || []).forEach((p) => {
    if (!p?.geometry) return;
    const mesh = new THREE.Mesh(p.geometry);
    if (p.position) mesh.position.set(...p.position);
    if (p.rotation) mesh.rotation.set(...p.rotation);
    group.add(mesh);
  });
  const result = exporter.parse(group, { binary: true });
  download(new Blob([result], { type: 'application/octet-stream' }), filename);
}

/** Exporta um ZIP com um STL separado por parte/cor. */
export async function downloadMultipartZip(parts, baseName = 'modelo') {
  const zip = new JSZip();
  (parts || []).forEach((p, i) => {
    if (!p?.geometry) return;
    const mesh = new THREE.Mesh(p.geometry);
    if (p.position) mesh.position.set(...p.position);
    if (p.rotation) mesh.rotation.set(...p.rotation);
    const result = exporter.parse(mesh, { binary: true });
    const safeName = (p.name || `parte-${i + 1}`).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    zip.file(`${safeName || 'parte-' + (i + 1)}.stl`, result);
  });
  const blob = await zip.generateAsync({ type: 'blob' });
  download(blob, `${baseName}.zip`);
}

export function downloadBlob(blob, filename) { download(blob, filename); }
