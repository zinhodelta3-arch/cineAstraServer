import { resolveApiBase } from './api-base.mjs';
const configured = resolveApiBase(process.env.NEXT_PUBLIC_API_URL);
export function apiUrl(path) { return `${configured}${path}`; }
export function publicAsset(value) {
  if (!value) return null;
  try {
    const base = new URL(configured, typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
    const url = new URL(value, base.origin);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
export function safeLink(value) {
  if (!value || /[\\\u0000-\u0020]/.test(value)) return null;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : null; } catch { return null; }
}
export async function publicGet(path, { signal } = {}) {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), 15000);
  try {
    const response = await fetch(apiUrl(path), { signal: signal ? AbortSignal.any([signal, timeout.signal]) : timeout.signal, cache: 'no-store', credentials: 'omit', headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('Não foi possível carregar os dados. Tente novamente.');
    const body = await response.json();
    if (body.success !== true || body.data == null) throw new Error('Resposta inválida do servidor.');
    return body.data;
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error('Não foi possível carregar os dados. Verifique sua conexão e tente novamente.');
  } finally { clearTimeout(timer); }
}
export function filmCard(film) {
  return { id: film.id_filme, title: film.titulo, synopsis: film.descricao || '', poster: publicAsset(film.imagem), image: publicAsset(film.imagem), duration: `${film.duracao} min`, rating: film.classificacao === 'L' ? 'Livre' : film.classificacao, age: film.classificacao === 'L' ? 'Livre' : film.classificacao, releaseDate: film.data_lancamento?.slice(0, 10) || null, release: film.data_lancamento ? new Date(`${film.data_lancamento.slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR') : 'Data a confirmar', trailerUrl: safeLink(film.trailer), sessions: [] };
}
