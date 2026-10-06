// Utilitários de cor compartilhados por Mix Filamento e Mix de Cores.
export function hexToRgb(hex) {
  const h = (hex || '#000000').replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const v = parseInt(n, 16) || 0;
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}
export function rgbToHex({ r, g, b }) {
  const c = (x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}
export function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  const d = max - min;
  if (d) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}
/** Mistura N cores por média ponderada em RGB (estimativa visual, como no app original). */
export function mixWeighted(items) {
  const total = items.reduce((s, i) => s + i.weight, 0) || 1;
  let r = 0, g = 0, b = 0;
  items.forEach((i) => { const c = hexToRgb(i.hex); const w = i.weight / total; r += c.r * w; g += c.g * w; b += c.b * w; });
  return rgbToHex({ r, g, b });
}
export function colorDistance(hexA, hexB) {
  const a = hexToRgb(hexA), b = hexToRgb(hexB);
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function combos(arr, k) {
  const out = [];
  const pick = (start, chosen) => {
    if (chosen.length === k) { out.push([...chosen]); return; }
    for (let i = start; i < arr.length; i++) { chosen.push(arr[i]); pick(i + 1, chosen); chosen.pop(); }
  };
  pick(0, []);
  return out;
}

/** Busca a melhor combinação (2 ou 3 itens) + proporções para chegar perto de um alvo. */
export function findBestRecipe(target, palette, { sizes = [2, 3], stepPct = 5 } = {}) {
  let best = null;
  const steps = [];
  for (let p = 0; p <= 100; p += stepPct) steps.push(p);

  sizes.forEach((k) => {
    combos(palette, k).forEach((combo) => {
      if (k === 2) {
        for (const p of steps) {
          const weights = [p, 100 - p];
          const hex = mixWeighted(combo.map((c, i) => ({ hex: c.hex, weight: weights[i] })));
          const dist = colorDistance(target, hex);
          if (!best || dist < best.dist) best = { combo, weights, hex, dist };
        }
      } else {
        for (const p1 of steps) for (const p2 of steps) {
          if (p1 + p2 > 100) continue;
          const p3 = 100 - p1 - p2;
          const weights = [p1, p2, p3];
          const hex = mixWeighted(combo.map((c, i) => ({ hex: c.hex, weight: weights[i] })));
          const dist = colorDistance(target, hex);
          if (!best || dist < best.dist) best = { combo, weights, hex, dist };
        }
      }
    });
  });
  return best;
}
