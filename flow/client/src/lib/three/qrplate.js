import * as THREE from 'three';
import QRCode from 'qrcode';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { roundedRectShape } from './shapes.js';

/** Gera uma placa 3D com QR Code em relevo/baixo-relevo a partir de um texto/link. */
export function buildQRPlate({ text = 'https://cordeiroflow.com', plateW = 70, plateH = 90, plateThick = 3, moduleH = 1.4, relevo = true, margin = 8 } = {}) {
  const qr = QRCode.create(text || ' ', { errorCorrectionLevel: 'M' });
  const size = qr.modules.size;
  const area = Math.min(plateW, plateH - margin) - margin * 1.2;
  const cell = area / size;

  const plateShape = roundedRectShape(plateW, plateH, 5);
  const plate = new THREE.ExtrudeGeometry(plateShape, { depth: plateThick, bevelEnabled: false, curveSegments: 24 });

  const boxes = [];
  const qrTopY = plateH / 2 - margin;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (!qr.modules.get(x, y)) continue;
      const bx = new THREE.BoxGeometry(cell * 0.96, cell * 0.96, moduleH);
      const px = -area / 2 + cell * x + cell / 2;
      const py = qrTopY - cell * y - cell / 2;
      const pz = relevo ? plateThick + moduleH / 2 - 0.05 : plateThick - moduleH / 2 + 0.05;
      bx.translate(px, py, pz);
      boxes.push(bx);
    }
  }
  const qrGeo = mergeGeometries(boxes, false);
  return { plate, qr: qrGeo, size, area, plateW, plateH, plateThick };
}
