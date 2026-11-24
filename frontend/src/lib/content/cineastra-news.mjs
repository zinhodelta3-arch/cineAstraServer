export const newsPath = '/cinema/noticias';
export const articlePath = id => `${newsPath}#materia-n-${id}`;

export const newsCategories = ['Parcerias', 'Transmissões', 'Comunidade', 'Avisos'];

export const newsParagraphs = body => body.split(/\n\s*\n/).filter(Boolean);

const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = text => text.replace(/[&<>"']/g, char => entities[char]);

export function articleEmail(article, siteOrigin) {
  const parts = [article.resumo, ...newsParagraphs(article.corpo)];
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
