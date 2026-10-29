// Motor do AstraSpin: sem React, só funções puras (fácil de testar).
// Trabalha com "entradas" normalizadas do catálogo; o filme original fica em entry.movie.

/* ------------------------------------------------------------------ */
/* Configuração                                                        */
/* ------------------------------------------------------------------ */

export const MODES = [
  { id: "custom", label: "Do meu jeito", hint: "Escolha humor, gênero, tempo e companhia. A roleta decide o resto." },
  { id: "surprise", label: "Me surpreenda", hint: "Sem filtros. Qualquer filme do catálogo pode sair." },
  { id: "comfort", label: "Sair da zona de conforto", hint: "Um filme de um gênero que você quase não assiste." },
  { id: "today", label: "Perfeito para hoje", hint: "A roleta lê o dia da semana e o horário e escolhe pelo momento." },
  { id: "friends", label: "Filmes dos amigos", hint: "Sorteia entre os filmes que seus amigos curtiram." },
];

// keys: trechos de gêneros normalizados (sem acento, minúsculos)
export const MOODS = [
  { id: "relax", label: "Relaxar", keys: ["comedia", "animacao", "familia", "aventura", "romance", "musical", "fantasia"] },
  { id: "laugh", label: "Rir", keys: ["comedia", "animacao"] },
  { id: "feel", label: "Sentir", keys: ["drama", "romance", "biografia"] },
  { id: "thrill", label: "Adrenalina", keys: ["acao", "suspense", "thriller", "crime", "guerra", "aventura"] },
  { id: "think", label: "Pensar", keys: ["ficcao", "misterio", "documentario", "drama", "suspense"] },
  { id: "scare", label: "Sentir medo", keys: ["terror", "horror", "suspense"] },
];

export const TIMES = [
  { id: "any", label: "Sem limite", max: Infinity },
  { id: "90", label: "Até 1h30", max: 90 },
  { id: "120", label: "Até 2h", max: 120 },
  { id: "150", label: "Até 2h30", max: 150 },
];

export const COMPANIES = [
  { id: "alone", label: "Sozinho(a)", boost: ["drama", "suspense", "ficcao", "misterio", "documentario"], avoid: [], reason: "Bom para ver sozinho(a)" },
  { id: "couple", label: "A dois", boost: ["romance", "comedia", "drama"], avoid: [], reason: "Bom para ver a dois" },
  { id: "family", label: "Em família", boost: ["animacao", "familia", "aventura", "comedia", "fantasia"], avoid: ["terror", "horror", "crime", "guerra"], maxAge: 12, reason: "Seguro para a família" },
  { id: "friends", label: "Com amigos", boost: ["comedia", "acao", "terror", "aventura"], avoid: [], reason: "Pede companhia e pipoca" },
];

// SUBSTITUA por dados reais da API de amigos (cada amigo: { id, name, likes: [ids de filmes] }).
// Enquanto isso, os gostos são gerados de forma determinística a partir do catálogo.
export const FRIENDS_MOCK = [
  { id: "ana", name: "Ana", seed: 7 },
  { id: "caio", name: "Caio", seed: 13 },
  { id: "bia", name: "Bia", seed: 29 },
  { id: "leo", name: "Leo", seed: 41 },
];

export const STRIP_LENGTH = 46;
export const WINNER_INDEX = 38;

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

export const norm = (s) =>
  String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

