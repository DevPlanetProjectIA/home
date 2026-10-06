const $ = id => document.getElementById(id);
const num = v => parseFloat(String(v ?? "").replace(",", ".")) || 0;
const brl = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
document.querySelectorAll("[data-store]").forEach(e => e.textContent = CONFIG.storeName);
$("seller").value = CONFIG.storeName;
const p = new URLSearchParams(location.search);
const saved = JSON.parse(localStorage.getItem("quoteSeller") || "{}");
if (saved.seller) $("seller").value = saved.seller; if (saved.sellerPhone) $("sellerPhone").value = saved.sellerPhone;

// Reduz a imagem (máx. 600px, JPEG) para o PDF ficar leve.
function shrink(file, max = 600) {
  return new Promise((ok, no) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => { const s = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement("canvas");
      c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
      const x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url); ok(c.toDataURL("image/jpeg", 0.85)); };
    im.onerror = () => { URL.revokeObjectURL(url); no(); }; im.src = url;
  });
}
function addItem(it = {}) {
  const d = document.createElement("div"); d.className = "it";
  d.innerHTML = `<input data-k="name" placeholder="Item" value="${esc(it.name || "")}"><input data-k="qty" type="number" min="1" value="${it.qty || 1}">
  <input data-k="price" inputmode="decimal" placeholder="Preço unit." value="${esc(it.price || "")}"><input data-k="disc" inputmode="decimal" placeholder="Desc. %">
  <button class="lnk" type="button" aria-label="Remover">✕</button><input class="d" data-k="desc" placeholder="Descrição (opcional)">
  <div class="d imgrow"><img alt="" hidden><label class="btn alt sm">Imagem do produto<input type="file" accept="image/*" hidden></label><button class="lnk" type="button" hidden>Remover imagem</button></div>`;
  const img = d.querySelector(".imgrow img"), rm = d.querySelector(".imgrow .lnk"), file = d.querySelector("input[type=file]");
  const setImg = u => { d._img = u || ""; img.src = u || ""; img.hidden = rm.hidden = !u; };
  file.onchange = () => { const f = file.files[0]; if (f) shrink(f).then(setImg).catch(() => alert("Não foi possível ler a imagem.")); file.value = ""; };
  rm.onclick = () => setImg("");
  if (it.img) setImg(it.img);
  d.querySelector("button").onclick = () => { d.remove(); calc(); };
  $("items").append(d);
}
addItem(p.get("name") ? { name: p.get("name"), price: p.get("price") } : {});
$("addItem").onclick = () => addItem();

function data() {
  const items = [...$("items").children].map(r => { const g = k => r.querySelector(`[data-k=${k}]`).value; const qty = num(g("qty")), price = num(g("price")), disc = num(g("disc"));
    return { img: r._img || "", name: g("name").trim(), desc: g("desc").trim(), qty, price, disc, total: Math.max(0, qty * price * (1 - disc / 100)) }; }).filter(i => i.name);
  const sub = items.reduce((s, i) => s + i.total, 0), d = $("discType").value === "%" ? sub * num($("discount").value) / 100 : num($("discount").value);
  const ship = num($("shipping").value);
  return { items, sub, disc: d, ship, total: Math.max(0, sub - d + ship) };
}
function calc() {
  const t = data();
  $("tot").innerHTML = `<div><span class="muted">Subtotal</span><span>${brl(t.sub)}</span></div>` + (t.disc ? `<div><span class="muted">Desconto</span><span>- ${brl(t.disc)}</span></div>` : "") +
    (t.ship ? `<div><span class="muted">Frete</span><span>${brl(t.ship)}</span></div>` : "") + `<div class="t"><span>Total</span><span>${brl(t.total)}</span></div>`;
  return t;
}
document.addEventListener("input", calc); calc();

function valid(t) {
  const err = !$("seller").value.trim() ? "Informe o vendedor." : !$("client").value.trim() ? "Informe o nome do cliente." : !t.items.length ? "Adicione ao menos um item." : "";
  if (err) alert(err); return !err;
}
const today = new Date().toLocaleDateString("pt-BR");
$("pdf").onclick = () => {
  const t = calc(); if (!valid(t)) return;
  localStorage.setItem("quoteSeller", JSON.stringify({ seller: $("seller").value, sellerPhone: $("sellerPhone").value }));
  const n = $("number").value.trim();
  $("printDoc").innerHTML = `<div style="display:flex;justify-content:space-between"><div><h2 style="margin:0">${esc($("seller").value)}</h2>${esc($("sellerPhone").value)}</div>
   <div style="text-align:right"><h1>ORÇAMENTO</h1>${n ? "Nº " + esc(n) + " · " : ""}${today} · Validade: ${esc($("validity").value)} dias</div></div>
   <p><b>Cliente:</b> ${esc($("client").value)} ${esc($("doc").value)} ${esc($("email").value)} ${esc($("phone").value)}</p>
   <table><tr><th>Item</th><th class="r">Qtd</th><th class="r">Unit.</th><th class="r">Desc.</th><th class="r">Total</th></tr>
   ${t.items.map(i => `<tr><td style="display:flex;gap:8px;align-items:center">${i.img ? `<img src="${i.img}" style="width:56px;height:56px;object-fit:cover;border-radius:6px">` : ""}<span>${esc(i.name)}${i.desc ? `<br><small>${esc(i.desc)}</small>` : ""}</span></td><td class="r">${i.qty}</td><td class="r">${brl(i.price)}</td><td class="r">${i.disc ? i.disc + "%" : "-"}</td><td class="r">${brl(i.total)}</td></tr>`).join("")}</table>
   <p class="r" style="text-align:right">Subtotal: ${brl(t.sub)}${t.disc ? `<br>Desconto: - ${brl(t.disc)}` : ""}${t.ship ? `<br>Frete: ${brl(t.ship)}` : ""}<br><b style="font-size:1.2em">Total: ${brl(t.total)}</b></p>
   ${$("delivery").value !== "Sem prazo" ? `<p>Prazo de entrega: ${esc($("delivery").value)}</p>` : ""}<p>Chave PIX: ${esc(CONFIG.pixKey)}</p><p>${esc($("notes").value).replace(/\n/g, "<br>")}</p>`;
  document.title = `orcamento-${n || $("client").value}`; window.print();
};
$("wpp").onclick = () => {
  const t = calc(); if (!valid(t)) return;
  let ph = $("phone").value.replace(/\D/g, ""); if (ph.length <= 11) ph = "55" + ph;
  const msg = `Olá ${$("client").value}! Segue seu orçamento${$("number").value ? " " + $("number").value : ""}:\n\n` + t.items.map(i => `• ${i.qty}x ${i.name} — ${brl(i.total)}`).join("\n") +
    `\n\n*Total: ${brl(t.total)}*\nValidade: ${$("validity").value} dias.\nPIX: ${CONFIG.pixKey}`;
  window.open(`https://wa.me/${ph}?text=${encodeURIComponent(msg)}`, "_blank");
};
