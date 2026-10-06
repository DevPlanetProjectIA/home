const $ = id => document.getElementById(id);
const brl = CONFIG.price > 0 ? CONFIG.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Consulte o valor";
$("price").textContent = brl; $("price2").textContent = brl;
const wa = t => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(t)}`;
$("ask").href = wa("Olá! Tenho dúvidas sobre o plano Google AI Pro 18 meses.");
const show = id => ["step1", "form", "step3"].forEach(s => $(s).classList.toggle("hide", s !== id));
const go = id => { show(id); $(id).scrollIntoView({ behavior: "smooth", block: "center" }); };

$("buy").onclick = () => { go("form"); $("f-nome").focus({ preventScroll: true }); };
$("back").onclick = () => go("step1");

$("form").onsubmit = e => {
  e.preventDefault();
  const nome = $("f-nome").value.trim(), email = $("f-email").value.trim(), tel = $("f-tel").value.replace(/\D/g, "");
  const fail = m => { $("err").textContent = m; return false; };
  if (nome.split(/\s+/).length < 2) return fail("Informe seu nome completo.");
  if (tel.length < 10 || tel.length > 11) return fail("Informe um telefone válido com DDD.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail("Informe um e-mail válido.");
  if (!$("f-ok").checked) return fail("É necessário concordar com as condições de entrega.");
  $("err").textContent = "";

  const code = pixPayload({ key: CONFIG.pixKey, name: CONFIG.pixName, city: CONFIG.pixCity, amount: CONFIG.price });
  $("qr").innerHTML = QR.svg(code);
  $("code").value = code;
  $("paid").href = wa(
    `Olá! Acabei de pagar o plano Google AI Pro 18 meses (${brl}) via PIX.\n\n` +
    `Nome: ${nome}\nTelefone: ${tel}\nE-mail: ${email}\n` +
    `Concordo com a entrega em até 2 horas após a confirmação do pagamento.\n\nSegue o comprovante:`);
  go("step3");
};

$("copy").onclick = async () => {
  const code = $("code").value;
  try { await navigator.clipboard.writeText(code); } catch { $("code").select(); document.execCommand("copy"); }
  $("copy").textContent = "Copiado ✓"; setTimeout(() => $("copy").textContent = "Copiar código PIX", 2000);
};
