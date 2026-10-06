// ===== CONFIGURAÇÃO — edite aqui =====
const CONFIG = {
  storeName: "DevPlanet Store",
  pixKey: "05913955765",           // chave PIX (CPF)
  pixName: "BRUNO LACERDA TOLEDO", // nome do recebedor (até 25 caracteres)
  pixCity: "RIO DE JANEIRO",
  whatsapp: "5521983110332",
  // Integração com o Flow (sistema de gestão). Deixe flowApi vazio para desativar.
  flowApi: "",                     // ex.: "https://flow.seudominio.com"
  flowUrl: "",                     // endereço público do Flow (mostra o link "Área do vendedor" no rodapé)
  storeSlug: "",
  salesBefore: 30,                 // vendas feitas antes do Flow estar registrando (some às vendas "entregues" no Flow)
  goatcounter: "",                 // código do GoatCounter (contador de acessos), ex.: "minhaloja" -> minhaloja.goatcounter.com                   // mesmo "slug da loja" configurado em Configurações no Flow
};
