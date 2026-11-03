export function normalizeSearch(value = "") {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

export function searchStreamingFilms(catalog, query, { titleOnly = false } = {}) {
  const term = normalizeSearch(query);
  if (!term) return [];
  const words = term.split(/\s+/);
  return catalog.map((movie) => {
    const title = normalizeSearch(movie.title);
    const text = titleOnly ? title : normalizeSearch(`${movie.title} ${movie.genre} ${movie.director || ""}`);
    const score = title === term ? 0 : title.startsWith(term) ? 1 : title.includes(term) ? 2 : 3;
    return { movie, score, matches: words.every((word) => text.includes(word)) };
  }).filter((item) => item.matches)
    .sort((a, b) => a.score - b.score || a.movie.title.localeCompare(b.movie.title, "pt-BR"))
    .map((item) => item.movie);
}