export function hash(str) {
  let h = 2166136261;
  for (const ch of String(str)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function formatMinutes(min) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

const joinNames = (names) =>
  names.length <= 1 ? names[0] ?? "" : `${names.slice(0, -1).join(", ")} e ${names[names.length - 1]}`;

export function parseMinutes(v) {
  if (v == null) return null;
  if (typeof v === "number") return v > 0 ? v : null;
  const s = String(v).toLowerCase();
  const h = s.match(/(\d+)\s*h/);
  const m = s.match(/(\d+)\s*m/);
  if (h || m) return (h ? Number(h[1]) * 60 : 0) + (m ? Number(m[1]) : 0);
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseAge(m) {
  const v = m.age ?? m.ageRating ?? m.classification ?? m.maturity;
  if (v == null) return null;
  const s = String(v).trim().toLowerCase();
  if (s === "l" || s === "livre") return 0;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
}

function pickPoster(m) {
  for (const k of ["poster", "posterUrl", "image", "img", "cover", "thumb", "thumbnail", "backdrop"]) {
    if (typeof m[k] === "string" && m[k]) return m[k];
  }
  return null;
}

function toEntry(m) {
  const g = m.genre ?? m.genres ?? m.category;
  const genreLabels = (Array.isArray(g) ? g : String(g ?? "").split(/[,/|·]/))
    .map((s) => String(s).trim())
    .filter(Boolean);
  return {
    id: String(m.id),
    movie: m,
    title: m.title ?? m.name ?? "Filme",
    poster: pickPoster(m),
    year: m.year ?? m.releaseYear ?? null,
    genreLabels,
    genres: genreLabels.map(norm),
    minutes: parseMinutes(m.duration ?? m.runtime ?? m.length ?? m.minutes),
    age: parseAge(m),
    rating: Number(m.rating ?? m.score),
  };
}

// Junta várias listas, remove duplicados por id e normaliza.
export function buildCatalog(...lists) {
  const map = new Map();
  lists.flat().forEach((m) => {
    if (!m || m.id == null || map.has(String(m.id))) return;
    map.set(String(m.id), toEntry(m));
  });
  return [...map.values()];
}

export function buildFriends(catalog, base = FRIENDS_MOCK) {
  return base.map((f) => ({
    ...f,
    likes: new Set(
      f.likes
        ? f.likes.map(String)
        : catalog.filter((e) => hash(`${f.seed}:${e.id}`) % 100 < 38).map((e) => e.id)
    ),
  }));
}

function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Fita de pôsteres da roleta: o vencedor fica na posição WINNER_INDEX.
export function buildStrip(catalog, winner, rng = Math.random) {
  const others = catalog.filter((e) => e.id !== winner.id);
  let pool = shuffle(others, rng);
  let i = 0;
  return Array.from({ length: STRIP_LENGTH }, (_, k) => {
    if (k === WINNER_INDEX || !others.length) return winner;
    if (i >= pool.length) {
      pool = shuffle(others, rng);
      i = 0;
    }
    return pool[i++];
  });
}

/* ------------------------------------------------------------------ */
/* Contexto de "hoje"                                                  */
/* ------------------------------------------------------------------ */

const DAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

export function getTonightContext(now = new Date()) {
  const d = now.getDay();
  const h = now.getHours();
  if (d === 5 && h >= 18) return { mood: "laugh", maxMin: 150, headline: "Sexta à noite pede risada", detail: "Algo para rir, sem pressa: até 2h30." };
  if (d === 6 && h >= 18) return { mood: "thrill", maxMin: 160, headline: "Sábado à noite pede adrenalina", detail: "Ação e tensão em até 2h40." };
  if (d === 0) return { mood: "relax", maxMin: 140, headline: "Domingo pede algo leve", detail: "Um filme tranquilo de até 2h20." };
  if (h >= 21 || h < 5) return { mood: "relax", maxMin: 100, headline: `${DAYS[d]} já é tarde`, detail: "Algo leve e curto, de até 1h40." };
  if (h >= 18) return { mood: "feel", maxMin: 130, headline: `Noite de ${DAYS[d].toLowerCase()}`, detail: "Algo para sentir, de até 2h10." };
  return { mood: "laugh", maxMin: 120, headline: "Uma pausa no dia", detail: "Algo animado de até 2h." };
}

/* ------------------------------------------------------------------ */
/* Critérios, filtros e pontuação                                      */
/* ------------------------------------------------------------------ */

const hasAny = (genres, keys) => genres.some((g) => keys.some((k) => g.includes(k)));
const getMood = (id) => MOODS.find((m) => m.id === id) ?? null;

function tasteFreq(catalog, cfg) {
  const seen = new Set([...(cfg.historyIds ?? []), ...(cfg.myListIds ?? [])].map(String));
  const freq = new Map();
  catalog.forEach((e) => {
    if (seen.has(e.id)) e.genres.forEach((g) => freq.set(g, (freq.get(g) ?? 0) + 1));
  });
  return freq;
}

function buildCriteria(catalog, cfg) {
  const c = { mood: null, genre: null, genreLabel: "", maxMin: Infinity, company: null, likedBy: null, outside: null, context: null };
  const time = TIMES.find((t) => t.id === cfg.time) ?? TIMES[0];

  switch (cfg.mode) {
    case "surprise":
      break;
    case "comfort": {
      c.maxMin = time.max;
      const freq = tasteFreq(catalog, cfg);
      const top = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([g]) => g);
      if (top.length) c.outside = { freq, comfort: new Set(top) };
      break;
    }
    case "today": {
      const ctx = getTonightContext(cfg.now);
      c.context = ctx;
      c.mood = getMood(ctx.mood);
      c.maxMin = ctx.maxMin;
      break;
    }
    case "friends": {
      c.maxMin = time.max;
      c.likedBy = new Map();
      (cfg.friends ?? []).forEach((f) =>
        f.likes.forEach((id) => {
          if (!c.likedBy.has(id)) c.likedBy.set(id, []);
          c.likedBy.get(id).push(f.name);
        })
      );
      break;
    }
    default: {
      c.mood = getMood(cfg.mood);
      c.genre = cfg.genre ? norm(cfg.genre) : null;
      c.genreLabel = cfg.genre ?? "";
      c.maxMin = time.max;
      c.company = COMPANIES.find((x) => x.id === cfg.company) ?? null;
    }
  }
  return c;
}

// Se nada encaixa, a roleta afrouxa critérios nesta ordem e avisa o usuário.
const RELAX_STEPS = [[], ["time"], ["time", "company"], ["time", "company", "genre"], ["time", "company", "genre", "mood"]];
const RELAX_LABEL = { time: "o tempo", company: "a companhia", genre: "o gênero", mood: "o humor" };

function passes(e, c, drop) {
  const off = (k) => drop.includes(k);
  if (!off("time") && Number.isFinite(c.maxMin) && e.minutes != null && e.minutes > c.maxMin) return false;
  if (!off("genre") && c.genre && !e.genres.some((g) => g.includes(c.genre))) return false;
  if (!off("genre") && c.outside && e.genres.some((g) => c.outside.comfort.has(g))) return false;
  if (!off("company") && c.company) {
    if (c.company.avoid.length && hasAny(e.genres, c.company.avoid)) return false;
    if (c.company.maxAge != null && e.age != null && e.age > c.company.maxAge) return false;
  }
  if (!off("mood") && c.mood && !hasAny(e.genres, c.mood.keys)) return false;
  if (c.likedBy && !c.likedBy.has(e.id)) return false; // amigos nunca é afrouxado
  return true;
}

function weigh(e, c, x) {
  let w = 1;
  if (c.mood && hasAny(e.genres, c.mood.keys)) w *= 5;
  if (c.company && hasAny(e.genres, c.company.boost)) w *= 2;
  if (c.likedBy) w *= 1 + (c.likedBy.get(e.id)?.length ?? 0) * 1.5;
  if (c.outside && e.genres.length) {
    const avg = e.genres.reduce((s, g) => s + (c.outside.freq.get(g) ?? 0), 0) / e.genres.length;
    w *= 1 / (1 + avg);
  }
  if (x.history.has(e.id) && !c.likedBy) w *= 0.25; // evita repetir o que já foi visto
  if (x.myList.has(e.id) && !c.outside) w *= 2; // dá preferência ao que já está na lista
  if (Number.isFinite(e.rating) && e.rating <= 10) w *= 1 + Math.max(0, e.rating - 6) * 0.15;
  return w;
}

function weightedPick(items, getW, rng) {
  const ws = items.map(getW);
  let r = rng() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) {
    r -= ws[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function rarestGenreLabel(e, freq) {
  let best = 0;
  e.genres.forEach((g, i) => {
    if ((freq.get(g) ?? 0) < (freq.get(e.genres[best]) ?? 0)) best = i;
  });
  return e.genreLabels[best] ?? "esse gênero";
}

function explain(e, c, extra) {
  const out = [];
  if (c.mood) out.push({ ok: hasAny(e.genres, c.mood.keys), label: `Combina com “${c.mood.label}”` });
  if (c.genre) out.push({ ok: e.genres.some((g) => g.includes(c.genre)), label: c.genreLabel });
  if (Number.isFinite(c.maxMin)) out.push({ ok: e.minutes == null || e.minutes <= c.maxMin, label: `Cabe em até ${formatMinutes(c.maxMin)}` });
  if (c.company) {
    const strict = c.company.avoid.length > 0 || c.company.maxAge != null; // ex.: família
    const safe =
      !hasAny(e.genres, c.company.avoid) && !(c.company.maxAge != null && e.age != null && e.age > c.company.maxAge);
    out.push({ ok: strict ? safe : hasAny(e.genres, c.company.boost), label: c.company.reason });
  }
  if (c.likedBy) {
    const names = c.likedBy.get(e.id) ?? [];
    out.push({ ok: names.length > 0, label: `Curtido por ${joinNames(names)}` });
  }
  if (c.outside) out.push({ ok: true, label: `Você quase não assiste ${rarestGenreLabel(e, c.outside.freq)}` });
  if (extra.inMyList) out.push({ ok: true, bonus: true, label: "Estava na sua lista" });
  return out;
}

/* ------------------------------------------------------------------ */
/* Sorteio                                                             */
/* ------------------------------------------------------------------ */

// cfg: { mode, mood, genre, time, company, friends, now, historyIds, myListIds, exclude:Set }
// Retorna { entry, reasons, fit, relaxed, context, poolSize } ou null.
export function pickMovie(catalog, cfg, rng = Math.random) {
  const base = catalog.filter((e) => !cfg.exclude?.has(e.id));
  const c = buildCriteria(catalog, cfg);
  const x = { history: new Set((cfg.historyIds ?? []).map(String)), myList: new Set((cfg.myListIds ?? []).map(String)) };

  for (const drop of RELAX_STEPS) {
    const pool = base.filter((e) => passes(e, c, drop));
    if (!pool.length) continue;
    const entry = weightedPick(pool, (e) => weigh(e, c, x), rng);
    const reasons = explain(entry, c, { inMyList: x.myList.has(entry.id) });
    const scored = reasons.filter((r) => !r.bonus);
    const fit = scored.length ? Math.round((100 * scored.filter((r) => r.ok).length) / scored.length) : null;
    return { entry, reasons, fit, relaxed: drop.map((d) => RELAX_LABEL[d]), context: c.context, poolSize: pool.length };
  }
  return null;
}