// Planta demonstrativa. A disponibilidade real deverá vir da API de sessões.
export const ROWS = "ABCDEFGHIJKL".split("");
export const COLUMNS = 20;
export const MAX_SEATS = 20;
const occupied = new Set(["B8", "B9", "C13", "C14", "D6", "D7", "E7", "E8", "E13", "E14", "F9", "F10", "F11", "H5", "H6", "H9", "H10", "H11", "H12", "H15", "H16", "I7", "I8", "I9", "I10", "I11", "I12", "I13", "I14"]);
const accessible = new Set(["G7", "G8", "G9", "G12", "G13", "G14"]);
export const SEATS = ROWS.flatMap((row) => Array.from({ length: COLUMNS }, (_, index) => {
  const number = index + 1;
  const id = `${row}${number}`;
  return { id, row, number, occupied: occupied.has(id), accessible: accessible.has(id) };
}));
export function cleanSeats(ids = []) {
  const requested = new Set(ids);
  return SEATS.filter((seat) => requested.has(seat.id) && !seat.occupied).slice(0, MAX_SEATS).map((seat) => seat.id);
}
export function toggleSeat(selected, id) {
  const seat = SEATS.find((item) => item.id === id);
  if (!seat || seat.occupied) return selected;
  if (selected.includes(id)) return selected.filter((item) => item !== id);
  if (selected.length >= MAX_SEATS) return selected;
  return cleanSeats([...selected, id]);
}
