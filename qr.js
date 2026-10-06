// Gerador de QR Code (byte mode, ECC M, versões 1-12). Sem dependências.
const QR = (() => {
  const ECC = [-1,10,16,26,18,24,16,18,22,22,26,30,22];
  const BLK = [-1,1,1,2,2,4,4,4,5,5,5,5,8];
  const rawModules = v => {
    let r = (16 * v + 128) * v + 64;
    if (v >= 2) { const n = Math.floor(v / 7) + 2; r -= (25 * n - 10) * n - 55; if (v >= 7) r -= 36; }
    return r;
  };
  const gfMul = (x, y) => { let z = 0; for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; } return z; };
  const rsDiv = n => { const r = new Array(n).fill(0); r[n - 1] = 1; let root = 1;
    for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) { r[j] = gfMul(r[j], root); if (j + 1 < n) r[j] ^= r[j + 1]; } root = gfMul(root, 2); } return r; };
  const rsRem = (data, div) => { const r = div.map(() => 0);
    for (const b of data) { const f = b ^ r.shift(); r.push(0); div.forEach((c, i) => r[i] ^= gfMul(c, f)); } return r; };

  function encode(text) {
    const bytes = Array.from(new TextEncoder().encode(text));
    let ver = 1, cap;
    for (;; ver++) {
      if (ver > 12) throw new Error("Texto muito longo");
      cap = (Math.floor(rawModules(ver) / 8) - ECC[ver] * BLK[ver]) * 8;
      if (4 + (ver < 10 ? 8 : 16) + 8 * bytes.length <= cap) break;
    }
    const bits = [];
    const put = (v, n) => { for (let i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1); };
    put(4, 4); put(bytes.length, ver < 10 ? 8 : 16); bytes.forEach(b => put(b, 8));
    put(0, Math.min(4, cap - bits.length)); put(0, (8 - bits.length % 8) % 8);
    for (let p = 0xEC; bits.length < cap; p ^= 0xEC ^ 0x11) put(p, 8);
    const data = []; for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(""), 2));

    const nb = BLK[ver], eb = ECC[ver], raw = Math.floor(rawModules(ver) / 8);
    const shortLen = Math.floor(raw / nb), nShort = nb - raw % nb, div = rsDiv(eb);
    const blocks = []; let k = 0;
    for (let i = 0; i < nb; i++) {
      const len = shortLen - eb + (i < nShort ? 0 : 1);
      const d = data.slice(k, k + len); k += len;
      const e = rsRem(d, div);
      if (i < nShort) d.push(0);
      blocks.push({ d, e });
    }
    const all = [];
    for (let i = 0; i <= shortLen - eb; i++) blocks.forEach((b, j) => { if (i !== shortLen - eb || j >= nShort) all.push(b.d[i]); });
    for (let i = 0; i < eb; i++) blocks.forEach(b => all.push(b.e[i]));

    const size = ver * 4 + 17;
    const m = Array.from({ length: size }, () => new Array(size).fill(false));
    const fn = Array.from({ length: size }, () => new Array(size).fill(false));
    const set = (x, y, v) => { m[y][x] = v; fn[y][x] = true; };
    for (let i = 0; i < size; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
    const finder = (cx, cy) => { for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
      const x = cx + dx, y = cy + dy; if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, Math.max(Math.abs(dx), Math.abs(dy)) !== 2 && Math.max(Math.abs(dx), Math.abs(dy)) !== 4); } };
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    if (ver > 1) {
      const n = Math.floor(ver / 7) + 2, step = Math.ceil((ver * 4 + 4) / (n * 2 - 2)) * 2, pos = [6];
      for (let p = size - 7; pos.length < n; p -= step) pos.splice(1, 0, p);
      pos.forEach((cx, i) => pos.forEach((cy, j) => {
        if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) return;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }));
    }
    const format = mask => {
      const d = mask; let r = d; for (let i = 0; i < 10; i++) r = (r << 1) ^ ((r >>> 9) * 0x537);
      const bits = ((d << 10) | r) ^ 0x5412, b = i => ((bits >>> i) & 1) !== 0;
      for (let i = 0; i <= 5; i++) set(8, i, b(i));
      set(8, 7, b(6)); set(8, 8, b(7)); set(7, 8, b(8));
      for (let i = 9; i < 15; i++) set(14 - i, 8, b(i));
      for (let i = 0; i < 8; i++) set(size - 1 - i, 8, b(i));
      for (let i = 8; i < 15; i++) set(8, size - 15 + i, b(i));
      set(8, size - 8, true);
    };
    format(0);
    if (ver >= 7) {
      let r = ver; for (let i = 0; i < 12; i++) r = (r << 1) ^ ((r >>> 11) * 0x1F25);
      const bits = (ver << 12) | r;
      for (let i = 0; i < 18; i++) { const v = ((bits >>> i) & 1) !== 0, a = size - 11 + i % 3, b = Math.floor(i / 3); set(a, b, v); set(b, a, v); }
    }
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) for (let j = 0; j < 2; j++) {
        const x = right - j, y = ((right + 1) & 2) === 0 ? size - 1 - vert : vert;
        if (!fn[y][x] && i < all.length * 8) { m[y][x] = ((all[i >>> 3] >>> (7 - (i & 7))) & 1) !== 0; i++; }
      }
    }
    const masks = [(x, y) => (x + y) % 2 === 0, (x, y) => y % 2 === 0, (x, y) => x % 3 === 0, (x, y) => (x + y) % 3 === 0,
      (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x, y) => x * y % 2 + x * y % 3 === 0,
      (x, y) => (x * y % 2 + x * y % 3) % 2 === 0, (x, y) => ((x + y) % 2 + x * y % 3) % 2 === 0];
    const applyMask = f => { for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (!fn[y][x] && f(x, y)) m[y][x] = !m[y][x]; };
    const penalty = () => {
      let p = 0; const lines = [];
      for (let y = 0; y < size; y++) lines.push(m[y].map(v => +v).join(""));
      for (let x = 0; x < size; x++) lines.push(m.map(r => +r[x]).join(""));
      lines.forEach(l => { (l.match(/0{5,}|1{5,}/g) || []).forEach(s => p += s.length - 2); p += 40 * (l.match(/(?=10111010000|00001011101)/g) || []).length; });
      for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) if (m[y][x] === m[y][x + 1] && m[y][x] === m[y + 1][x] && m[y][x] === m[y + 1][x + 1]) p += 3;
      const dark = m.flat().filter(Boolean).length;
      return p + Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10;
    };
    let best = 0, bestP = Infinity;
    for (let mk = 0; mk < 8; mk++) { applyMask(masks[mk]); format(mk); const p = penalty(); if (p < bestP) { bestP = p; best = mk; } applyMask(masks[mk]); }
    applyMask(masks[best]); format(best);
    return m;
  }

  function svg(text, px = 4) {
    const m = encode(text), n = m.length + 8; let d = "";
    m.forEach((r, y) => r.forEach((v, x) => { if (v) d += `M${x + 4},${y + 4}h1v1h-1z`; }));
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n} ${n}" shape-rendering="crispEdges"><rect width="${n}" height="${n}" fill="#fff"/><path d="${d}"/></svg>`;
  }
  return { encode, svg };
})();
