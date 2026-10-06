const $ = (s, r = document) => r.querySelector(s);
const brl = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const wa = t => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(t)}`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const AUD_ICON = { "Criadores de conteúdo": "users", "Estudantes": "cap", "Profissionais": "case", "Designers": "pencil" };
const FEAT_ICON = { "Gemini avançado": "chat.svg", "5 TB de armazenamento": "cloud.svg", "1000 créditos por mês": "coin.png", "NotebookLM": "book.svg", "Veo 3": "video.svg" };
let current = null, order = null;

$("#hero-price").textContent = brl(PRODUCTS[0].price);
document.title = `${CONFIG.storeName} — Assinaturas e produtos digitais`;
document.querySelectorAll("[data-store]").forEach(e => e.textContent = CONFIG.storeName);
$("#help").href = wa("Olá! Tenho uma dúvida sobre a loja.");

$("#catalog").innerHTML = PRODUCTS.map(p => `
  <article class="prod">
    <span class="tag">${esc(p.tag)}</span>
    <h3>${esc(p.name)}</h3>
    <p>${esc(p.short)}</p>
    <div class="row"><div><b class="pr">${brl(p.price)}</b><span class="once-s">pagamento único · sem mensalidade</span></div>
    <button class="btn" data-open="${esc(p.id)}">Ver produto</button></div>
  </article>`).join("") + `<article class="prod soon"><span class="tag">Em breve</span><h3>Novos produtos</h3><p>Estamos preparando novas assinaturas e produtos digitais.</p></article>`;

const dlg = { prod: $("#dlg-prod"), buy: $("#dlg-buy") };
document.addEventListener("click", e => {
  const o = e.target.closest("[data-open]"); if (o) openProduct(o.dataset.open);
  if (e.target.closest("[data-close]")) e.target.closest("dialog").close();
});

function openProduct(id) {
  current = PRODUCTS.find(p => p.id === id);
  $("#p-name").textContent = current.name;
  $("#p-desc").textContent = current.description;
  $("#p-price").textContent = brl(current.price);
  $("#p-feat").innerHTML = current.features.map(([t, d]) => `<li>${FEAT_ICON[t] ? `<img src="img/${FEAT_ICON[t]}" alt="">` : ""}<b>${esc(t)}</b><span>${esc(d)}</span></li>`).join("");
  $("#p-aud").innerHTML = current.audience.map(a => `<span>${AUD_ICON[a] ? `<img src="img/${AUD_ICON[a]}.png" alt="">` : ""}${esc(a)}</span>`).join("");
  dlg.prod.showModal();
}

$("#p-buy").onclick = () => {
  dlg.prod.close();
  $("#s-form").hidden = false; $("#s-pix").hidden = true; $("#err").textContent = "";
  $("#b-summary").textContent = `${current.name} · ${brl(current.price)} (pagamento único, sem mensalidade)`;
  dlg.buy.showModal();
};

$("#form").onsubmit = async e => {
  e.preventDefault();
  const name = $("#f-nome").value.trim(), email = $("#f-email").value.trim(), phone = $("#f-tel").value.replace(/\D/g, "");
  const fail = m => { $("#err").textContent = m; };
  if (name.split(/\s+/).length < 2) return fail("Informe seu nome completo.");
  if (phone.length < 10 || phone.length > 11) return fail("Informe um telefone válido com DDD.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail("Informe um e-mail válido.");
  if (!$("#f-ok").checked) return fail("É necessário concordar com as condições de entrega.");
  fail("");
  const ref = ("L" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)).toUpperCase();
  order = { ref, name, email, phone, product: current.name, total: current.price };
  const btn = $("#form button[type=submit]"); btn.disabled = true;
  await sendToFlow(order);
  btn.disabled = false;

  const code = pixPayload({ key: CONFIG.pixKey, name: CONFIG.pixName, city: CONFIG.pixCity, amount: current.price, txid: ref });
  $("#qr").innerHTML = QR.svg(code); $("#code").value = code;
  $("#pay-total").textContent = brl(current.price);
  $("#paid").href = wa(
    `Olá! Acabei de pagar via PIX.\n\nProduto: ${current.name} (${brl(current.price)})\nPedido: ${ref}\n` +
    `Nome: ${name}\nTelefone: ${phone}\nE-mail: ${email}\n` +
    `Concordo com a entrega em até 24 horas após a confirmação do pagamento.\n\nSegue o comprovante:`);
  $("#s-form").hidden = true; $("#s-pix").hidden = false;
};

// Registra o pedido no Flow (se configurado). Falha não bloqueia a compra: o pedido também segue pelo WhatsApp.
async function sendToFlow(o) {
  if (!CONFIG.flowApi || !CONFIG.storeSlug) return;
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 6000);
    await fetch(`${CONFIG.flowApi.replace(/\/$/, "")}/api/public/store/${encodeURIComponent(CONFIG.storeSlug)}/checkout`, {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: ctl.signal,
      body: JSON.stringify({ ...o, consent: true }),
    });
    clearTimeout(t);
  } catch { /* segue pelo WhatsApp */ }
}

$("#copy").onclick = async () => {
  const c = $("#code").value;
  try { await navigator.clipboard.writeText(c); } catch { $("#code").select(); document.execCommand("copy"); }
  $("#copy").textContent = "Copiado ✓"; setTimeout(() => $("#copy").textContent = "Copiar código PIX", 2000);
};

document.querySelectorAll(".faq details").forEach(d => d.addEventListener("toggle", () => {
  if (d.open) document.querySelectorAll(".faq details").forEach(o => o !== d && (o.open = false));
}));

if (CONFIG.flowUrl) { const s = $("#seller"); s.href = CONFIG.flowUrl; s.hidden = false; }

// Contador de vendas: valor informado em salesBefore + vendas entregues registradas no Flow (se configurado).
(async () => {
  let n = Number(CONFIG.salesBefore) || 0;
  if (CONFIG.flowApi && CONFIG.storeSlug) {
    try { const r = await fetch(`${CONFIG.flowApi.replace(/\/$/, "")}/api/public/store/${encodeURIComponent(CONFIG.storeSlug)}/stats`); if (r.ok) n += (await r.json()).sales || 0; } catch {}
  }
  if (n > 0) { $("#sales").textContent = `✔ ${n.toLocaleString("pt-BR")} vendas realizadas`; $("#sales").hidden = false; }
})();
// Contador de acessos (GoatCounter), só se configurado.
if (CONFIG.goatcounter) { const s = document.createElement("script"); s.async = true; s.dataset.goatcounter = `https://${CONFIG.goatcounter}.goatcounter.com/count`; s.src = "https://gc.zgo.at/count.js"; document.head.append(s); }
