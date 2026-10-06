import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MousePointer2, Paintbrush, PaintBucket, Move3d, Upload, Plus, X, Download } from 'lucide-react';
import { importMeshFile } from '../../lib/three/importMesh.js';
import { ensureVertexColors, buildAdjacency, paintBrush, bucketFill } from '../../lib/three/paintMesh.js';
import { downloadColoredGLB, downloadColoredOBJ } from '../../lib/three/exportColored.js';
import { useToast } from '../../lib/ctx.jsx';

const TOOLS = [
  ['pincel', 'Pincel', Paintbrush],
  ['balde', 'Balde de tinta', PaintBucket],
  ['orientacao', 'Orientação', Move3d],
];

function PaintCanvas({ geometry, tool, color, brushSize, adjacency, onPaint }) {
  const mount = useRef(null);
  const ref = useRef({});

  useEffect(() => {
    const el = mount.current;
    const w = el.clientWidth, h = 560;
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#0b1220');
    const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 5000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(w, h);
    el.appendChild(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x223344, 1.2));
    const dir = new THREE.DirectionalLight(0xffffff, 1.3); dir.position.set(150, 220, 120); scene.add(dir);
    scene.add(new THREE.GridHelper(300, 30, 0x2a3a52, 0x1a2536));

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, metalness: 0.05, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, mat);
    scene.add(mesh);
    geometry.computeBoundingSphere();
    const r = geometry.boundingSphere?.radius || 50;
    camera.position.set(r * 1.8, r * 1.4, r * 2);
    controls.target.set(0, r * 0.3, 0);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let painting = false;

    const pick = (e) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      return raycaster.intersectObject(mesh)[0];
    };

    const onDown = (e) => {
      if (ref.current.tool === 'orientacao') return;
      const hit = pick(e);
      if (!hit) return;
      painting = true;
      ref.current.onPaint(hit, ref.current.tool);
    };
    const onMove = (e) => {
      if (!painting || ref.current.tool !== 'pincel') return;
      const hit = pick(e);
      if (hit) ref.current.onPaint(hit, 'pincel');
    };
    const onUp = () => { painting = false; };
    renderer.domElement.addEventListener('pointerdown', onDown);
    renderer.domElement.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);

    let raf;
    const loop = () => { controls.enabled = ref.current.tool === 'orientacao'; controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(loop); };
    loop();
    const onResize = () => { const w2 = el.clientWidth; camera.aspect = w2 / h; camera.updateProjectionMatrix(); renderer.setSize(w2, h); };
    const ro = new ResizeObserver(onResize); ro.observe(el);

    ref.current.tool = tool;
    ref.current.cleanup = () => {
      cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); renderer.dispose();
      renderer.domElement.removeEventListener('pointerdown', onDown);
      renderer.domElement.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      el.removeChild(renderer.domElement);
    };
    return () => ref.current.cleanup?.();
  }, [geometry]);

  useEffect(() => { ref.current.tool = tool; }, [tool]);
  useEffect(() => { ref.current.onPaint = onPaint; }, [onPaint]);

  return <div ref={mount} className="h-[560px] w-full" />;
}

