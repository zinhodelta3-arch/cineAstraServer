"use client";

import { useEffect, useRef, useState } from 'react';
import { useCart } from '@/components/cart/cart-provider';
import { usePublicList } from '@/hooks/cinema/home/use-public-list';
import { cartOrder } from '@/lib/api/cart-order.mjs';
import { snackProduct } from '@/lib/api/snack-products.mjs';
import { readSessionResponse, sessionFetch } from '@/lib/auth/session-response.mjs';

const isDrink = product => /bebida|refrigerante|suco|água|\bagua\b|cerveja/i.test(`${product.category} ${product.name}`);

export function useCartSnacks(session, coupon, enabled) {
  const cart = useCart();
  const [selectedSession,setSelectedSession]=useState(null);
  const tickets=Array.from(new Map(cart.items.filter(item=>item.purchaseKind==='SESSION').map(item=>[item.sourceId,item])).values());
  const ticket=tickets.find(item=>item.sourceId===selectedSession)??tickets[0];
  const localId = enabled ? ticket?.localId : null;
  const snacks = usePublicList(localId ? `/locations/${localId}/snacks?limit=100&inStock=true` : null);
  const combos = usePublicList(localId ? `/combos?localId=${localId}&limit=2&inStock=true` : null);
  const themed = usePublicList(localId ? `/combos?localId=${localId}&sessionId=${ticket.sourceId}&limit=4&inStock=true` : null);
  const inputs = snacks.items.filter(row => row.inStock === true && String(row.localId) === localId)
    .map(row => snackProduct(row, 'INPUT', localId));
  const comboProducts = combos.items.filter(row => String(row.id_local) === localId)
    .map(row => snackProduct(row, 'COMBO', localId));
  const eventProducts=themed.items.filter(row=>String(row.id_local)===localId&&row.event?.sessionId===ticket?.sourceId).map(row=>snackProduct(row,'COMBO',localId));
  const products = [...eventProducts,...comboProducts.slice(0, 2), ...inputs.filter(p => !isDrink(p)).slice(0, 2), ...inputs.filter(isDrink).slice(0, 2)];
  const [state, setState] = useState(null);
  const operation = useRef(null);
  const contextKey = JSON.stringify([session.user?.id,localId,ticket?.sourceId,coupon,cart.items.map(item=>[item.id,item.type,item.purchaseKind,item.sourceId,item.localId,item.seatId,item.eventSessionId,item.details,item.quantity])]);

  useEffect(() => () => operation.current?.abort(), [contextKey]);

  async function add(product) {
    if (!localId || session.user?.role !== 'CLIENTE' || operation.current || product.localId !== localId) return;
    const abort = new AbortController();
    operation.current = abort;
    setState({ contextKey, pending: product.id });
    try {
      const existing = cart.items.find(item => item.purchaseKind === product.purchaseKind && item.sourceId === product.sourceId && item.localId === localId);
      const input = cartOrder([...cart.items, { ...product, quantity: 1 }], coupon);
      const response = await sessionFetch('/api/cart/quote', {
        method: 'POST', credentials: 'same-origin', cache: 'no-store', signal: abort.signal,
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input)
      });
      const quote = await readSessionResponse(response);
      const line = quote.lines.find(item => item.category === product.purchaseKind && item.id === product.sourceId);
      if (!quote.finalizable || !line || quote.lines.some(item => item.catalogOutOfSync)) {
        throw new Error('A cotação não permite adicionar este item. Confira preço, estoque e disponibilidade do pedido.');
      }
      if (abort.signal.aborted) return;
      cart.addItem({ ...product, id: existing?.id ?? product.id, type: existing?.type ?? product.type,
        details: existing?.details ?? '', price: line.unitPrice,
        originalPrice: line.originalPrice, discountSources: line.discountSources });
      setState({ localId, notice: `${product.name} adicionado ao carrinho.` });
    } catch (error) {
      if (!abort.signal.aborted) setState({ contextKey, error: error.message });
    } finally {
      if (operation.current === abort) operation.current = null;
    }
  }

  return {
    localId, products, add, snacks, combos, themed, tickets, selectedSession:ticket?.sourceId, setSelectedSession,
    pending: state?.contextKey === contextKey ? state.pending : null,
    error: state?.contextKey === contextKey ? state.error : null,
    notice: state?.localId === localId ? state.notice : null
  };
}
