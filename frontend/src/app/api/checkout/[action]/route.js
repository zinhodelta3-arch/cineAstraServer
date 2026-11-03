import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { backendAuth, AuthError, SESSION_COOKIE } from '@/lib/auth/server';
import { isAllowedAuthOrigin } from '@/lib/auth/request-origin.mjs';
import { validCartOrder } from '@/lib/api/cart-order.mjs';
import { commerceErrors } from '@/lib/api/commerce-errors.mjs';
import { randomUUID } from 'node:crypto';

const json = (body, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const id = value => typeof value === 'string' && /^[1-9]\d{0,19}$/.test(value) && BigInt(value) <= 18446744073709551615n;
const smallId = value => typeof value === 'string' && /^[1-9]\d{0,9}$/.test(value) && BigInt(value) <= 4294967295n;
const key = value => typeof value === 'string' && /^[A-Za-z0-9._:-]{8,120}$/.test(value);
const failure = error => json({ code: error.code ?? null, message: commerceErrors[error.code] ?? (error.code === 'AGE_VERIFICATION_REQUIRED' ? 'Sua conta precisa de uma verificação de idade vigente para finalizar a compra.' : error.code === 'AGE_RESTRICTION' ? 'A classificação etária de um filme não permite esta compra.' : error instanceof AuthError ? error.message : 'Não foi possível processar a compra.') }, error instanceof AuthError ? error.status : 503);

export async function GET(request, { params }) {
  const action = (await params).action;
  if (!['methods', 'payment', 'order'].includes(action)) return json({ message: 'Recurso não encontrado.' }, 404);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return json({ message: 'Entre na sua conta para continuar.' }, 401);
  try {
    if (action === 'methods') return json({ items: await backendAuth('/users/me/payment-methods', { token }) });
    const resourceId = new URL(request.url).searchParams.get('id');
    if (!id(resourceId)) return json({ message: 'Identificador inválido.' }, 422);
    return json(await backendAuth(action === 'payment' ? `/payments/${resourceId}` : `/orders/${resourceId}`, { token }));
  } catch (error) { return failure(error); }
}

export async function POST(request, { params }) {
  if (!isAllowedAuthOrigin(request)) return json({ message: 'Origem não permitida.' }, 403);
  const action = (await params).action;
  if (!['quote', 'order', 'pay', 'methods', 'reconcile'].includes(action)) return json({ message: 'Recurso não encontrado.' }, 404);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return json({ message: 'Entre na sua conta para continuar.' }, 401);
  try {
    const raw = await request.text();
    if (raw.length > 12000) return json({ message: 'Pedido muito grande.' }, 413);
    let body;
    try { body = JSON.parse(raw); } catch { return json({ message: 'Dados inválidos.' }, 400); }
    if (action === 'methods') {
      if (!body || !['CREDITO', 'DEBITO', 'PIX'].includes(body.type) || Object.keys(body).some(field => !['type', 'last4'].includes(field)) || (body.type === 'PIX' ? body.last4 !== undefined : !/^\d{4}$/.test(body.last4))) return json({ message: 'Método de pagamento inválido.' }, 422);
      const last4 = body.type === 'PIX' ? '0000' : body.last4;
      return json(await backendAuth('/users/me/payment-methods', { token, method: 'POST', body: { type: body.type, setupReference: `sim:${body.type}:${last4}:${randomUUID()}` } }), 201);
    }
    if (action === 'reconcile') {
      if (!body || !id(body.paymentId) || Object.keys(body).some(field => field !== 'paymentId')) return json({ message: 'Pagamento inválido.' }, 422);
      return json(await backendAuth(`/payments/${body.paymentId}/reconcile`, { token, method: 'POST', body: {} }));
    }
    if (action === 'pay') {
      if (!body || !id(body.orderId) || !smallId(body.methodId) || Object.keys(body).some(field => !['orderId', 'methodId'].includes(field))) return json({ message: 'Método ou pedido inválido.' }, 422);
      const idempotencyKey = request.headers.get('Idempotency-Key');
      if (!key(idempotencyKey)) return json({ message: 'Identificador do pagamento inválido.' }, 422);
      return json(await backendAuth('/payments', { token, method: 'POST', body, idempotencyKey }), 202);
    }
    const { acceptance, ...order } = body || {};
    if (!validCartOrder(order)) return json({ message: 'Confira os itens do carrinho.' }, 422);
    if (action === 'quote') {
      if (acceptance !== undefined) return json({ message: 'Cotação inválida.' }, 422);
      const quote = await backendAuth('/orders/quote', { token, method: 'POST', body: order });
      if (!Array.isArray(quote.lines) || quote.lines.length !== order.lines.length || quote.lines.some((line, index) => line.category !== order.lines[index].kind || line.id !== order.lines[index].id || line.quantity !== order.lines[index].quantity || line.unitPrice == null)) throw new AuthError(503, 'Cotação incompatível com os itens do pedido.');
      return json(quote);
    }
    if (!acceptance || acceptance.accepted !== true || typeof acceptance.offerHash !== 'string' || !/^[a-f0-9]{64}$/.test(acceptance.offerHash)) return json({ message: 'Aceite da oferta obrigatório.' }, 422);
    const idempotencyKey = request.headers.get('Idempotency-Key');
    if (!key(idempotencyKey)) return json({ message: 'Identificador do pedido inválido.' }, 422);
    return json(await backendAuth('/orders/checkout', { token, method: 'POST', body: { ...order, acceptance }, idempotencyKey }), 201);
  } catch (error) { return failure(error); }
}
