import { accountCartKey } from "./local-cart.mjs";

export function checkoutStorageKey(field, userId) {
  return accountCartKey(userId) ? `cineastra:checkout:${field}:${userId}` : null;
}

export const guestSeatKey = "cineastra:checkout:seats:guest";

export function readCheckoutState(key) {
  try { return key ? sessionStorage.getItem(key) : null; }
  catch { return null; }
}

export function rememberGuestSeats(userId) {
  const key = checkoutStorageKey("session", userId);
  const saved = readCheckoutState(guestSeatKey);
  if (!key || !saved) return;
  sessionStorage.setItem(key, saved);
  sessionStorage.removeItem(guestSeatKey);
}
