import { Film, Volume2, Tv2, Crown, Popcorn, CupSoda, Cookie, IceCream, Armchair } from "lucide-react";

export const U = (id, w, h) => `https://images.unsplash.com/${id}?auto=format&fit=crop&crop=entropy&w=${w}&h=${h}&q=80`;
export const posterImg = (id) => U(id, 600, 900);              // pôster 2:3
export const wideImg = (id, w = 1920, h = 1080) => U(id, w, h); // paisagem 16:9

/* Banco central de imagens por tema. Para trocar uma foto, altere só o ID aqui. */
export const IMG = {
  // Cinema / salas
  cinemaHall: "photo-1489599849927-2ee91cede3ba",
  cinemaSeats: "photo-1517604931442-7e0c8ed2963c",
  vipSeats: "photo-1505686994434-e3cc5abf1330",
  projector: "photo-1485846234645-a62644f84728",
  filmReel: "photo-1536440136628-849c177e76a1",
  // Comidas e bebidas
  popcorn: "photo-1585647347384-2593bc35786b",
  caramelPopcorn: "photo-1578849278619-74b2c2bc9852",
  nachos: "photo-1513456852971-30c0b8199d4d",
  soda: "photo-1554866585-cd94860890b7",
  chocolate: "photo-1511381939415-e44015466834",
  candy: "photo-1582058091505-f87a2e55a40f",
  iceCream: "photo-1563805042-7684c019e1cb",
  hotdog: "photo-1612392062631-94dd858cba88",
  cookies: "photo-1499636136210-6f4ee915583e",
};

