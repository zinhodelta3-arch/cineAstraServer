export const APPEARANCE_STORAGE_KEY = "cineastra-appearance"
export const DEFAULT_APPEARANCE = "cineastra"

export const appearances = [
  {
    value: "cineastra",
    label: "CineAstra",
    description: "Tema original",
    preview: ["#7C1029", "#FAD241", "#353323"],
  },
  {
    value: "violet-bloom",
    label: "Violet Bloom",
    description: "tweakcn",
    preview: ["#7033ff", "#e2ebff", "#1a1b1e"],
  },
  {
    value: "mocha-mousse",
    label: "Mocha Mousse",
    description: "tweakcn",
    preview: ["#a37764", "#e4c7b8", "#2d2521"],
  },
  {
    value: "catppucin",
    label: "Catppuccin",
    description: "Tema pastel",
    preview: ["#8839ef", "#04a5e5", "#181825"],
  },
  {
    value: "doomsday",
    label: "Doomsday",
    description: "tweakcn",
    preview: ["#15803d", "#121a16", "#cbd5e1"],
  },
  {
    value: "noir",
    label: "Noir",
    description: "Cinema clássico, preto e marfim",
    preview: ["#080808", "#686868", "#F4F0E8"],
  },
  {
    value: "noir-grafico",
    label: "Noir Gráfico",
    description: "Preto, marfim e vermelho-sangue",
    preview: ["#080808", "#F2F0EB", "#A00018"],
  },
  {"value": "homem-aranha", "label": "Homem-Aranha", "description": "Vermelho heroico e azul de Nova York · 2026", "preview": ["#f56876", "#173d78", "#090f1e"]},
  {"value": "odisseia", "label": "A Odisseia", "description": "Mar Egeu, bronze e pergaminho · 2026", "preview": ["#dfb775", "#184b5c", "#101c23"]},
  {"value": "mario-galaxy", "label": "Super Mario Galaxy", "description": "Azul cósmico, estrelas e violeta · 2026", "preview": ["#65d7ef", "#8f265f", "#0e102a"]},
  {"value": "toy-story-5", "label": "Toy Story 5", "description": "Azul de brinquedo e amarelo de aventura · 2026", "preview": ["#f2ca55", "#706000", "#101d29"]},
  {"value": "mandalorian-grogu", "label": "The Mandalorian e Grogu", "description": "Verde de Grogu, aço e areia · 2026", "preview": ["#a8c18d", "#6b5140", "#101916"]},
  {"value": "moana", "label": "Moana", "description": "Oceano turquesa, coral e areia · 2026", "preview": ["#5dd7cb", "#9e4227", "#08272e"]},
  {"value": "devoradores-estrelas", "label": "Devoradores de Estrelas", "description": "Âmbar solar e profundezas do espaço · 2026", "preview": ["#f4b56a", "#165b68", "#0b1d25"]},
  {"value": "supergirl", "label": "Supergirl", "description": "Azul kryptoniano, vermelho e luz solar · 2026", "preview": ["#f5ce67", "#b62032", "#10172d"]},
  {"value": "mestres-universo", "label": "Mestres do Universo", "description": "Eternia em ametista e verde místico · 2026", "preview": ["#b4f0e2", "#17686e", "#191024"]},
  {"value": "panico-7", "label": "Pânico 7", "description": "Preto, marfim e vermelho de suspense · 2026", "preview": ["#ff788e", "#25252b", "#111014"]},

  {
    "value": "ultimato",
    "label": "Vingadores: Ultimato",
    "description": "Roxo cósmico e ouro da última batalha",
    "preview": [
      "#d3b4f5",
      "#805818",
      "#160f24"
    ]
  },
  {
    "value": "castelo-infinito",
    "label": "Demon Slayer: Castelo Infinito",
    "description": "Lanternas âmbar, madeira escura e carmesim",
    "preview": [
      "#efbd74",
      "#765016",
      "#1a1112"
    ]
  },
  {
    "value": "era-ultron",
    "label": "Vingadores: Era de Ultron",
    "description": "Aço industrial e vermelho de Ultron",
    "preview": [
      "#ff7a81",
      "#3e5265",
      "#101418"
    ]
  },
  {
    "value": "guerra-infinita",
    "label": "Vingadores: Guerra Infinita",
    "description": "Pôr do sol de Titã e ametista",
    "preview": [
      "#ffb36a",
      "#66358a",
      "#211125"
    ]
  },
  {
    "value": "chainsaw-reze",
    "label": "Chainsaw Man: Arco da Reze",
    "description": "Verde noturno, rosa e neon explosivo",
    "preview": [
      "#f29dbf",
      "#245d46",
      "#101c19"
    ]
  },
  {
    "value": "interestelar",
    "label": "Interestelar",
    "description": "Gelo, espaço profundo e cobre",
    "preview": [
      "#a6cfdf",
      "#81532d",
      "#10191f"
    ]
  },
  {
    "value": "retorno-rei",
    "label": "O Senhor dos Anéis: O Retorno do Rei",
    "description": "Floresta da Terra-média e ouro antigo",
    "preview": [
      "#dbc57c",
      "#80591d",
      "#131c15"
    ]
  },
  {
    "value": "cavaleiro-trevas",
    "label": "Batman: O Cavaleiro das Trevas",
    "description": "Gotham em azul de aço e ouro discreto",
    "preview": [
      "#8db8d2",
      "#83612b",
      "#0c121b"
    ]
  },
  {
    "value": "atraves-aranhaverso",
    "label": "Homem-Aranha: Através do Aranhaverso",
    "description": "Magenta elétrico, ciano e tinta azul",
    "preview": [
      "#fc8bc8",
      "#125c81",
      "#180d2c"
    ]
  },
  {
    "value": "viagem-chihiro",
    "label": "A Viagem de Chihiro",
    "description": "Vermelho da casa de banhos e verde jade",
    "preview": [
      "#f3b4a2",
      "#2e6753",
      "#17231f"
    ]
  },

]

export const appearanceValues = appearances.map(({ value }) => value)

export function isAppearance(value) {
  return appearanceValues.includes(value)
}

export function isNoirAppearance(value) {
  return value === "noir" || value === "noir-grafico"
}
