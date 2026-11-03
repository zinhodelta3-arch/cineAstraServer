export const MAX_SEATS = 20;

export function cleanSeats(ids = [], seats = []) {
  const requested = new Set(ids);
  return seats.filter(seat => requested.has(seat.id) && !seat.occupied)
    .slice(0, MAX_SEATS).map(seat => seat.id);
}

export function toggleSeat(selected, id, seats = []) {
  const seat = seats.find(item => item.id === id);
  if (!seat || seat.occupied) return selected;
  if (selected.includes(id)) return selected.filter(item => item !== id);
  if (selected.length >= MAX_SEATS) return selected;
  return cleanSeats([...selected, id], seats);
}
