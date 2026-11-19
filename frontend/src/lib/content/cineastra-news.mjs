export const EVENTO = {
  filme: "Vingadores: Doomsday",
  local: "Parque Linear de São Caetano do Sul",
  data: "Sáb, 14 Nov",   // ← CONFIRMAR
  abertura: "18:00",     // ← CONFIRMAR
  inicio: "19:30",       // ← CONFIRMAR
  entrada: "Gratuita",   // ← CONFIRMAR
};

export const newsPath = '/cinema/noticias';
export const articlePath = id => `${newsPath}#materia-${id}`;

export const artigosCineAstra = [
  {
    id: "n-1",
    categoria: "Parcerias",
    data: "22 Out 2026",
    leitura: "3 min",
    icone: 'Trees',
    titulo: "CineAstra firma parceria com o Parque Linear de São Caetano do Sul",
    resumo: "Acordo vai levar cinema, cultura e lazer para dentro do parque, aproximando a telona de quem vive e frequenta a cidade.",
    corpo: [
      "O CineAstra anuncia uma parceria com o Parque Linear de São Caetano do Sul. A iniciativa nasce com o objetivo de levar atividades de cinema e cultura para um dos espaços de convivência da cidade.",
      "A primeira ação conjunta será a exibição ao ar livre de Vingadores: Doomsday, aberta à comunidade. Novas atividades poderão ser anunciadas conforme a parceria avançar.",
      "Acompanhe este mural: todas as novidades, mudanças de programação e orientações ao público serão publicadas aqui em primeira mão.",
    ],
  },
  {
    id: "n-2",
    categoria: "Transmissões",
    data: "22 Out 2026",
    leitura: "4 min",
    icone: 'Clapperboard',
    titulo: `${EVENTO.filme} será exibido ao ar livre no parque`,
    resumo: `Sessão especial no ${EVENTO.local}. Leve cadeira, manta e a vizinhança toda.`,
    corpo: [
      `A transmissão de ${EVENTO.filme} acontecerá no ${EVENTO.local}, com tela montada ao ar livre e a estrutura de som do CineAstra.`,
      `Os portões abrem às ${EVENTO.abertura} e a sessão começa às ${EVENTO.inicio}. Entrada: ${EVENTO.entrada.toLowerCase()}. Recomendamos chegar com antecedência para escolher bem o lugar no gramado.`,
      "Haverá bomboniere no local, com pipoca e bebidas. Em caso de chuva ou qualquer mudança, o novo plano será divulgado neste mural e nas redes do CineAstra.",
    ],
    destaque: true,
  },
  {
    id: "n-3",
    categoria: "Parcerias",
    data: "Em andamento",
    leitura: "2 min",
    icone: 'Theater',
    titulo: "CineAstra conversa com teatros e cinemas da região",
    resumo: "Objetivo é montar uma rede cultural local, com programação conjunta e benefícios entre parceiros.",
    corpo: [
      "Além do Parque Linear, o CineAstra está em conversas com teatros e cinemas da região para formar uma rede cultural integrada.",
      "A ideia é compartilhar programação, criar sessões especiais e oferecer vantagens ao público que circula entre os espaços parceiros.",
      "Os nomes serão divulgados assim que as parcerias forem confirmadas.",
    ],
  },
  {
    id: "n-4",
    categoria: "Avisos",
    data: "Antes do evento",
    leitura: "2 min",
    icone: 'Info',
    titulo: "Guia do público: o que levar e o que esperar da sessão ao ar livre",
    resumo: "Chegada, bomboniere, clima e acessibilidade: tudo o que você precisa saber antes de ir.",
    corpo: [
      "Leve cadeira de praia, manta ou almofada e, se quiser, um agasalho: à noite a temperatura costuma cair.",
      "A bomboniere do CineAstra estará no local. Confira as orientações do parque sobre alimentos e bebidas trazidos de casa.",
      "Dúvidas sobre acessibilidade ou acesso ao local? Fale com a gente pelo cadastro de avisos no fim da página.",
    ],
  },
  {
    id: "n-5",
    categoria: "Comunidade",
    data: "Contínuo",
    leitura: "1 min",
    icone: 'Users',
    titulo: "Seu bairro, sua sessão: indique filmes para as próximas exibições",
    resumo: "Queremos ouvir a comunidade para escolher os próximos títulos e locais.",
    corpo: [
      "O CineAstra quer que a programação ao ar livre reflita o que a comunidade gosta de assistir.",
      "Envie sua sugestão de filme ou de local pelo cadastro de contato no fim da página. As ideias mais pedidas entram na curadoria das próximas sessões.",
    ],
  },
];

const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = text => text.replace(/[&<>"']/g, char => entities[char]);

export function articleEmail(article, siteOrigin) {
  const parts = [article.resumo, ...article.corpo];
  const origin = URL.parse(siteOrigin ?? '');
  const link = origin?.protocol === 'https:' && !origin.username && !origin.password
    ? new URL(articlePath(article.id), origin).href : null;

  return {
    subject: article.titulo,
    html: [`<h2>${escapeHtml(article.titulo)}</h2>`, ...parts.map(part => `<p>${escapeHtml(part)}</p>`),
      ...(link ? [`<p><a href="${escapeHtml(link)}">Ler no CineAstraNews</a></p>`] : [])].join('\n'),
    text: [article.titulo, ...parts, ...(link ? [`Ler no CineAstraNews: ${link}`] : [])].join('\n\n')
  };
}
