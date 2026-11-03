import { publicAsset, publicGet, safeLink } from "./public-api.mjs";

export async function streamingRequest(path, { method = "GET", body, signal, keepalive = false } = {}) {
  const response = await fetch(`/api/streaming${path}`, { method, credentials: "same-origin", cache: "no-store", signal, keepalive, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.message || "Não foi possível acessar o streaming.");
    error.status = response.status;
    error.code = data?.code;
    throw error;
  }
  return data;
}

async function allPages(path, { privateRoute = false, signal } = {}) {
  const items = [];
  let cursor = null;
  do {
    const separator = path.includes("?") ? "&" : "?";
    const url = `${path}${separator}limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
    const data = privateRoute ? await streamingRequest(url, { signal }) : await publicGet(url, { signal });
    if (!Array.isArray(data?.items) || !data.pagination) throw new Error("Resposta inválida ao carregar o catálogo.");
    items.push(...data.items);
    const next = data.pagination.nextCursor;
    if (next && next === cursor) throw new Error("Paginação inválida do catálogo.");
    cursor = next;
  } while (cursor);
  return items;
}

export async function loadStreamingFilms(signal, genreId) {
  const films = await allPages(`/films?streaming=true${genreId ? `&genreId=${encodeURIComponent(genreId)}` : ""}`, { signal });
  if (films.every((film) => Array.isArray(film.generos))) return films;
  return Promise.all(films.map(async (film) => {
    if (Array.isArray(film.generos)) return film;
    const genres = await allPages(`/films/${film.id_filme}/genres`, { signal });
    return { ...film, generos: genres.map((item) => ({ id: item.id_genero, nome: item.nome })) };
  }));
}
export const loadStreamingGenres = (signal) => allPages("/genres", { signal });
export const loadProfileItems = (profileId, kind, signal) => allPages(`/profiles/${profileId}/${kind}`, { privateRoute: true, signal });
export const loadMyAccesses = (signal) => allPages("/my-accesses", { privateRoute: true, signal });

export function streamingMovie(film) {
  const date = film.data_lancamento?.slice(0, 10) || null;
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const image = publicAsset(film.imagem);
  const duration = Number(film.duracao);
  return {
    id: String(film.id_filme), title: film.titulo, synopsis: film.descricao || "Sinopse ainda não informada.",
    poster: image, thumb: publicAsset(film.banner) || image, backdrop: publicAsset(film.banner) || image, trailerUrl: safeLink(film.trailer),
    genre: Array.isArray(film.generos) && film.generos.length ? film.generos.map((item) => item.nome).join(" · ") : "Filme",
    genreIds: Array.isArray(film.generos) ? film.generos.map((item) => String(item.id)) : [],
    duration: Number.isFinite(duration) && duration > 0 ? `${Math.floor(duration / 60)}h ${String(duration % 60).padStart(2, "0")}min` : "Duração a confirmar",
    durationSeconds: Number.isFinite(duration) ? duration * 60 : 0,
    age: film.classificacao === "L" ? "Livre" : film.classificacao,
    genres: Array.isArray(film.generos) ? film.generos : [],
    hasArtwork: Boolean(film.banner),
    director: film.diretor || null, soon: Boolean(date && date > today),
    pal: Number(film.id_filme) % 12, motif: "reel", releaseDate: date,
  };
}
