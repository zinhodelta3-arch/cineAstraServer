import { Film, Star, Play, Crown, Zap, Sparkles, Ticket, Users } from "lucide-react";

export const ACCENT = "text-secondary dark:text-primary";
export const TRAILER = "https://www.youtube.com/embed/dQw4w9WgXcQ";
export const STORAGE_KEY = "cineastra:perfil";

/* ============ DADOS (mesmos ids da home) ============ */
export const FILMS = [
  { id: "m1", title: "O Último Fotograma", genre: "Suspense", duration: "2h 08min", age: "14", match: 98, bg: ["#ece1dc", "#7c1029"] },
  { id: "m2", title: "Constelação Kira", genre: "Ficção Científica", duration: "2h 21min", age: "12", match: 96, bg: ["#3b1f5c", "#150a24"] },
  { id: "m3", title: "Maré Vermelha", genre: "Ação", duration: "2h 01min", age: "16", match: 92, bg: ["#971d00", "#2a0d05"] },
  { id: "m4", title: "Baile das Sombras", genre: "Terror", duration: "1h 54min", age: "16", match: 94, bg: ["#7c1029", "#1b0710"] },
  { id: "m5", title: "Sete Invernos", genre: "Drama", duration: "1h 58min", age: "12", match: 91, bg: ["#cfe3ee", "#2d4a63"] },
  { id: "m6", title: "O Segredo de Gaia", genre: "Animação", duration: "1h 38min", age: "Livre", match: 97, bg: ["#1f3d2b", "#0b1a11"] },
  { id: "m7", title: "Noite de Estreia", genre: "Comédia", duration: "1h 46min", age: "12", match: 88, bg: ["#971d00", "#2a0d05"] },
  { id: "m8", title: "Projeção Final", genre: "Suspense", duration: "2h 04min", age: "14", match: 90, bg: ["#353323", "#14130b"] },
  { id: "m9", title: "Fogo Cruzado", genre: "Ação", duration: "2h 09min", age: "16", match: 87, bg: ["#14130b", "#353323"] },
  { id: "m10", title: "Lua de Celuloide", genre: "Drama", duration: "2h 12min", age: "12", match: 93, bg: ["#1b2a49", "#0b1222"] },
  { id: "m11", title: "Último Trem para Aurora", genre: "Aventura", duration: "1h 59min", age: "12", match: 89, bg: ["#1f3d2b", "#0b1a11"] },
  { id: "m12", title: "A Casa dos Ecos", genre: "Terror", duration: "1h 47min", age: "16", match: 86, bg: ["#1b2a49", "#0b1222"] },
  { id: "m13", title: "Poeira de Ouro", genre: "Aventura", duration: "2h 15min", age: "14", match: 90, bg: ["#c8742c", "#4a1f08"] },
  { id: "m14", title: "Cidade de Vidro", genre: "Ficção Científica", duration: "2h 03min", age: "14", match: 91, bg: ["#0e3b43", "#061a1e"] },
];
export const byId = (ids) => ids.map((id) => FILMS.find((f) => f.id === id)).filter(Boolean);

export const CONTINUE = byId(["m3", "m8", "m5", "m14"]);
export const PROGRESS = { m3: 40, m8: 75, m5: 20, m14: 90 };
export const RECOMMENDED = byId(["m2", "m4", "m11", "m13", "m9", "m12"]);
export const INITIAL_LIST = ["m1", "m6", "m10"];
export const INITIAL_TRAILERS = [
  { id: "m1", when: "Hoje" },
  { id: "m2", when: "Há 2 dias" },
  { id: "m7", when: "Há 5 dias" },
  { id: "m9", when: "Semana passada" },
];

export const AVATARS = [
  { id: "film", icon: Film, from: "#971d00", to: "#2a0d05" },
  { id: "star", icon: Star, from: "#fad241", to: "#971d00" },
  { id: "crown", icon: Crown, from: "#7c1029", to: "#1b0710" },
  { id: "zap", icon: Zap, from: "#0e3b43", to: "#061a1e" },
  { id: "sparkles", icon: Sparkles, from: "#3b1f5c", to: "#150a24" },
  { id: "ticket", icon: Ticket, from: "#c8742c", to: "#4a1f08" },
  { id: "users", icon: Users, from: "#1f3d2b", to: "#0b1a11" },
  { id: "play", icon: Play, from: "#1b2a49", to: "#0b1222" },
];