export const HERO_MOVIES = [
  { id: "hero-1", title: "O Último Fotograma", subtitle: "Algumas histórias só terminam quando alguém as assiste até o fim.", genre: "Suspense · Drama", duration: "2h 08min", rating: "14 anos", score: "4.9", format: "IMAX 3D · DOLBY ATMOS", image: wideImg("photo-1478720568477-152d9b164e26"), poster: posterImg("photo-1478720568477-152d9b164e26"), synopsis: "Um misterioso fotógrafo descobre rolos de filme não revelados em um estúdio abandonado, revelando eventos que reescrevem o passado e ameaçam o futuro.", trailerUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", sessions: ["14:30", "17:15", "20:00", "22:30"] },
  { id: "hero-2", title: "Constelação Kira", subtitle: "O universo respondeu. Agora precisamos descobrir o que ele disse.", genre: "Ficção Científica · Aventura", duration: "2h 21min", rating: "12 anos", score: "4.8", format: "IMAX 4K · D-BOX", image: wideImg("photo-1446776811953-b23d57bd21aa"), poster: posterImg("photo-1440404653325-ab127d49abc1"), synopsis: "Uma expedição interestelar parte para investigar um sinal emitido das profundezas de uma nebulosa, onde as leis da física conhecidas não se aplicam.", trailerUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", sessions: ["15:00", "18:20", "21:10"] },
  { id: "hero-3", title: "Baile das Sombras", subtitle: "Depois da meia-noite, ninguém deveria estar olhando para trás.", genre: "Terror · Mistério", duration: "1h 54min", rating: "16 anos", score: "4.7", format: "4K · ATMOS", image: wideImg(IMG.cinemaHall), poster: posterImg("photo-1497032205916-ac775f0649ae"), synopsis: "Em uma mansão vitoriana isolada, convidados para um baile de máscaras percebem que seus anfitriões pertencem a uma ordem esquecida no tempo.", trailerUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", sessions: ["18:00", "20:30", "22:50"] },
];

export const S = ["13:40", "16:15", "19:00", "21:45"];

/* Em cartaz */
export const NOW_PLAYING = [
  { id: "m-1", title: "Se Eu Fosse Você 3", genre: "Comédia", age: "10", duration: "90m", poster: posterImg("photo-1485846234645-a62644f84728"), sessions: ["14:30", "17:15", "20:00", "22:30"] },
  { id: "m-2", title: "Verity", genre: "Suspense", age: "16", duration: "120m", poster: posterImg("photo-1478720568477-152d9b164e26"), sessions: ["15:00", "18:20", "21:10"] },
  { id: "m-3", title: "Outra Mamãe", genre: "Terror", age: "18", duration: "95m", poster: posterImg("photo-1497032205916-ac775f0649ae"), sessions: ["18:00", "20:30", "22:50"] },
  { id: "m-4", title: "Minha Melhor Amiga", genre: "Comédia", age: "12", duration: "120m", poster: posterImg("photo-1500530855697-b586d89ba3ee"), sessions: ["14:00", "16:40", "19:20"] },
  { id: "m-5", title: "As Aventuras de Tadeo e a Lâmpada Mágica", genre: "Animação", age: "10", duration: "95m", poster: posterImg("photo-1534447677768-be436bb09401"), sessions: ["11:00", "13:15", "15:30", "17:45"] },
  { id: "m-6", title: "Constelação Kira", genre: "Ficção Científica", age: "12", duration: "141m", poster: posterImg("photo-1440404653325-ab127d49abc1"), sessions: ["15:00", "18:20", "21:10"] },
  { id: "m-7", title: "Maré Vermelha", genre: "Ação", age: "16", duration: "121m", poster: posterImg("photo-1518709268805-4e9042af9f23"), sessions: S },
  { id: "m-8", title: "O Último Fotograma", genre: "Drama", age: "14", duration: "128m", poster: posterImg("photo-1478720568477-152d9b164e26"), sessions: ["14:30", "17:15", "20:00", "22:30"] },
];

/* Em breve (pré-venda) */
export const COMING_SOON = [
 { id: "s-1", title: "Vingadores: Doutor Destino", genre: "Fantasia", age: "14", duration: "132m",
  release: "Estreia 15 Out",
  poster: "/posters/DOUTOR.png",   // antes: posterImg("photo-...")
  sessions: ["16:00", "19:00", "21:30"] },
  { id: "s-2", title: "Rota de Colisão", genre: "Ação", age: "14", duration: "118m", release: "Estreia 22 Out", poster: posterImg("photo-1518709268805-4e9042af9f23"), sessions: ["16:00", "19:00", "21:30"] },
  { id: "s-3", title: "Máscara Vermelha", genre: "Terror", age: "18", duration: "104m", release: "Estreia 29 Out", poster: posterImg("photo-1497032205916-ac775f0649ae"), sessions: ["18:00", "20:30", "22:50"] },
  { id: "s-4", title: "Turnê Mundial ao Vivo", genre: "Show", age: "Livre", duration: "150m", release: "Estreia 05 Nov", poster: posterImg("photo-1514525253161-7a46d19cd819"), sessions: ["17:00", "20:00"] },
  { id: "s-5", title: "Coração de Inverno", genre: "Romance", age: "12", duration: "112m", release: "Estreia 12 Nov", poster: posterImg("photo-1500530855697-b586d89ba3ee"), sessions: ["16:00", "19:00", "21:30"] },
  { id: "s-6", title: "A Última Órbita", genre: "Ficção Científica", age: "12", duration: "138m", release: "Estreia 19 Nov", poster: posterImg("photo-1440404653325-ab127d49abc1"), sessions: ["15:30", "18:40", "21:50"] },
];

/* Cada item usa uma foto do que ele realmente é (pipoca = pipoca, bebida = bebida...) */
export const COMBOS = [
  { id: "c-1", title: "Combo CineAstra Supreme", description: "1 Pipoca Balde Especial + 2 Refrigerantes 1L + 1 M&M's Gigante", price: 52.9, priceFormatted: "R$ 52,90", label: "Mais vendido", icon: Popcorn, image: wideImg(IMG.popcorn, 1000, 600) },
  { id: "c-2", title: "Combo Duo Gold", description: "1 Pipoca Grande + 2 Bebidas 700ml + 1 Nachos com Queijo", price: 44.9, priceFormatted: "R$ 44,90", label: "Para dois", icon: Popcorn, image: wideImg(IMG.nachos, 1000, 600) },
  { id: "c-3", title: "Pipoca Caramelizada Gourmet", description: "Pipoca crocante envolvida em caramelo artesanal e flor de sal", price: 28.9, priceFormatted: "R$ 28,90", label: "Gourmet", icon: Popcorn, image: wideImg(IMG.popcorn, 1000, 600) },
  { id: "c-4", title: "Sweet Cinema Deluxe", description: "Chocolates importados + Balas de Goma + Refrigerante 500ml", price: 32.9, priceFormatted: "R$ 32,90", label: "Sobremesa", icon: Cookie, image: wideImg(IMG.chocolate, 1000, 600) },
  { id: "c-5", title: "Refri Gelado 700ml", description: "Refrigerante sabores variados, servido na temperatura perfeita, com gelo", price: 14.9, priceFormatted: "R$ 14,90", label: "Bebida", icon: CupSoda, image: wideImg(IMG.soda, 1000, 600) },
  { id: "c-6", title: "Cachorro-quente da Sessão", description: "Pão macio, salsicha artesanal, molho da casa e batata palha", price: 19.9, priceFormatted: "R$ 19,90", label: "Lanche", icon: Popcorn, image: wideImg(IMG.hotdog, 1000, 600) },
  { id: "c-7", title: "Sorvete Cremoso", description: "Duas bolas de sorvete artesanal com calda e cobertura crocante", price: 18.9, priceFormatted: "R$ 18,90", label: "Gelado", icon: IceCream, image: wideImg(IMG.iceCream, 1000, 600) },
  { id: "c-8", title: "Cookies Recheados", description: "Trio de cookies quentinhos com gotas de chocolate belga", price: 16.9, priceFormatted: "R$ 16,90", label: "Doce", icon: Cookie, image: wideImg(IMG.cookies, 1000, 600) },
];

/* Galeria de ambientes (cada foto combina com a legenda) */
export const GALLERY = [
  { id: "g-1", title: "Sala IMAX", caption: "Tela gigante, projeção laser 4K", icon: Tv2, image: wideImg(IMG.cinemaHall, 900, 700) },
  { id: "g-2", title: "Poltronas reclináveis", caption: "Conforto do início ao fim", icon: Armchair, image: wideImg(IMG.cinemaSeats, 900, 700) },
  { id: "g-3", title: "Projeção", caption: "Cabine com tecnologia de ponta", icon: Film, image: wideImg(IMG.projector, 900, 700) },
  { id: "g-4", title: "Bomboniere", caption: "Pipoca fresquinha a cada sessão", icon: Popcorn, image: wideImg(IMG.popcorn, 900, 700) },
];

export const formatBRL = (value) => `R$ ${value.toFixed(2).replace(".", ",")}`;
export const FEATURES = {
  imax: { icon: Tv2, label: "IMAX 4K Laser", title: "CineAstra IMAX® 4K Laser", description: "Telas gigantescas do chão ao teto e da parede à parede, com projeção laser dupla 4K para uma nitidez sem precedentes.", tags: ["Telas curvas de 24m", "Projeção laser 4K", "Assentos reclináveis premium"], image: wideImg(IMG.cinemaHall, 1600, 900) },
  atmos: { icon: Volume2, label: "Dolby Atmos®", title: "Som imersivo Dolby Atmos®", description: "64 canais de áudio independentes com alto-falantes no teto que fazem o som se mover ao seu redor com precisão tridimensional.", tags: ["Som 360° tridimensional", "Subwoofers duplos", "Isolamento acústico VIP"], image: wideImg(IMG.cinemaSeats, 1600, 900) },
  vip: { icon: Crown, label: "Gold Class VIP", title: "Salas VIP Gold Class Lounge", description: "Poltronas duplas de couro reclináveis eletricamente, com serviço de garçom acionado por botão direto no assento.", tags: ["Atendimento no assento", "Carta de vinhos e cocktails", "Poltronas chaise longue"], image: wideImg(IMG.vipSeats, 1600, 900) },
};
