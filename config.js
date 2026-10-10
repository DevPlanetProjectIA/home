// ===== CONFIGURAÇÃO — edite aqui =====
const CONFIG = {
  storeName: "DevPlanet Store",
  pixKey: "05913955765",           // chave PIX (CPF)
  pixName: "BRUNO LACERDA TOLEDO", // nome do recebedor (até 25 caracteres)
  pixCity: "RIO DE JANEIRO",
  whatsapp: "5521983110332",
  // Integração com o backend (Mercado Pago, Área do Cliente e Flow).
  // Em localhost usa http://localhost:3000; em produção usa o Render oficial.
  flowApi: (window.location.protocol === "file:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "http://localhost:3000" : "https://devplanet-api.onrender.com",
  flowUrl: "",                     // endereço público do Flow (mostra o link "Área do vendedor" no rodapé)
  storeSlug: "",
  salesBefore: 30,                 // vendas feitas antes do Flow estar registrando (some às vendas "entregues" no Flow)
  goatcounter: "",                 // código do GoatCounter (contador de acessos), ex.: "minhaloja" -> minhaloja.goatcounter.com
};
