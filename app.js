const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const brl = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const wa = t => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(t)}`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let current = PRODUCTS[0];
let order = null;
let activeCategory = "all";
let orderPollInterval = null;
let selectedPaymentMethod = "pix";

// Configurações e Títulos da Loja
try {
  document.title = `${CONFIG.storeName} — Licenças e Assinaturas com até 80% OFF`;
  $$("[data-store]").forEach(e => e.textContent = CONFIG.storeName);

  const waSupportMsg = `Olá! Gostaria de tirar uma dúvida sobre as licenças da ${CONFIG.storeName}.`;
  if ($("#header-help")) $("#header-help").href = wa(waSupportMsg);
  if ($("#footer-wa")) $("#footer-wa").href = wa(waSupportMsg);
  if ($("#wa-float")) $("#wa-float").href = wa(waSupportMsg);

  // Prova Social de Vendas Recentes (Gera Confiança e Urgência)
  const SALES_FEED = [
    { name: "Carlos", city: "São Paulo/SP", product: "Microsoft 365 Premium — 12 meses", time: "há 4 minutos" },
    { name: "Juliana", city: "Rio de Janeiro/RJ", product: "Lovable Lite — 12 meses", time: "há 11 minutos" },
    { name: "Felipe", city: "Belo Horizonte/MG", product: "Google AI Pro — 18 meses", time: "há 18 minutos" },
    { name: "Mariana", city: "Curitiba/PR", product: "Adobe Express — 12 meses", time: "há 25 minutos" },
    { name: "Rafael", city: "Porto Alegre/RS", product: "Amazon Prime Video — 6 meses", time: "há 34 minutos" },
    { name: "Beatriz", city: "Brasília/DF", product: "Duolingo Super — 12 meses", time: "há 42 minutos" }
  ];
  let salesFeedIdx = 0;
  function triggerSalesToast() {
    const toast = $("#live-sales-toast");
    if (!toast) return;
    const item = SALES_FEED[salesFeedIdx % SALES_FEED.length];
    salesFeedIdx++;
    const av = $("#toast-avatar");
    const tit = $("#toast-title");
    const pr = $("#toast-product");
    const tm = $("#toast-time");
    if (av) av.textContent = item.name[0];
    if (tit) tit.textContent = `${item.name} (${item.city}) comprou`;
    if (pr) pr.textContent = item.product;
    if (tm) tm.textContent = `✓ ${item.time}`;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 5000);
  }
  setTimeout(() => {
    triggerSalesToast();
    setInterval(triggerSalesToast, 16000);
  }, 4000);
} catch (e) {
  console.warn("Config initialization:", e);
}

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

    const creditPrice = p.creditPrice || p.price;
    const creditText = creditPrice !== p.price 
      ? `ou <b>${brl(creditPrice)}</b> em até 12x no cartão`
      : `ou em até 12x no cartão`;

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
              <div class="price-main-block">
                <b class="current-price">${brl(p.price)}</b>
                <span class="price-badge-pix">no PIX</span>
              </div>
            </div>
            <div class="price-sub-row">
              <span class="price-credit-text">${creditText}</span>
              <span class="price-pill-single">Sem Mensalidade</span>
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

// Renderiza imediatamente os produtos para nunca carregar escondido
renderCatalog();
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderCatalog);
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

// Fechar modal ao clicar fora (no backdrop)
[dlg.prod, dlg.buy].forEach(d => {
  if (d) {
    d.addEventListener("click", e => {
      if (e.target === d) d.close();
    });
  }
});

// Abrir Detalhes do Produto
function openProduct(id) {
  current = PRODUCTS.find(p => p.id === id);
  if (!current) return;

  const pImg = $("#p-img");
  if (pImg) {
    pImg.src = current.image;
    pImg.alt = current.name;
  }
  if ($("#p-tag")) $("#p-tag").textContent = current.tag || "Assinatura Digital";
  if ($("#p-name")) $("#p-name").textContent = current.name;
  if ($("#p-desc")) $("#p-desc").textContent = current.description;
  if ($("#p-old-price")) $("#p-old-price").textContent = current.originalPrice ? brl(current.originalPrice) : "";
  if ($("#p-price")) $("#p-price").innerHTML = `${brl(current.price)} <small style="font-size:0.85rem; color:#4ade80; font-weight:800; text-transform:uppercase;">no PIX</small>`;
  
  const creditPrice = current.creditPrice || current.price;
  const pCreditEl = $("#p-credit-price");
  if (pCreditEl) {
    pCreditEl.innerHTML = creditPrice !== current.price 
      ? `ou <b>${brl(creditPrice)}</b> no cartão de crédito em até 12x`
      : `ou em até 12x no cartão de crédito sem juros`;
  }

  const pFeat = $("#p-feat");
  if (pFeat) {
    pFeat.innerHTML = current.features.map(([t, d]) => `
      <li style="background:rgba(255,255,255,0.03); border:1px solid var(--card-border); border-radius:10px; padding:10px 14px;">
        <b style="display:block; color:#fff; font-size:0.95rem; margin-bottom:2px;">${esc(t)}</b>
        <span class="muted" style="font-size:0.85rem;">${esc(d)}</span>
      </li>
    `).join("");
  }

  if (dlg.prod) dlg.prod.showModal();
}

const pBuyBtn = $("#p-buy");
if (pBuyBtn) {
  pBuyBtn.onclick = () => {
    if (dlg.prod) dlg.prod.close();
    startCheckout(current);
  };
}

// Atualiza o estado da seleção de forma de pagamento no checkout
function updatePaymentMethodUI() {
  const pixPrice = current.price;
  const cardPrice = current.creditPrice || current.price;

  if ($("#pix-method-price")) $("#pix-method-price").textContent = brl(pixPrice);
  if ($("#card-method-price")) $("#card-method-price").textContent = brl(cardPrice);

  const activeAmount = (selectedPaymentMethod === "credit_card") ? cardPrice : pixPrice;
  const methodLabel = (selectedPaymentMethod === "credit_card") ? "Cartão de Crédito" : "PIX à vista";

  if ($("#b-summary")) {
    $("#b-summary").textContent = `${current.name} · ${brl(activeAmount)} (${methodLabel})`;
  }

  const btnSubmitText = $("#btn-submit-text");
  if (btnSubmitText) {
    btnSubmitText.textContent = selectedPaymentMethod === "credit_card"
      ? `Pagar ${brl(activeAmount)} no Cartão (Mercado Pago) 💳`
      : `Pagar ${brl(activeAmount)} no PIX ⚡`;
  }

  if ($("#opt-pix-wrap")) {
    $("#opt-pix-wrap").classList.toggle("active", selectedPaymentMethod === "pix");
  }
  if ($("#opt-card-wrap")) {
    $("#opt-card-wrap").classList.toggle("active", selectedPaymentMethod === "credit_card");
  }
}

// Event listeners nos seletores de pagamento
function setupPaymentSelectorListeners() {
  const optPix = $("#opt-pix");
  const optCard = $("#opt-card");

  if (optPix) {
    optPix.addEventListener("change", () => {
      if (optPix.checked) {
        selectedPaymentMethod = "pix";
        updatePaymentMethodUI();
      }
    });
  }

  if (optCard) {
    optCard.addEventListener("change", () => {
      if (optCard.checked) {
        selectedPaymentMethod = "credit_card";
        updatePaymentMethodUI();
      }
    });
  }
}
setupPaymentSelectorListeners();

// Iniciar Checkout
function startCheckout(prod) {
  current = prod;
  selectedPaymentMethod = "pix";

  if ($("#opt-pix")) $("#opt-pix").checked = true;
  if ($("#opt-card")) $("#opt-card").checked = false;

  const sForm = $("#s-form");
  const sPix = $("#s-pix");
  if (sForm) {
    sForm.hidden = false;
    sForm.style.display = "block";
  }
  if (sPix) {
    sPix.hidden = true;
    sPix.style.display = "none";
  }
  if ($("#err")) $("#err").textContent = "";

  const boxPix = $("#box-pix-content");
  const boxCard = $("#box-card-content");
  if (boxPix) {
    boxPix.hidden = false;
    boxPix.style.display = "grid";
  }
  if (boxCard) {
    boxCard.hidden = true;
    boxCard.style.display = "none";
  }

  updatePaymentMethodUI();
  if (dlg.buy) dlg.buy.showModal();
}

// Processa a submissão do checkout
async function processCheckout(e) {
  if (e) e.preventDefault();

  const name = ($("#f-nome")?.value || "").trim();
  const email = ($("#f-email")?.value || "").trim();
  const phone = ($("#f-tel")?.value || "").replace(/\D/g, "");

  const fail = m => { 
    const el = $("#err"); 
    if (el) el.textContent = m; 
  };

  if (name.split(/\s+/).length < 2) return fail("Informe seu nome completo (nome e sobrenome).");
  if (phone.length < 10 || phone.length > 11) return fail("Informe um telefone WhatsApp válido com DDD.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail("Informe um e-mail válido.");
  if (!$("#f-ok")?.checked) return fail("É necessário concordar com as condições de entrega.");
  fail("");

  const activeAmount = (selectedPaymentMethod === "credit_card")
    ? (current.creditPrice || current.price)
    : current.price;

  const btn = $("#btn-submit-order");
  const btnText = $("#btn-submit-text");
  if (btn) btn.disabled = true;
  if (btnText) btnText.textContent = "Processando no Mercado Pago...";

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
        amount: activeAmount,
        paymentMethod: selectedPaymentMethod
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
    console.warn("Backend offline, gerando código de pagamento local:", err);
  }

  // Fallback se não recebeu código PIX da API
  if (!code && typeof pixPayload === "function" && selectedPaymentMethod === "pix") {
    code = pixPayload({ key: CONFIG.pixKey, name: CONFIG.pixName, city: CONFIG.pixCity, amount: activeAmount, txid: orderId });
  }

  order = { ref: orderId, name, email, phone, product: current.name, total: activeAmount };

  if (btn) btn.disabled = false;
  if (btnText) {
    btnText.textContent = selectedPaymentMethod === "credit_card"
      ? `Pagar ${brl(activeAmount)} no Cartão (Mercado Pago) 💳`
      : `Pagar ${brl(activeAmount)} no PIX ⚡`;
  }

  const payTotalEl = $("#pay-total");
  if (payTotalEl) payTotalEl.textContent = brl(activeAmount);

  const orderUrl = `pedido.html?id=${encodeURIComponent(orderId)}${accessToken ? `&token=${encodeURIComponent(accessToken)}` : ''}`;
  const btnOrder = $("#btn-open-order");
  if (btnOrder) btnOrder.href = orderUrl;

  const boxPix = $("#box-pix-content");
  const boxCard = $("#box-card-content");
  const subMsg = $("#pay-sub-msg");
  const statusPill = $("#pay-status-pill");

  if (selectedPaymentMethod === "credit_card") {
    // Modo Cartão de Crédito
    if (boxPix) {
      boxPix.hidden = true;
      boxPix.style.display = "none";
    }
    if (boxCard) {
      boxCard.hidden = false;
      boxCard.style.display = "block";
    }
    if (subMsg) subMsg.textContent = `Cobrança de ${brl(activeAmount)} gerada no Mercado Pago. Parcele em até 12x no cartão!`;
    if (statusPill) statusPill.textContent = "Aguardando Pagamento no Cartão";

    const btnDirectCard = $("#btn-mp-pay-direct");
    if (btnDirectCard) {
      const targetUrl = ticketUrl || orderUrl;
      btnDirectCard.href = targetUrl;
      if (ticketUrl) {
        try { window.open(ticketUrl, "_blank"); } catch {}
      }
    }
  } else {
    // Modo PIX
    if (boxPix) {
      boxPix.hidden = false;
      boxPix.style.display = "grid";
    }
    if (boxCard) {
      boxCard.hidden = true;
      boxCard.style.display = "none";
    }
    if (subMsg) subMsg.textContent = "Escaneie o QR Code ou use o Copia e Cola. Assim que pagar, sua licença será liberada no WhatsApp!";
    if (statusPill) statusPill.textContent = "Aguardando Pagamento PIX";

    const qrEl = $("#qr");
    if (qrEl) {
      if (qrBase64) {
        qrEl.innerHTML = `<img src="data:image/png;base64,${qrBase64}" style="width:100%;height:100%;object-fit:contain;" alt="QR Code PIX">`;
      } else if (typeof QR !== 'undefined' && code) {
        qrEl.innerHTML = QR.svg(code);
      } else {
        qrEl.textContent = "QR Code Gerado";
      }
    }
    const codeEl = $("#code");
    if (codeEl) codeEl.value = code;

    const wrapMpPix = $("#wrap-mp-pix-btn");
    const btnDirectPix = $("#btn-mp-pix-direct");
    if (ticketUrl && btnDirectPix) {
      btnDirectPix.href = ticketUrl;
      if (wrapMpPix) wrapMpPix.hidden = false;
      try { window.open(ticketUrl, "_blank"); } catch {}
    } else if (wrapMpPix) {
      wrapMpPix.hidden = true;
    }
  }

  const paidWa = $("#paid");
  if (paidWa) {
    const orderFullUrl = new URL(orderUrl, window.location.href).href;
    paidWa.href = wa(
      `Olá! Acabei de fazer um pedido na loja.\n\n` +
      `Produto: ${current.name} (${brl(activeAmount)} via ${selectedPaymentMethod === 'credit_card' ? 'Cartão' : 'PIX'})\n` +
      `Pedido: ${orderId}\n` +
      `Nome: ${name}\n` +
      `Acompanhamento: ${orderFullUrl}`
    );
  }

  const sForm = $("#s-form");
  const sPix = $("#s-pix");
  if (sForm) {
    sForm.hidden = true;
    sForm.style.display = "none";
  }
  if (sPix) {
    sPix.hidden = false;
    sPix.style.display = "block";
  }

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
}

// Vincula o evento do formulário e botão
const formEl = $("#form");
if (formEl) {
  formEl.onsubmit = processCheckout;
}

const submitBtn = $("#btn-submit-order");
if (submitBtn) {
  submitBtn.addEventListener("click", e => {
    if (!formEl) processCheckout(e);
  });
}

// Botão Copiar Código PIX
const copyBtn = $("#copy");
if (copyBtn) {
  copyBtn.onclick = async () => {
    const codeEl = $("#code");
    const c = codeEl ? codeEl.value : "";
    try { await navigator.clipboard.writeText(c); } catch { if (codeEl) { codeEl.select(); document.execCommand("copy"); } }
    copyBtn.innerHTML = `<span>Copiado com Sucesso ✓</span>`;
    setTimeout(() => {
      copyBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        <span>Copiar código PIX</span>`;
    }, 2500);
  };
}

// Botão Voltar para o Formulário a partir da tela de pagamento
const btnBack = $("#btn-back-form");
if (btnBack) {
  btnBack.onclick = () => {
    const sPix = $("#s-pix");
    const sForm = $("#s-form");
    if (sPix) {
      sPix.hidden = true;
      sPix.style.display = "none";
    }
    if (sForm) {
      sForm.hidden = false;
      sForm.style.display = "block";
    }
  };
}


