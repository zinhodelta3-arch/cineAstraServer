import { Car, Accessibility, Popcorn, Armchair, Tv2, Volume2, Crown, Landmark, Train } from "lucide-react";

export const U = (id, w, h) => `https://images.unsplash.com/${id}?auto=format&fit=crop&crop=entropy&w=${w}&h=${h}&q=80`;
export const venuePhoto = (id) => U(id, 1400, 700);
export const posterImg = (id) => U(id, 300, 450);

export const MOVIES = {
  "m-1": { title: "Se Eu Fosse Você 3", genre: "Comédia", age: "10", duration: "90m", poster: posterImg("photo-1485846234645-a62644f84728") },
  "m-2": { title: "Verity", genre: "Suspense", age: "16", duration: "120m", poster: posterImg("photo-1478720568477-152d9b164e26") },
  "m-3": { title: "Outra Mamãe", genre: "Terror", age: "18", duration: "95m", poster: posterImg("photo-1497032205916-ac775f0649ae") },
  "m-4": { title: "Minha Melhor Amiga", genre: "Comédia", age: "12", duration: "120m", poster: posterImg("photo-1500530855697-b586d89ba3ee") },
  "m-5": { title: "As Aventuras de Tadeo e a Lâmpada Mágica", genre: "Animação", age: "10", duration: "95m", poster: posterImg("photo-1534447677768-be436bb09401") },
  "m-6": { title: "Constelação Kira", genre: "Ficção Científica", age: "12", duration: "141m", poster: posterImg("photo-1440404653325-ab127d49abc1") },
  "m-7": { title: "Maré Vermelha", genre: "Ação", age: "16", duration: "121m", poster: posterImg("photo-1518709268805-4e9042af9f23") },
  "m-8": { title: "O Último Fotograma", genre: "Drama", age: "14", duration: "128m", poster: posterImg("photo-1478720568477-152d9b164e26") },
};

/* kind: "marquee" (fachada com letreiro) | "curtain" (teatro) | "screen" (sala de projeção)
   schedule: { idDoFilme: { room, fmt, times: [...] } }  (endereços e CEPs são exemplos) */
export const LOCATIONS = [
  {
    id: "santo-andre", kind: "marquee", type: "Cinema de shopping", name: "CineAstra Santo André",
    street: "Av. Industrial, 600", district: "Jardim, Santo André · SP", cep: "09080-500",
    ref: "Piso L3 do Shopping Astra, ao lado da praça de alimentação", hours: "13h às 23h30", rooms: 8,
    image: venuePhoto("photo-1489599849927-2ee91cede3ba"),
    perks: [{ icon: Tv2, label: "IMAX" }, { icon: Volume2, label: "Dolby Atmos" }, { icon: Car, label: "Estacionamento" }, { icon: Accessibility, label: "Acessível" }],
    schedule: {
      "m-5": { room: "Sala 1", fmt: "Dublado", times: ["11:00", "13:15", "15:30"] },
      "m-1": { room: "Sala 2", fmt: "2D", times: ["14:30", "17:15", "20:00"] },
      "m-6": { room: "IMAX", fmt: "IMAX 4K", times: ["15:00", "18:20", "21:10"] },
      "m-8": { room: "Sala 4", fmt: "Atmos", times: ["17:00", "22:30"] },
      "m-3": { room: "Sala 5", fmt: "Legendado", times: ["20:30", "22:50"] },
    },
  },
  {
    id: "paulista", kind: "screen", type: "Flagship IMAX e Gold Class", name: "CineAstra Paulista",
    street: "Av. Paulista, 1500", district: "Bela Vista, São Paulo · SP", cep: "01310-200",
    ref: "A 2 minutos a pé da estação Trianon-Masp (Linha 2-Verde)", hours: "12h às 00h", rooms: 10,
    image: venuePhoto("photo-1517604931442-7e0c8ed2963c"),
    perks: [{ icon: Tv2, label: "IMAX" }, { icon: Crown, label: "Gold Class" }, { icon: Train, label: "Metrô" }, { icon: Accessibility, label: "Acessível" }],
    schedule: {
      "m-7": { room: "Sala 3", fmt: "2D", times: ["13:40", "19:00"] },
      "m-8": { room: "Gold 1", fmt: "VIP", times: ["14:30", "17:15", "20:00", "22:30"] },
      "m-6": { room: "IMAX", fmt: "IMAX 4K", times: ["15:00", "18:20", "21:10"] },
      "m-2": { room: "Sala 5", fmt: "Atmos", times: ["15:00", "21:10"] },
      "m-3": { room: "Sala 7", fmt: "Legendado", times: ["18:00", "20:30", "22:50"] },
    },
  },
  {
    id: "teatro-sbc", kind: "curtain", type: "Cine-teatro restaurado", name: "Cine Teatro Astra",
    street: "Rua Marechal Deodoro, 1200", district: "Centro, São Bernardo do Campo · SP", cep: "09710-001",
    ref: "Em frente à Praça da Matriz, com entrada pelo hall histórico", hours: "13h às 23h", rooms: 3,
    image: venuePhoto("photo-1503095396549-807759245b35"),
    perks: [{ icon: Landmark, label: "Prédio histórico" }, { icon: Armchair, label: "Plateia e balcão" }, { icon: Accessibility, label: "Acessível" }],
    schedule: {
      "m-4": { room: "Plateia", fmt: "2D", times: ["14:00", "16:40", "19:20"] },
      "m-1": { room: "Salão Nobre", fmt: "2D", times: ["14:30", "20:00"] },
      "m-2": { room: "Plateia", fmt: "Legendado", times: ["21:30"] },
      "m-8": { room: "Balcão", fmt: "Legendado", times: ["17:30", "22:00"] },
    },
  },
  {
    id: "campinas", kind: "marquee", type: "Cinema de rua", name: "CineAstra Campinas",
    street: "Av. Norte-Sul, 800", district: "Cambuí, Campinas · SP", cep: "13024-000",
    ref: "Esquina com a Rua Coronel Quirino, com bicicletário na entrada", hours: "14h às 23h", rooms: 5,
    image: venuePhoto("photo-1505686994434-e3cc5abf1330"),
    perks: [{ icon: Armchair, label: "Poltronas reclináveis" }, { icon: Popcorn, label: "Bomboniere" }, { icon: Car, label: "Estacionamento" }],
    schedule: {
      "m-5": { room: "Sala 2", fmt: "Dublado", times: ["14:00", "16:15"] },
      "m-1": { room: "Sala 1", fmt: "2D", times: ["14:30", "17:15", "20:00"] },
      "m-4": { room: "Sala 3", fmt: "2D", times: ["19:20", "21:40"] },
    },
  },
];

export const AGE_STYLES = {
  Livre: "bg-emerald-600 text-white", "10": "bg-sky-500 text-white", "12": "bg-yellow-400 text-black",
  "14": "bg-orange-500 text-white", "16": "bg-red-600 text-white", "18": "bg-black text-white border border-border",
};

/* Linha do tempo: das 11h à 01h */
export const START = 11 * 60, END = 25 * 60, RANGE = END - START;
export const TICKS = [12, 14, 16, 18, 20, 22, 24];
export const toMin = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
export const toHM = (min) => `${String(Math.floor(min / 60) % 24).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
export const pct = (min) => ((min - START) / RANGE) * 100;
