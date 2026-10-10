const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const brl = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const wa = t => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(t)}`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let current = PRODUCTS[0];
let order = null;
let activeCategory = "all";
let orderPollInterval = null;

// Configurações e Títulos da Loja
document.title = `${CONFIG.storeName} — Licenças e Assinaturas com até 80% OFF`;
$$("[data-store]").forEach(e => e.textContent = CONFIG.storeName);

const waSupportMsg = `Olá! Gostaria de tirar uma dúvida sobre as licenças da ${CONFIG.storeName}.`;
if ($("#header-help")) $("#header-help").href = wa(waSupportMsg);
if ($("#footer-wa")) $("#footer-wa").href = wa(waSupportMsg);

// Renderização dos Produtos no Catálogo
function renderCatalog() {
  const catalogEl = $("#catalog");
  if (!catalogEl) return;

  const searchTerm = ($("#search-products")?.value || "").toLowerCase().trim();

  const filtered = PRODUCTS.filter(p => {
    const matchesCat = activeCategory === "all" || p.category === activeCategory;
    const matchesSearch = !searchTerm || 
      p.name.toLowerCase().includes(searchTerm) || 
      p.short.toLowerCase().includes(searchTerm) ||
      (p.tag && p.tag.toLowerCase().includes(searchTerm));
    return matchesCat && matchesSearch;
  });

  if (filtered.length === 0) {
    catalogEl.innerHTML = `
      <div style="grid-column: 1 / -1; text-align:center; padding: 60px 20px; background:var(--surface); border-radius:18px; border:1px dashed var(--card-border);">
        <p style="font-size:1.5rem; margin-bottom:8px;">🔍</p>
        <h3 style="color:#fff; margin-bottom:6px;">Nenhum produto encontrado</h3>
        <p class="muted">Tente buscar por outro termo ou selecione a categoria "Todos".</p>
      </div>`;
    return;
  }

  catalogEl.innerHTML = filtered.map(p => {
    const oldPriceHtml = p.originalPrice ? `<span class="old-price">${brl(p.originalPrice)}</span>` : "";
    const discountBadge = p.discount ? `<span class="badge-discount">${esc(p.discount)}</span>` : "";
    const promoBadge = p.badge ? `<span class="badge-tag">${esc(p.badge)}</span>` : "";

    const highlightsList = (p.highlights || []).map(h => `
      <li>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${esc(h)}</span>
      </li>
    `).join("");

    return `
      <article class="product-card">
        <div class="card-media">
          <img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy">
          <div class="card-badges">
            ${discountBadge}
            ${promoBadge}
          </div>
        </div>

        <div class="card-body">
          <div class="card-rating">
            <span class="stars">★★★★★</span>
            <span class="review-count">(${p.reviewsCount || 100}+ avaliações)</span>
          </div>

          <h3>${esc(p.name)}</h3>
          <p class="card-short-desc">${esc(p.short)}</p>

          <ul class="card-highlights">
            ${highlightsList}
          </ul>

          <div class="card-pricing">
            <div class="price-row">
              ${oldPriceHtml}
              <b class="current-price">${brl(p.price)}</b>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:6px;">
              <span class="price-pill">Pagamento Único</span>
              <span class="price-sub">ou até 12x no cartão</span>
            </div>
          </div>

          <div class="card-buttons">
            <button class="btn" data-buy="${esc(p.id)}">
              <span>Comprar Agora</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </button>
            <button class="btn alt" data-open="${esc(p.id)}" title="Ver todos os detalhes">
              <span>Detalhes</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

// Filtros por Categoria
$$(".cat-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    $$(".cat-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    activeCategory = tab.dataset.cat;
    renderCatalog();
  });
});

// Busca em Tempo Real
const searchInput = $("#search-products");
if (searchInput) {
  searchInput.addEventListener("input", renderCatalog);
}

// Modal Controllers
const dlg = { prod: $("#dlg-prod"), buy: $("#dlg-buy") };

document.addEventListener("click", e => {
  const btnOpen = e.target.closest("[data-open]");
  if (btnOpen) openProduct(btnOpen.dataset.open);

  const btnBuy = e.target.closest("[data-buy]");
  if (btnBuy) {
    const prod = PRODUCTS.find(p => p.id === btnBuy.dataset.buy);
    if (prod) startCheckout(prod);
  }

  if (e.target.closest("[data-close]")) {
    const dialog = e.target.closest("dialog");
    if (dialog) dialog.close();
  }
});

// Abrir Detalhes do Produto
function openProduct(id) {
  current = PRODUCTS.find(p => p.id === id);
  if (!current) return;

  $("#p-img").src = current.image;
  $("#p-img").alt = current.name;
  $("#p-tag").textContent = current.tag || "Assinatura Digital";
  $("#p-name").textContent = current.name;
  $("#p-desc").textContent = current.description;
  $("#p-old-price").textContent = current.originalPrice ? brl(current.originalPrice) : "";
  $("#p-price").textContent = brl(current.price);

  $("#p-feat").innerHTML = current.features.map(([t, d]) => `
    <li style="background:rgba(255,255,255,0.03); border:1px solid var(--card-border); border-radius:10px; padding:10px 14px;">
      <b style="display:block; color:#fff; font-size:0.95rem; margin-bottom:2px;">${esc(t)}</b>
      <span class="muted" style="font-size:0.85rem;">${esc(d)}</span>
    </li>
  `).join("");

  dlg.prod.showModal();
}

