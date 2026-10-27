export const CATEGORIES = [
  { id: "todos", label: "Todos" },
  { id: "ofertas", label: "Ofertas" },
  { id: "combos", label: "Combos" },
  { id: "promocionais", label: "Promocionais" },
  { id: "pipocas", label: "Pipocas" },
  { id: "bebidas", label: "Bebidas" },
  { id: "doces", label: "Doces" },
]

// Contrato preparado para o catálogo que virá do backend.
// Exemplo futuro:
// { id, name, categoryId, description, price, image, badge }
export const U = (id, w = 1800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=88`

export const BANNERS = [
  {
    id: "banner-1",
    eyebrow: "AstraSnack • Pipocas",
    title: "Pipoca em primeiro plano.",
    description: "Quentinha, crocante e em quantidade de sobra para acompanhar a sessão inteira.",
    image: "https://static.wixstatic.com/media/af4e4c_e2bd4ced91e54b40a1c03c37da08d832~mv2.jpg/v1/fill/w_1600,h_900,al_c,q_90/af4e4c_e2bd4ced91e54b40a1c03c37da08d832~mv2.jpg",
  },
  {
    id: "banner-2",
    eyebrow: "AstraSnack • Bebidas",
    title: "Refri gelado para completar o filme.",
    description: "Uma bebida bem gelada, pipoca por perto e a sessão pronta para começar.",
    image: "https://www.tochinavi.net/img/kuchikomi/02/IMG01_a5f61d64d0824a3c41b70371c89b7b9ad9338a16.jpg",
  },
  {
    id: "banner-3",
    eyebrow: "AstraSnack • Doces",
    title: "Um pouco de cor entre uma cena e outra.",
    description: "Balas e guloseimas para deixar cada sessão ainda mais divertida.",
    image: U("photo-1770021999036-53291a3a6596"),
  },
  {
    id: "banner-4",
    eyebrow: "AstraSnack • Combo CineAstra",
    title: "Pipoca, bebida e chocolate. Do jeitinho CineAstra.",
    description: "Um combo completo para levar para a poltrona: pipoca, bebida e doces para compartilhar.",
    image: "/astrasnack/cineastra-combo.webp",
  },
  {
    id: "banner-5",
    eyebrow: "AstraSnack • Combo Clássico",
    title: "Seu combo de cinema, com a cara do CineAstra.",
    description: "Pipoca, bebida e chocolate juntos para deixar a sessão ainda mais gostosa.",
    image: "/astrasnack/cineastra-combo-classico.webp",
  },
]

// Apenas um item real para validar a experiência de produto/drawer.
// O restante do catálogo será entregue pelo backend posteriormente.
export const PRODUCTS = [
  {
    id: "c-1",
    name: "Combo CineAstra Supreme",
    categoryId: "combos",
    category: "Combos",
    description: "1 Pipoca Balde Especial + 2 Refrigerantes 1L + 1 M&M's Gigante.",
    price: 52.9,
    image: U("photo-1585647347384-2593bc35786b", 1200),
    badge: "Mais vendido",
  },
]

export const SECTIONS = [
  { id: "ofertas", title: "Ofertas", tone: "cyan", count: 5 },
  { id: "combos", title: "Combos", tone: "lilac", count: 5 },
  { id: "promocionais", title: "Produtos promocionais", tone: "yellow", count: 4 },
]
