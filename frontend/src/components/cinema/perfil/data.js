// Protótipo frontend: todos os dados abaixo são fictícios, mantidos em memória.
export const INITIAL_PROFILE = {
  name: "Alex Morgan", email: "alex.morgan@example.com", phone: "(11) 99999-0000",
  city: "São Paulo, SP", avatar: "AM",
};
export const MOVIES = [
  { id: "fotograma", title: "O Último Fotograma", genre: "Suspense · Drama", duration: "2h 08min", score: "4.9", image: "photo-1478720568477-152d9b164e26", sessions: ["14:30", "17:15", "20:00"], summary: "Rolos de filme esquecidos em um estúdio abandonado revelam eventos capazes de reescrever o passado." },
  { id: "kira", title: "Constelação Kira", genre: "Ficção científica", duration: "2h 21min", score: "4.8", image: "photo-1446776811953-b23d57bd21aa", sessions: ["15:00", "18:20", "21:10"], summary: "Uma expedição segue um sinal vindo de uma nebulosa onde as leis da física já não se aplicam." },
  { id: "gaia", title: "O Segredo de Gaia", genre: "Animação · Aventura", duration: "1h 38min", score: "4.9", image: "photo-1534447677768-be436bb09401", sessions: ["11:00", "13:15", "15:30"], summary: "Uma jovem exploradora encontra um mundo extraordinário e descobre o segredo que o mantém vivo." },
];
export const TICKETS = [
  { id: "CA-20481", movieId: "fotograma", date: "09 out. 2026", time: "20:00", venue: "CineAstra Paulista", room: "Sala 03 · IMAX 3D", seats: "F08, F09", quantity: 2, entry: "Inteira", total: 120.9, combo: "Combo Duo Gold", status: "Confirmado" },
  { id: "CA-20502", movieId: "kira", date: "11 out. 2026", time: "18:20", venue: "CineAstra São Caetano", room: "Sala 01 · Dolby Atmos", seats: "E12", quantity: 1, entry: "Inteira", total: 38, combo: "Sem combo", status: "Confirmado" },
  { id: "CA-20529", movieId: "gaia", date: "12 out. 2026", time: "15:30", venue: "CineAstra Paulista", room: "Sala 05 · 2D", seats: "D10, D11", quantity: 2, entry: "Inteira", total: 76, combo: "Sem combo", status: "Confirmado" },
];
export const PURCHASES = [
  { id: "CA-19862", title: "Baile das Sombras", date: "27 set. 2026", total: 120.9, items: "2 ingressos + Combo Duo Gold", venue: "CineAstra Paulista", status: "Concluído" },
  { id: "CA-19308", title: "Sete Invernos", date: "18 set. 2026", total: 38, items: "1 ingresso inteiro", venue: "CineAstra São Caetano", status: "Concluído" },
  { id: "CA-18410", title: "Maré Vermelha", date: "05 set. 2026", total: 104.9, items: "2 ingressos + Pipoca Gourmet", venue: "CineAstra Paulista", status: "Concluído" },
];
export const INITIAL_CARDS = [
  { id: "card-1", brand: "Visa", last4: "4829", nickname: "Meu cartão", expiry: "08/29", isDefault: true },
  { id: "card-2", brand: "Mastercard", last4: "9012", nickname: "Cartão de viagens", expiry: "11/28", isDefault: false },
  { id: "card-3", brand: "Elo", last4: "3456", nickname: "Cartão adicional", expiry: "03/30", isDefault: false },
];