$("#p-buy").onclick = () => {
  dlg.prod.close();
  startCheckout(current);
};

// Iniciar Checkout
function startCheckout(prod) {
  current = prod;
  $("#s-form").hidden = false;
  $("#s-pix").hidden = true;
  $("#err").textContent = "";
  $("#b-summary").textContent = `${prod.name} · ${brl(prod.price)} (Pagamento único sem mensalidade)`;
  dlg.buy.showModal();
}

// Submissão do Formulário de Checkout
$("#form").onsubmit = async e => {
  e.preventDefault();
  const name = $("#f-nome").value.trim();
  const email = $("#f-email").value.trim();
  const phone = $("#f-tel").value.replace(/\D/g, "");

  const fail = m => { $("#err").textContent = m; };
  if (name.split(/\s+/).length < 2) return fail("Informe seu nome completo (nome e sobrenome).");
  if (phone.length < 10 || phone.length > 11) return fail("Informe um telefone WhatsApp válido com DDD.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail("Informe um e-mail válido.");
  if (!$("#f-ok").checked) return fail("É necessário concordar com as condições de entrega.");
  fail("");

  const btn = $("#form button[type=submit]");
  btn.disabled = true;
  btn.innerHTML = `<span>Gerando cobrança no Mercado Pago...</span>`;

  const apiBase = (typeof CONFIG !== 'undefined' && CONFIG.flowApi) ? CONFIG.flowApi.replace(/\/$/, "") : window.location.origin;

  let orderId = ("ORD-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5)).toUpperCase();
  let accessToken = "";
  let code = "";
  let qrBase64 = "";
  let ticketUrl = "";

  try {
    const res = await fetch(`${apiBase}/api/ecommerce/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone,
        productId: current.id,
        productName: current.name,
        amount: current.price
      })
    });

    if (res.ok) {
      const data = await res.json();
      orderId = data.orderId;
      accessToken = data.accessToken;
      code = data.qrCode;
      qrBase64 = data.qrCodeBase64;
      ticketUrl = data.ticketUrl || data.checkoutUrl || "";
    }
  } catch (err) {
    console.warn("Backend offline, gerando código PIX padrão:", err);
  }

  // Fallback se não recebeu código PIX da API
  if (!code && typeof pixPayload === "function") {
    code = pixPayload({ key: CONFIG.pixKey, name: CONFIG.pixName, city: CONFIG.pixCity, amount: current.price, txid: orderId });
  }

  order = { ref: orderId, name, email, phone, product: current.name, total: current.price };

  btn.disabled = false;
  btn.innerHTML = `<span>Prosseguir para o Pagamento</span>`;

  // Exibir QR Code
  const qrEl = $("#qr");
  if (qrBase64) {
    qrEl.innerHTML = `<img src="data:image/png;base64,${qrBase64}" style="width:100%;height:100%;object-fit:contain;" alt="QR Code PIX">`;
  } else if (typeof QR !== 'undefined' && code) {
    qrEl.innerHTML = QR.svg(code);
  } else {
    qrEl.textContent = "QR Code Gerado";
  }

  $("#code").value = code;
  $("#pay-total").textContent = brl(current.price);

  const orderUrl = `pedido.html?id=${encodeURIComponent(orderId)}${accessToken ? `&token=${encodeURIComponent(accessToken)}` : ''}`;
  const btnOrder = $("#btn-open-order");
  if (btnOrder) btnOrder.href = orderUrl;

  // Botão de pagar no Mercado Pago (Cartão de Crédito)
  const btnMp = $("#btn-mp-pay");
  if (btnMp) {
    if (ticketUrl && ticketUrl.includes("mercadopago")) {
      btnMp.href = ticketUrl;
      btnMp.style.display = "inline-flex";
    } else {
      btnMp.style.display = "none";
    }
  }

  $("#paid").href = wa(
    `Olá! Acabei de fazer um pedido na loja.\n\n` +
    `Produto: ${current.name} (${brl(current.price)})\n` +
    `Pedido: ${orderId}\n` +
    `Nome: ${name}\n` +
    `Acompanhamento: ${window.location.origin}/${orderUrl}`
  );

  $("#s-form").hidden = true;
  $("#s-pix").hidden = false;

  // Polling automático: assim que o pagamento for aprovado, redireciona para a Área do Cliente
  if (accessToken) {
    if (orderPollInterval) clearInterval(orderPollInterval);
    orderPollInterval = setInterval(async () => {
      try {
        const checkRes = await fetch(`${apiBase}/api/ecommerce/orders/${encodeURIComponent(orderId)}?token=${encodeURIComponent(accessToken)}`);
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.status === 'approved' || checkData.status === 'delivered') {
            clearInterval(orderPollInterval);
            window.location.href = orderUrl;
          }
        }
      } catch {}
    }, 3000);
  }
};

// Botão Copiar Código PIX
const copyBtn = $("#copy");
if (copyBtn) {
  copyBtn.onclick = async () => {
    const c = $("#code").value;
    try { await navigator.clipboard.writeText(c); } catch { $("#code").select(); document.execCommand("copy"); }
    copyBtn.innerHTML = `<span>Copiado com Sucesso ✓</span>`;
    setTimeout(() => {
      copyBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        <span>Copiar código PIX</span>`;
    }, 2500);
  };
}

// Inicializa a vitrine
renderCatalog();
