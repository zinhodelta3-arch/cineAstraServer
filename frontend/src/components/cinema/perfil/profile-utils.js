import { MOVIES } from "./data";

export const money = (amount) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amount);
export const poster = (movie, width = 500) => `https://images.unsplash.com/${movie.image}?auto=format&fit=crop&w=${width}&q=85`;
export const movieFor = (ticket) => MOVIES.find((movie) => movie.id === ticket.movieId);
export const actionClass = "h-10 rounded-full px-5 font-bold";
