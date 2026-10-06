import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/** Importa STL/OBJ/GLB e retorna uma lista de partes {geometry, color, name}. */
export async function importMeshFile(file) {
  const buf = await file.arrayBuffer();
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'stl') {
    const geo = new STLLoader().parse(buf);
    geo.computeVertexNormals();
    return [{ geometry: geo, color: '#c9ced6', name: file.name.replace(/\.stl$/i, '') }];
  }
  if (ext === 'obj') {
    const FALLBACK = ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#f472b6', '#22d3ee', '#fb923c'];
    const text = new TextDecoder().decode(buf);
    const obj = new OBJLoader().parse(text);
    const parts = [];
    obj.traverse((child) => {
      if (child.isMesh) {
        const geo = child.geometry.clone();
        geo.applyMatrix4(child.matrix);
        if (!geo.attributes.normal) geo.computeVertexNormals();
        const mat = Array.isArray(child.material) ? child.material[0] : child.material;
        // OBJLoader só aplica cor real quando um MTL foi carregado junto; sem MTL, usamos uma cor
        // distinta por grupo (mat.name/usemtl) para diferenciar visualmente cada parte.
        const hasRealColor = mat?.color && !(mat.color.r === 1 && mat.color.g === 1 && mat.color.b === 1);
        const color = hasRealColor ? `#${mat.color.getHexString()}` : FALLBACK[parts.length % FALLBACK.length];
        parts.push({ geometry: geo, color, name: child.name || mat?.name || `grupo-${parts.length + 1}` });
      }
    });
    return parts.length ? parts : [{ geometry: new THREE.BufferGeometry(), color: '#c9ced6', name: 'vazio' }];
  }
  if (ext === 'glb' || ext === 'gltf') {
    const gltf = await new Promise((resolve, reject) => new GLTFLoader().parse(buf, '', resolve, reject));
    const parts = [];
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        const geo = child.geometry.clone();
        geo.applyMatrix4(child.matrixWorld);
        const mat = Array.isArray(child.material) ? child.material[0] : child.material;
        const color = mat?.color ? `#${mat.color.getHexString()}` : '#c9ced6';
        parts.push({ geometry: geo, color, name: child.name || 'parte' });
      }
    });
    return parts;
  }
  throw new Error('Formato não suportado. Use STL, OBJ ou GLB.');
}

export function centerAndScaleParts(parts, targetSize = 100) {
  const box = new THREE.Box3();
  parts.forEach((p) => { p.geometry.computeBoundingBox(); box.union(p.geometry.boundingBox); });
  const size = new THREE.Vector3(); box.getSize(size);
  const center = new THREE.Vector3(); box.getCenter(center);
  const maxDim = Math.max(size.x, size.y, size.z) || 1;
  const scale = maxDim > targetSize ? 1 : 1; // mantém unidades reais (mm)
  parts.forEach((p) => { p.geometry.translate(-center.x, -box.min.y, -center.z); });
  return parts;
}
