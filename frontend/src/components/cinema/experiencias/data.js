import { CalendarDays, Film, Users, CarFront, Trees, Sparkles, Projector } from "lucide-react"

export const U = (id, w = 1400, h = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&crop=entropy&w=${w}&h=${h}&q=85`

export const EXPERIENCES = [
  {
    id: "sala-privativa",
    number: "01",
    eyebrow: "Sua sessão. Suas regras.",
    title: "Uma sala só sua",
    short: "Alugue uma sala de cinema inteira para transformar seu evento em uma estreia inesquecível.",
    description: "Reúna sua turma em uma tela gigante, com som imersivo e conforto de cinema. Ideal para aniversários, festas escolares, encontros de família, palestras, treinamentos, eventos corporativos e sessões exclusivas.",
    image: U("photo-1489599849927-2ee91cede3ba", 1600, 1050),
    price: "R$ 790",
    unit: "por sessão / pacote inicial",
    icon: Film,
    tag: "Mais versátil",
    details: ["Aniversários e comemorações", "Festinhas e passeios escolares", "Eventos de empresas e palestras", "Sessões privadas de filmes"],
  },
  {
    id: "ceu-aberto",
    number: "02",
    eyebrow: "Cinema sob as estrelas",
    title: "Cinema a céu aberto",
    short: "Uma sessão ao ar livre, com clima de festival e aquele encanto de assistir a um filme sob o céu.",
    description: "Levamos a magia do cinema para parques, jardins, pátios e espaços abertos. Uma experiência acolhedora para eventos culturais, encontros comunitários, escolas, empresas e celebrações especiais.",
    image: U("photo-1500530855697-b586d89ba3ee", 1600, 1050),
    price: "R$ 1.490",
    unit: "por evento / estrutura inicial",
    icon: Trees,
    tag: "Ao ar livre",
    details: ["Eventos em parques e jardins", "Sessões comunitárias e culturais", "Encontros escolares e familiares", "Eventos de marcas e empresas"],
  },
  {
    id: "drive-in",
    number: "03",
    eyebrow: "Conforto no seu carro",
    title: "Cinema drive-in",
    short: "Curta um clássico ou um lançamento especial sem sair do carro, com uma tela gigante à sua frente.",
    description: "Uma experiência nostálgica e diferente, perfeita para encontros, eventos temáticos, ações de marca e noites especiais. A estrutura é planejada conforme o local, a quantidade de veículos e as necessidades do evento.",
    image: U("photo-1519608487953-e999c86e7455", 1600, 1050),
    price: "R$ 1.990",
    unit: "por evento / estrutura inicial",
    icon: CarFront,
    tag: "Experiência especial",
    details: ["Noites temáticas e encontros", "Eventos corporativos e de marca", "Sessões para grupos e comunidades", "Programações especiais para famílias"],
  },
]

export const BENEFITS = [
  { icon: Projector, title: "Imagem e som de cinema", text: "Estrutura audiovisual pensada para valorizar cada cena." },
  { icon: Users, title: "Feito para o seu grupo", text: "Planejamento de acordo com o público e o formato do evento." },
  { icon: CalendarDays, title: "Planejamento com você", text: "Alinhamos data, local, duração e necessidades antes da confirmação." },
  { icon: Sparkles, title: "Uma experiência memorável", text: "Mais do que assistir a um filme: criar uma lembrança juntos." },
]

export const TESTIMONIALS = [
  { name: "Organização de evento escolar", type: "Sala privativa", quote: "Uma proposta diferente para reunir a turma e transformar o passeio em uma ocasião especial.", rating: 5 },
  { name: "Equipe de eventos corporativos", type: "Sessão exclusiva", quote: "O formato de sessão privada é uma alternativa interessante para apresentações e encontros de equipe.", rating: 5 },
  { name: "Produção de evento ao ar livre", type: "Cinema a céu aberto", quote: "A combinação de filme, espaço aberto e convivência deixa o evento com uma atmosfera muito própria.", rating: 5 },
]
