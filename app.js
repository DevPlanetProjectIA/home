const $ = id => document.getElementById(id);
const code = pixPayload({ key: CONFIG.pixKey, name: CONFIG.pixName, city: CONFIG.pixCity, amount: CONFIG.price });
$("qr").innerHTML = QR.svg(code);
$("code").value = code;
$("price").textContent = CONFIG.price > 0 ? CONFIG.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Consulte o valor";
const wa = t => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(t)}`;
$("paid").href = wa("Olá! Acabei de pagar o plano Google AI Pro 18 meses via PIX. Vou enviar o comprovante aqui. Meu e-mail para ativação: ");
$("ask").href = wa("Olá! Tenho dúvidas sobre o plano Google AI Pro 18 meses.");
$("copy").onclick = async () => {
  try { await navigator.clipboard.writeText(code); } catch { $("code").select(); document.execCommand("copy"); }
  $("copy").textContent = "Copiado ✓"; setTimeout(() => $("copy").textContent = "Copiar código PIX", 2000);
};
