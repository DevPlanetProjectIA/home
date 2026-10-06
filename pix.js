// Gera o "PIX copia e cola" (BR Code estático).
function pixPayload({ key, name, city, amount, txid = "***" }) {
  const f = (id, v) => id + String(v.length).padStart(2, "0") + v;
  const clean = (s, n) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9 ]/g, "").toUpperCase().slice(0, n);
  let p = f("00", "01") + f("01", "11") + f("26", f("00", "br.gov.bcb.pix") + f("01", key)) + f("52", "0000") + f("53", "986");
  if (amount > 0) p += f("54", amount.toFixed(2));
  p += f("58", "BR") + f("59", clean(name, 25)) + f("60", clean(city, 15)) + f("62", f("05", txid)) + "6304";
  let crc = 0xFFFF;
  for (const c of new TextEncoder().encode(p)) { crc ^= c << 8; for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xFFFF : (crc << 1) & 0xFFFF; }
  return p + crc.toString(16).toUpperCase().padStart(4, "0");
}
