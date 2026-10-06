const $ = id => document.getElementById(id);
const num = v => parseFloat(String(v ?? "").replace(",", ".")) || 0;
const brl = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
document.querySelectorAll("[data-store]").forEach(e => e.textContent = CONFIG.storeName);
$("seller").value = CONFIG.storeName;
const p = new URLSearchParams(location.search);
const saved = JSON.parse(localStorage.getItem("quoteSeller") || "{}");
if (saved.seller) $("seller").value = saved.seller; if (saved.sellerPhone) $("sellerPhone").value = saved.sellerPhone;

function addItem(it = {}) {
  const d = document.createElement("div"); d.className = "it";
  d.innerHTML = `<input data-k="name" placeholder="Item" value="${esc(it.name || "")}"><input data-k="qty" type="number" min="1" value="${it.qty || 1}">
  <input data-k="price" inputmode="decimal" placeholder="Preço unit." value="${esc(it.price || "")}"><input data-k="disc" inputmode="decimal" placeholder="Desc. %">
  <button class="lnk" type="button" aria-label="Remover">✕</button><input class="d" data-k="desc" placeholder="Descrição (opcional)">`;
  d.querySelector("button").onclick = () => { d.remove(); calc(); };
  $("items").append(d);
}
addItem(p.get("name") ? { name: p.get("name"), price: p.get("price") } : {});
$("addItem").onclick = () => addItem();

function data() {
  const items = [...$("items").children].map(r => { const g = k => r.querySelector(`[data-k=${k}]`).value; const qty = num(g("qty")), price = num(g("price")), disc = num(g("disc"));
    return { name: g("name").trim(), desc: g("desc").trim(), qty, price, disc, total: Math.max(0, qty * price * (1 - disc / 100)) }; }).filter(i => i.name);
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
  $("doc").innerHTML = `<div style="display:flex;justify-content:space-between"><div><h2 style="margin:0">${esc($("seller").value)}</h2>${esc($("sellerPhone").value)}</div>
   <div style="text-align:right"><h1>ORÇAMENTO</h1>${n ? "Nº " + esc(n) + " · " : ""}${today} · Validade: ${esc($("validity").value)} dias</div></div>
   <p><b>Cliente:</b> ${esc($("client").value)} ${esc($("doc").value)} ${esc($("email").value)} ${esc($("phone").value)}</p>
   <table><tr><th>Item</th><th class="r">Qtd</th><th class="r">Unit.</th><th class="r">Desc.</th><th class="r">Total</th></tr>
   ${t.items.map(i => `<tr><td>${esc(i.name)}${i.desc ? `<br><small>${esc(i.desc)}</small>` : ""}</td><td class="r">${i.qty}</td><td class="r">${brl(i.price)}</td><td class="r">${i.disc ? i.disc + "%" : "-"}</td><td class="r">${brl(i.total)}</td></tr>`).join("")}</table>
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
