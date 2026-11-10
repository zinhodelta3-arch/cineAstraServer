"use client";

import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { useSession } from "@/hooks/auth/use-session";
import { cartOrder } from "@/lib/api/cart-order.mjs";
import { operationKey } from "@/lib/api/operation-key.mjs";
import { readSessionResponse } from "@/lib/auth/session-response.mjs";

const EMPTY_DETAILS = { name: "", phone: "", email: "", street: "", number: "", complement: "", district: "", city: "", state: "", country: "BR", postalCode: "" };
const EMPTY_CARD = { holder: "", number: "", expiry: "", cvv: "" };
const couponKey = "cineastra:checkout:coupon";
const acceptanceKey = "cineastra:checkout:accepted";
const noSubscription = () => () => {};
const emptyCoupon = () => "";
function savedCoupon() {
  try { return sessionStorage.getItem(couponKey) || ""; }
  catch { return ""; }
}
const transientKeys = new Map();
const digits = value => value.replace(/\D/g, "");
const maskCep = value => { const d = digits(value).slice(0, 8); return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d; };
const maskCard = value => digits(value).slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
const maskExpiry = value => { const d = digits(value).slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

async function request(action, { body, key, signal, query } = {}) {
  const response = await fetch(`/api/checkout/${action}${query ? `?${query}` : ""}`, {
    method: body ? "POST" : "GET", credentials: "same-origin", cache: "no-store", signal,
    headers: body ? { "Content-Type": "application/json", ...(key ? { "Idempotency-Key": key } : {}) } : undefined,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return readSessionResponse(response);
}

function savedKey(name) {
  if (transientKeys.has(name)) return transientKeys.get(name);
  try {
    const existing = sessionStorage.getItem(name);
    if (existing) { transientKeys.set(name, existing); return existing; }
  } catch { /* A chave em memória continua disponível se o armazenamento falhar. */ }
  const created = operationKey();
  transientKeys.set(name, created);
  try { sessionStorage.setItem(name, created); } catch { /* Reutiliza a chave em memória. */ }
  return created;
}
function clearSavedKey(name) { transientKeys.delete(name); try { sessionStorage.removeItem(name); } catch { /* Armazenamento opcional. */ } }

function validCard(card) {
  const match = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(card.expiry);
  if (!card.holder.trim() || digits(card.number).length !== 16 || !match || !/^\d{3,4}$/.test(card.cvv)) return false;
  return new Date(2000 + Number(match[2]), Number(match[1]), 1) > new Date();
}

export default function usePayment(method = null) {
  const cart = useCart();
  const session = useSession();
  const userId = session.user?.id;
  const role = session.user?.role;
  const [details, setDetails] = useState(EMPTY_DETAILS);
  const [card, setCard] = useState(EMPTY_CARD);
  const [cepResult, setCepResult] = useState(null);
  const coupon = useSyncExternalStore(noSubscription, savedCoupon, emptyCoupon);
  const [offerState, setOfferState] = useState(null);
  const [previousCartKey, setPreviousCartKey] = useState(null);
  const [accepted, setAcceptedState] = useState(false);
  const [result, setResult] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);

  let input = null, issue = "";
  try { input = cartOrder(cart.items, coupon); } catch (caught) { issue = caught.message; }
  if (!issue && input.lines.some(line => line.kind === "COMBO" && !line.sessionId)) issue = "Para finalizar um combo, adicione um ingresso de sessão do mesmo cinema ao carrinho.";
  const quoteInput = input && !issue && role === "CLIENTE" ? JSON.stringify(input) : null;
  const cartKey = JSON.stringify([userId, role, quoteInput, cart.items.map(item => [item.id, item.details, item.quantity])]);
  const paid = ["PAGO", "FINALIZADO"].includes(result?.orderStatus);
  if (previousCartKey !== cartKey) {
    setPreviousCartKey(cartKey);
    setOfferState(null);
    setAcceptedState(false);
    if (!paid) setResult(null);
    setError("");
  }
  const currentOffer = offerState?.key === cartKey ? offerState : null;
  const offer = currentOffer?.offer ?? null;
  const offerLoading = Boolean(quoteInput && !currentOffer);
  const offerError = currentOffer?.error ?? "";
  const offerHash = offer?.contract?.offerHash;
  const ready = Boolean(quoteInput && offer?.finalizable && accepted);
  const pixKey = method === "pix" && ready && !result?.paymentId ? offerHash : null;
  if (countdown && countdown.key !== pixKey && !result?.paymentId) setCountdown(null);
  const remaining = countdown?.key === pixKey ? countdown.remaining : 15;
  const postalCode = digits(details.postalCode);
  const cep = details.country === "BR" && postalCode.length === 8 ? postalCode : null;
  const cepStatus = { loading: Boolean(cep && cepResult?.key !== cep), error: cepResult?.key === cep ? cepResult.error : "" };
  const items = cart.items.map(item => {
    const index = input?.lines.findIndex(line => line.kind === item.purchaseKind && line.id === item.sourceId && (line.kind !== "SESSION" || line.seatId === item.seatId));
    const line = index >= 0 ? offer?.lines?.[index] : null;
    return { ...item, price: line ? Number(line.unitPrice) : item.price };
  });

  useEffect(() => {
    if (!quoteInput) return;
    const abort = new AbortController();
    request("quote", { body: JSON.parse(quoteInput), signal: abort.signal })
      .then(data => {
        if (abort.signal.aborted) return;
        if (!data.contract?.offerHash || !data.contract?.terms?.body?.text || !data.contract?.privacy?.body?.text) throw new Error("Oferta ou documentos contratuais indisponíveis.");
        try {
          const saved = JSON.parse(sessionStorage.getItem(acceptanceKey) || "null");
          setAcceptedState(saved?.offerHash === data.contract.offerHash && saved?.userId === userId);
        } catch { setAcceptedState(false); }
        setOfferState({ key: cartKey, offer: data, error: "" });
      })
      .catch(caught => { if (!abort.signal.aborted) setOfferState({ key: cartKey, offer: null, error: caught.message }); });
    return () => abort.abort();
  }, [cartKey, quoteInput, userId]);

  function setAccepted(value) {
    setAcceptedState(value);
    try { if (value && offerHash) sessionStorage.setItem(acceptanceKey, JSON.stringify({ offerHash, userId: session.user.id })); else sessionStorage.removeItem(acceptanceKey); } catch { /* Aceite continua nesta tela. */ }
  }

  useEffect(() => {
    if (!cep) return;
    const abort = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/cep/${cep}`, { signal: abort.signal })
        .then(readSessionResponse)
        .then(data => {
          if (abort.signal.aborted) return;
          setDetails(current => current.country === "BR" && digits(current.postalCode) === cep ? { ...current, street: data.street, district: data.district, city: data.city, state: data.state } : current);
          setCepResult({ key: cep, error: "" });
        })
        .catch(caught => { if (!abort.signal.aborted) setCepResult({ key: cep, error: caught.message }); });
    }, 300);
    return () => { clearTimeout(timer); abort.abort(); };
  }, [cep]);

  function changeDetail(event) {
    const { name, value } = event.target;
    setError("");
    if (name === "country" || (name === "postalCode" && digits(maskCep(value)) !== postalCode)) setCepResult(null);
    setDetails(current => {
      if (name === "postalCode") {
        const next = current.country === "BR" ? maskCep(value) : value;
        if (next === current.postalCode) return current;
        return { ...current, postalCode: next, street: "", district: "", city: "", state: "" };
      }
      if (name === "country") return { ...current, country: value, postalCode: "", street: "", district: "", city: "", state: "" };
      return { ...current, [name]: value };
    });
  }

  function changeCard(event) {
    const { name, value } = event.target;
    setError("");
    setCard(current => ({ ...current, [name]: name === "number" ? maskCard(value) : name === "expiry" ? maskExpiry(value) : name === "cvv" ? digits(value).slice(0, 4) : value }));
  }

  async function refreshPayment(paymentId) {
    try {
      const payment = await request("reconcile", { body: { paymentId } });
      const order = payment.orderId ? await request("order", { query: `id=${encodeURIComponent(payment.orderId)}` }) : null;
      setResult(current => current?.paymentId === paymentId ? { ...current, status: payment.status, orderStatus: order?.financialStatus || current.orderStatus } : current);
      if (["PAGO", "FINALIZADO"].includes(order?.financialStatus)) {
        cart.clearCart();
        clearSavedKey(`cineastra:order:${session.user.id}:${offerHash}`);
        clearSavedKey(`cineastra:payment:${payment.orderId}:${method === "pix" ? "PIX" : method === "debito" ? "DEBITO" : "CREDITO"}`);
        try { sessionStorage.removeItem(acceptanceKey); } catch { /* Pedido já confirmado. */ }
      }
    } catch (caught) { setError(caught.message); }
  }
  const refreshPending = useEffectEvent(refreshPayment);
  const paymentId = result?.paymentId;
  const paymentStatus = result?.status;
  const orderStatus = result?.orderStatus;

  useEffect(() => {
    if (!paymentId || ["PAGO", "FINALIZADO"].includes(orderStatus) || !["PENDENTE", "APROVADO"].includes(paymentStatus)) return;
    const timer = setInterval(() => refreshPending(paymentId), 5000);
    return () => clearInterval(timer);
  }, [paymentId, paymentStatus, orderStatus]);

  async function confirmPayment(type, last4) {
    if (lock.current || result?.paymentId) return;
    if (!ready) { setError(issue || "Volte à seleção e aceite a oferta antes de continuar."); return; }
    if (type !== "PIX") {
      if (!validCard(card)) { setError("Confira nome, número de 16 dígitos, validade futura e código de 3 ou 4 dígitos."); return; }
      if (!details.name.trim() || !details.email.trim() || digits(details.phone).length < 8 || !details.street.trim() || !details.number.trim() || !details.city.trim() || details.country === "BR" && (!/^\d{5}-\d{3}$/.test(details.postalCode) || !details.state.trim())) { setError("Confira seus dados de contato e endereço."); return; }
    }
    lock.current = true; setPending(true); setError("");
    try {
      const order = result?.orderId ? { orderId: result.orderId } : await request("order", { body: { ...input, acceptance: { accepted: true, offerHash } }, key: savedKey(`cineastra:order:${session.user.id}:${offerHash}`) });
      if (!order.orderId) throw new Error("Pedido criado sem identificador. Consulte seus pedidos antes de tentar novamente.");
      setResult({ orderId: order.orderId, paymentId: null, status: "AGUARDANDO_PAGAMENTO", orderStatus: "AGUARDANDO_PAGAMENTO" });
      const paymentMethod = result?.methodId ? { id: result.methodId } : await request("methods", { body: type === "PIX" ? { type } : { type, last4 } });
      if (!paymentMethod.id) throw new Error("Método de pagamento não cadastrado.");
      setResult(current => ({ ...current, methodId: paymentMethod.id }));
      const payment = await request("pay", { body: { orderId: order.orderId, methodId: paymentMethod.id }, key: savedKey(`cineastra:payment:${order.orderId}:${type}`) });
      if (!payment.id || !payment.status) throw new Error("Pagamento iniciado sem resposta completa. Consulte o pedido antes de repetir.");
      setResult({ orderId: order.orderId, methodId: paymentMethod.id, paymentId: payment.id, status: payment.status, orderStatus: "AGUARDANDO_PAGAMENTO", total: Number(offer.total), items });
      setCard(EMPTY_CARD);
      await refreshPayment(payment.id);
    } catch (caught) { setError(caught.message); }
    finally { lock.current = false; setPending(false); }
  }

  function confirmCard(event) { event.preventDefault(); confirmPayment(method === "debito" ? "DEBITO" : "CREDITO", digits(card.number).slice(-4)); }
  const confirmPix = useEffectEvent(() => confirmPayment("PIX"));

  useEffect(() => {
    if (!pixKey) return;
    let elapsed = 0;
    let lastTick = Date.now();
    const timer = setInterval(() => {
      const now = Date.now();
      if (document.visibilityState === "visible") elapsed += now - lastTick;
      lastTick = now;
      const left = Math.max(0, Math.ceil((15000 - elapsed) / 1000));
      setCountdown(current => current?.key === pixKey && current.remaining === left ? current : { key: pixKey, remaining: left });
      if (left === 0) { clearInterval(timer); confirmPix(); }
    }, 250);
    const visibility = () => { lastTick = Date.now(); };
    document.addEventListener("visibilitychange", visibility);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", visibility); };
  }, [pixKey]);
  const displayItems = paid && result.items ? result.items : items;
  return { items: displayItems, itemCount: paid ? displayItems.reduce((count,item) => count + item.quantity, 0) : cart.itemCount, total: paid ? result.total : offer ? Number(offer.total) : cart.total, details, changeDetail, cepStatus,
    card, changeCard, session, issue, offer, offerLoading, offerError, accepted, setAccepted, ready,
    result, pending, error, remaining, confirmCard, retryPix: () => confirmPayment("PIX"), refreshPayment };
}
