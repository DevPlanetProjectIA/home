import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Visualizador 3D genérico reutilizado por todos os geradores de objetos.
 * parts: [{ geometry, color, metalness, roughness, wireframe }]
 */
export default function Viewer3D({ parts, height = 460, hint = 'Arraste para girar • Scroll para zoom', footer, bg = '#0b1220' }) {
  const mount = useRef(null);
  const state = useRef({});

  useEffect(() => {
    const el = mount.current;
    const w = el.clientWidth, h = height;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(bg);
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 5000);
    camera.position.set(120, 110, 160);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(w, h);
    el.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 1.1));
    const dir = new THREE.DirectionalLight(0xffffff, 1.4);
    dir.position.set(150, 220, 120);
    scene.add(dir);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.5);
    dir2.position.set(-150, 80, -120);
    scene.add(dir2);

    const grid = new THREE.GridHelper(300, 30, 0x2a3a52, 0x1a2536);
    scene.add(grid);

    const group = new THREE.Group();
    scene.add(group);

    let raf;
    const loop = () => { controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(loop); };
    loop();

    const onResize = () => {
      const w2 = el.clientWidth;
      camera.aspect = w2 / height; camera.updateProjectionMatrix();
      renderer.setSize(w2, height);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(el);

    state.current = { scene, camera, renderer, controls, group, raf, ro };
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    const { group } = state.current;
    if (!group) return;
    [...group.children].forEach((m) => { m.geometry?.dispose?.(); m.material?.dispose?.(); group.remove(m); });
    let minY = Infinity, maxY = -Infinity;
    (parts || []).forEach((p) => {
      if (!p?.geometry) return;
      const mat = new THREE.MeshStandardMaterial({
        color: p.color || '#ef4444', metalness: p.metalness ?? 0.05, roughness: p.roughness ?? 0.55,
        wireframe: !!p.wireframe, side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(p.geometry, mat);
      if (p.position) mesh.position.set(...p.position);
      if (p.rotation) mesh.rotation.set(...p.rotation);
      group.add(mesh);
      p.geometry.computeBoundingBox?.();
      const bb = p.geometry.boundingBox;
      if (bb) { minY = Math.min(minY, bb.min.y); maxY = Math.max(maxY, bb.max.y); }
    });
  }, [parts]);

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card/40">
      <div className="flex items-center justify-between border-b px-4 py-2 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">Pré-visualização 3D</span>
        <span>{hint}</span>
      </div>
      <div ref={mount} style={{ height }} />
      {footer && <div className="border-t px-4 py-2 text-xs text-muted-foreground">{footer}</div>}
    </div>
  );
}
