import { cartOrder } from "./cart-order.mjs";

const prefix = "cineastra:cart:v2:";
export const guestCartKey = prefix + "guest";
export function accountCartKey(id) {
  return /^[1-9]\d*$/.test(String(id)) ? prefix + "customer:" + id : null;
}

export const cartChanged = "cineastra:cart-changed";
const sessionFallback = new Map();
export const emptyCart = { items: [], savedForLater: [] };

export function readCartSnapshot(key) {
  if (!key) return null;
  if (sessionFallback.has(key)) return sessionFallback.get(key);
  try { return localStorage.getItem(key); }
  catch { return null; }
}

export function parseCart(snapshot) {
  if (!snapshot) return emptyCart;
  try {
    const { items, savedForLater } = JSON.parse(snapshot);
    const valid = entries => Array.isArray(entries)
      ? entries.filter(item => item?.id && Number.isInteger(item.quantity) && item.quantity > 0)
      : [];
    return { items: valid(items), savedForLater: valid(savedForLater) };
  } catch {
    return emptyCart;
  }
}

export function updateCart(key, update) {
  if (!key) return;
  const current = parseCart(readCartSnapshot(key));
  const next = update(current);
  if (next === current) return;
  const snapshot = JSON.stringify(next);
  try {
    localStorage.setItem(key, snapshot);
    sessionFallback.delete(key);
  } catch {
    sessionFallback.set(key, snapshot);
  }
  window.dispatchEvent(new Event(cartChanged));
}

function transferGuestCart(id) {
  const key = accountCartKey(id);
  const guest = parseCart(readCartSnapshot(guestCartKey));
  if (!key || !guest.items.length) return;
  updateCart(key, current => {
    let items = current.items;
    const savedForLater = [...current.savedForLater];
    for (const item of guest.items) {
      if (!["INPUT", "COMBO"].includes(item.purchaseKind)) continue;
      const same = entry => entry.purchaseKind === item.purchaseKind && entry.sourceId === item.sourceId && entry.localId === item.localId;
      const existing = items.find(same);
      const candidate = existing
        ? items.map(entry => entry === existing ? { ...entry, quantity: entry.quantity + item.quantity } : entry)
        : [...items, item];
      try {
        cartOrder(candidate);
        items = candidate;
      } catch {
        savedForLater.push(item);
      }
    }
    return { items, savedForLater };
  });
  updateCart(guestCartKey, () => emptyCart);
}

export function rememberGuestCart(id) {
  if (navigator.locks) return navigator.locks.request(guestCartKey, () => transferGuestCart(id));
  return transferGuestCart(id);
}
