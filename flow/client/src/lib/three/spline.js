// Interpolação Catmull-Rom 1D simples: pts = [[x,y], ...] ordenados por x crescente em [0,1]
function cr(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}
export function splineAt(pts, u) {
  const n = pts.length;
  if (n === 1) return pts[0][1];
  let i = 0;
  while (i < n - 2 && u > pts[i + 1][0]) i++;
  const i0 = Math.max(0, i - 1), i1 = i, i2 = Math.min(n - 1, i + 1), i3 = Math.min(n - 1, i + 2);
  const x1 = pts[i1][0], x2 = pts[i2][0];
  const t = x2 > x1 ? (u - x1) / (x2 - x1) : 0;
  return cr(pts[i0][1], pts[i1][1], pts[i2][1], pts[i3][1], Math.max(0, Math.min(1, t)));
}