export default function CordeiroPaint() {
  const toast = useToast();
  const [geometry, setGeometry] = useState(null);
  const [name, setName] = useState('');
  const [tool, setTool] = useState('pincel');
  const [palette, setPalette] = useState(['#1f2937', '#9aa4b2', '#ffffff']);
  const [active, setActive] = useState(1);
  const [brush, setBrush] = useState(6);
  const adjacencyRef = useRef(null);
  const [, force] = useState(0);

  const onFile = async (file) => {
    if (!file) return;
    try {
      const parts = await importMeshFile(file);
      const geo = ensureVertexColors(parts[0].geometry);
      geo.computeVertexNormals();
      setGeometry(geo);
      setName(file.name);
      adjacencyRef.current = null;
      toast('Peça importada! Escolha uma cor e pinte sobre o modelo.');
    } catch (e) { toast(e.message, 'err'); }
  };

  const onPaint = (hit, currentTool) => {
    if (!geometry) return;
    const color = new THREE.Color(palette[active]);
    if (currentTool === 'pincel') {
      paintBrush(geometry, hit.point, brush * brush, color);
      force((x) => x + 1);
    } else if (currentTool === 'balde') {
      if (!adjacencyRef.current) adjacencyRef.current = buildAdjacency(geometry);
      const triIndex = Math.floor(hit.faceIndex);
      bucketFill(geometry, adjacencyRef.current, triIndex, color, 0.9);
      force((x) => x + 1);
    }
  };

  const addColor = () => setPalette((p) => [...p, '#ef4444']);
  const setColor = (i, hex) => setPalette((p) => p.map((c, idx) => (idx === i ? hex : c)));
  const removeColor = (i) => { setPalette((p) => p.filter((_, idx) => idx !== i)); if (active >= palette.length - 1) setActive(0); };

  if (!geometry) {
    return (
      <div className="mx-auto max-w-2xl card">
        <h2 className="flex items-center gap-2 font-semibold"><Paintbrush size={18} className="text-primary" />Cordeiro Paint</h2>
        <p className="mb-4 text-sm text-muted-foreground">Pinte suas peças 3D diretamente no navegador — o arquivo não é enviado para nenhum servidor.</p>
        <label className="flex h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm text-muted-foreground hover:bg-secondary/40">
          <Upload size={24} /><span className="font-semibold text-foreground">Importe um STL, OBJ ou GLB</span><span>O arquivo fica no seu navegador.</span>
          <input type="file" accept=".stl,.obj,.glb,.gltf" className="hidden" onChange={(e) => onFile(e.target.files[0])} />
          <span className="btn-primary mt-2">Selecionar arquivo</span>
        </label>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <div className="space-y-4">
        <div className="card">
          <h2 className="flex items-center gap-2 font-semibold"><Paintbrush size={18} className="text-primary" />Cordeiro Paint</h2>
          <p className="truncate text-xs text-muted-foreground">{name}</p>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {TOOLS.map(([id, label, Icon]) => (
              <button key={id} onClick={() => setTool(id)} className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[11px] ${tool === id ? 'border-primary bg-primary/15 text-primary' : 'hover:bg-secondary'}`}>
                <Icon size={16} />{label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">{tool === 'orientacao' ? 'Arraste para girar a peça.' : tool === 'pincel' ? 'Clique e arraste sobre a peça para pintar.' : 'Clique numa região para preencher com a cor ativa.'}</p>
        </div>

        <div className="card">
          <p className="label">Paleta de cores</p>
          <div className="flex flex-wrap gap-2">
            {palette.map((c, i) => (
              <div key={i} className="relative">
                <button onClick={() => setActive(i)} className={`h-9 w-9 rounded-full border-2 ${active === i ? 'border-primary' : 'border-transparent'}`} style={{ background: c }} title="Selecionar cor" />
                <label className="absolute -bottom-1 -left-1 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full border bg-popover text-[8px]" title="Editar cor">
                  ✎<input type="color" value={c} onChange={(e) => setColor(i, e.target.value)} className="absolute h-0 w-0 opacity-0" />
                </label>
                {palette.length > 1 && <button onClick={() => removeColor(i)} className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5"><X size={9} /></button>}
              </div>
            ))}
            <button onClick={addColor} className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed hover:bg-secondary"><Plus size={14} /></button>
          </div>
          <div className="mt-4">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>TAMANHO DO PINCEL</span><span>{brush.toFixed(1)}mm</span></div>
            <input type="range" min={1} max={20} step={0.5} value={brush} onChange={(e) => setBrush(Number(e.target.value))} className="w-full accent-primary" />
          </div>
        </div>

        <div className="card space-y-2">
          <button className="btn-primary w-full" onClick={() => downloadColoredGLB(geometry, name.replace(/\.\w+$/, '') + '-colorido.glb')}><Download size={15} />Exportar GLB colorido (Recomendado)</button>
          <button className="btn-ghost w-full" onClick={() => downloadColoredOBJ(geometry, palette, name.replace(/\.\w+$/, '') + '-colorido')}><Download size={15} />Exportar OBJ colorido</button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card/40">
        <div className="border-b px-4 py-2 text-xs font-semibold text-muted-foreground">Pré-visualização — {tool === 'orientacao' ? 'arraste para girar' : 'clique/arraste sobre a peça para pintar'}</div>
        <PaintCanvas geometry={geometry} tool={tool} color={palette[active]} brushSize={brush} onPaint={onPaint} />
      </div>
    </div>
  );
}
