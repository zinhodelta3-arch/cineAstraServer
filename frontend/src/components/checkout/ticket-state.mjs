export const TICKET_TYPES = [
  { id: "inteira", name: "Inteira", label: "O cinema é para todo mundo.", price: 4000, code: "INT", category: "regular", description: "Entrada pelo valor integral, sem necessidade de comprovar um benefício." },
  { id: "meia", name: "Meia entrada", label: "Seu direito, sua próxima sessão.", price: 2000, code: "MEI", category: "half", description: "Selecione esta opção se você tem direito à meia entrada. Leve um documento válido que comprove seu benefício e consulte as condições do cinema." },
  { id: "nubank", name: "Meia Nubank", label: "Uma parceria que dá cena.", price: 1800, code: "NUB", category: "half", partner: true, description: "Benefício de parceiro apresentado no modelo desta página. Confirme elegibilidade, formas de pagamento aceitas e condições da oferta com o cinema antes de comprar." },
];

export const brl = (cents) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
export const emptySelection = () => Object.fromEntries(TICKET_TYPES.map(({ id }) => [id, 0]));
export const quantityOf = (selection) => TICKET_TYPES.reduce((total, { id }) => total + (selection[id] || 0), 0);
export const ticketTypes = (session) => session?.priceCents != null
  ? [{ ...TICKET_TYPES[0], price: session.priceCents }] : TICKET_TYPES;
export const totalOf = (selection, types = TICKET_TYPES) => types.reduce((total, { id, price }) => total + (selection[id] || 0) * price, 0);

export function updateQuantity(selection, id, delta, seatCount) {
  if (!TICKET_TYPES.some((type) => type.id === id) || ![1, -1].includes(delta)) return selection;
  if (delta > 0 && quantityOf(selection) >= seatCount) return selection;
  if (delta < 0 && !(selection[id] > 0)) return selection;
  return { ...selection, [id]: (selection[id] || 0) + delta };
}

export function validSession(value) {
  return Boolean(value && typeof value.id === "string" && value.id && typeof value.movie?.title === "string" && value.movie.title && typeof value.cinema?.name === "string" && typeof value.cinema?.room === "string" && [value.date, value.dateLabel, value.time, value.format, value.language].every((part) => typeof part === "string" && part.length > 0) && Array.isArray(value.seats) && value.seats.length > 0 && value.seats.length <= 20 && value.seats.every((seat) => typeof seat === "string" && seat.length > 0 && seat.length <= 12) && new Set(value.seats).size === value.seats.length);
}

export function createOrder(session, selection) {
  if (!validSession(session) || quantityOf(selection) !== session.seats.length || TICKET_TYPES.some(({ id }) => !Number.isInteger(selection[id]) || selection[id] < 0)) throw new Error("Selecione um ingresso para cada assento.");
  if (session.priceCents != null && (selection.meia || selection.nubank)) throw new Error("Esta sessão só oferece ingresso inteiro no momento.");
  const types = ticketTypes(session);
  return { session, tickets: types.filter(({ id }) => selection[id] > 0).map(({ id, name, price }) => ({ id, name, quantity: selection[id], unitPriceCents: price, subtotalCents: selection[id] * price })), ticketCount: quantityOf(selection), totalCents: totalOf(selection, types), currency: "BRL" };
}
