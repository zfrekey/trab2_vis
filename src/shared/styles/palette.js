// Cores dos dados para o D3. Toda view pega as cores daqui, nunca usa hex solto,
// para a mesma categoria ter sempre a mesma cor em todas as visualizações.
//
// Validação (fundo #faf8f3): todas as cores categóricas têm contraste >= 3,5:1,
// exceto "Outros" e "Indefinido", que são cinza de propósito, para ficarem em
// segundo plano. Em simulação de daltonismo, o par mais próximo é Japão/Índia
// (os dois menores atores); por isso as views rotulam as séries diretamente,
// sem depender só da cor.

export const COLORS = {
  accent: "#1d3557",
  highlight: "#d9622b",
  muted: "#5d6676",
  border: "#e2e0da",
};

// Atores (coluna `actor`), na ordem de volume total.
// Azul para EUA e vermelho para URSS ajudam no reconhecimento (convenção da
// Guerra Fria), mas em tons escuros e sóbrios, para não serem lidos como
// "bom" e "ruim".
export const ACTOR_ORDER = ["URSS/Rússia", "EUA", "China", "Europa", "Japão", "Índia", "Outros"];
export const ACTOR_COLORS = {
  "URSS/Rússia": "#a63a3a",
  EUA: "#0f5f9e",
  China: "#b5770d",
  Europa: "#2e7d4f",
  Japão: "#a3487f",
  Índia: "#00808a",
  Outros: "#b8b4aa",
};

// Setores (coluna `sector`). Comercial é a única cor quente, de propósito:
// é a história que queremos que salte aos olhos (a era comercial).
export const SECTOR_ORDER = ["Comercial", "Civil", "Militar", "Indefinido"];
export const SECTOR_COLORS = {
  Comercial: "#b5770d",
  Civil: "#0f5f9e",
  Militar: "#5e5a52",
  Indefinido: "#d6d2c8",
};

// Escala sequencial (mapa, intensidade): do creme ao acento, na mesma família
// de cores da interface.
export const SEQUENTIAL = ["#f1efe8", "#1d3557"];

// Resultado (coluna `outcome`): sem verde/vermelho (daltonismo); a diferença
// é carregada pelo símbolo e pelo preenchimento, não pela cor.
export const OUTCOME_MARKS = {
  sucesso: { symbol: "circle", fill: true },
  parcial: { symbol: "circle", fill: false },
  falha: { symbol: "cross", fill: true },
  explosao_solo: { symbol: "triangle", fill: false },
  aborto: { symbol: "triangle", fill: false },
};

// Linked highlighting: o item selecionado mantém a própria cor (com contorno
// no highlight) e os demais perdem opacidade, sem mudar de cor.
export const FADED_OPACITY = 0.25;

export function actorColor(actor) {
  return ACTOR_COLORS[actor] ?? ACTOR_COLORS.Outros;
}

export function sectorColor(sector) {
  return SECTOR_COLORS[sector] ?? SECTOR_COLORS.Indefinido;
}
