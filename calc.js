const $ = id => document.getElementById(id);
const num = v => parseFloat(String(v ?? "").replace(",", ".")) || 0;
const brl = v => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
document.querySelectorAll("[data-store]").forEach(e => e.textContent = CONFIG.storeName);
const PRESETS = [["Venda direta / PIX (sem taxa)", 0, 0], ["Shopee padrão (14% + R$3)", 14, 3], ["Shopee frete grátis (20% + R$3)", 20, 3], ["Mercado Livre clássico (~13% + R$6)", 13, 6], ["Mercado Livre premium (~18% + R$6)", 18, 6]];
$("preset").innerHTML = PRESETS.map((p, i) => `<option value="${i}">${p[0]}</option>`).join("");
$("preset").onchange = () => { const [, c, f] = PRESETS[$("preset").value]; $("commission").value = c || ""; $("fixedFee").value = f || ""; calc(); };
document.querySelectorAll("[data-t]").forEach(c => c.onchange = () => { $(c.dataset.t).hidden = !c.checked; calc(); });
const consRow = () => { const d = document.createElement("div"); d.className = "r"; d.innerHTML = `<input placeholder="Nome"><input data-c inputmode="decimal" placeholder="0,00"><button class="lnk" type="button" aria-label="Remover">✕</button>`; d.lastChild.onclick = () => { d.remove(); calc(); }; return d; };
$("addCons").onclick = () => { $("consList").append(consRow()); };
let last = {};

function calc() {
  const on = id => $(id).checked, v = id => num($(id).value);
  const hours = v("h") + v("min") / 60;
  const material = v("kg") / 1000 * v("g");
  const energia = v("watts") / 1000 * hours * v("kwh");
  const maquina = on("depOn") && v("life") > 0 ? v("printerValue") / v("life") * hours : 0;
  const cons = on("consOn") ? [...document.querySelectorAll("[data-c]")].reduce((s, i) => s + num(i.value), 0) : 0;
  const risco = on("failOn") ? (material + energia + maquina) * v("failRate") / 100 : 0;
  const custo = material + energia + maquina + cons + risco;
  const lucro = custo * v("markup") / 100;
  const mao = on("laborOn") ? v("postMin") / 60 * v("laborRate") : 0;
  const arte = on("paintOn") ? (v("paintH") + v("paintMin") / 60) * v("paintRate") : 0;
  const liquido = custo + lucro + mao + arte, com = v("commission"), fixa = v("fixedFee");
  const bruto = com > 0 || fixa > 0 ? (liquido + fixa) / (1 - Math.min(com, 95) / 100) : liquido;
  const taxa = bruto - liquido, net = lucro + mao + arte;
  last = { name: $("name").value.trim(), bruto, custo, net };

  const parts = [["Material", material, "#3b82f6"], ["Energia", energia, "#06b6d4"], ["Máquina", maquina, "#a855f7"], ["Consumíveis/risco", cons + risco, "#94a3b8"], ["Lucro", lucro, "#22c55e"], ["Mão de obra", mao, "#8b5cf6"], ["Arte/pintura", arte, "#ec4899"], ["Taxa canal", taxa, "#f59e0b"]];
  const tot = parts.reduce((s, p) => s + p[1], 0); let acc = 0;
  $("donut").style.background = tot > 0 ? `conic-gradient(${parts.filter(p => p[1] > 0).map(p => { const a = acc / tot * 360; acc += p[1]; return `${p[2]} ${a}deg ${acc / tot * 360}deg`; }).join(",")})` : "#e2e6f3";
  $("leg").innerHTML = parts.filter(p => p[1] > 0).map(p => `<span><i style="background:${p[2]}"></i>${p[0]}</span>`).join("");
  $("res").innerHTML = [["Material", material], ["Energia", energia], ["Máquina", maquina], ["Consumíveis/risco", cons + risco], ["Custo de produção", custo, 1], ["Lucro (markup)", lucro], ["Mão de obra", mao], ["Arte/pintura", arte], ["Taxa do canal", taxa]]
    .map(([l, x, b]) => `<div class="${b ? "" : "m"}"><span>${l}</span><${b ? "b" : "span"}>${brl(x)}</${b ? "b" : "span"}></div>`).join("");
  $("final").textContent = brl(bruto); $("net").textContent = `Lucro líquido: ${brl(net)}`;
}
document.addEventListener("input", calc); calc();
$("toQuote").onclick = () => { calc(); location.href = `orcamento.html?name=${encodeURIComponent(last.name || "Peça personalizada")}&price=${last.bruto.toFixed(2)}`; };
$("print").onclick = () => { calc(); document.title = `calculo-${last.name || "peca"}`; window.print(); };
