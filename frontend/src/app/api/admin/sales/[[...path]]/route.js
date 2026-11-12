import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authErrorPayload, AuthError, backendAuth, currentUser, SESSION_COOKIE } from '@/lib/auth/server';
import { isAllowedAuthOrigin } from '@/lib/auth/request-origin.mjs';

const json = (data, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const id = value => typeof value === 'string' && /^[1-9]\d{0,19}$/.test(value) && BigInt(value) <= 18446744073709551615n;

function target(method, parts, search) {
  if (method === 'GET' && parts.length === 1 && parts[0] === 'orders') return `/admin/sales/orders${search}`;
  if (method === 'GET' && parts.length === 1 && parts[0] === 'payments') return `/admin/sales/payments${search}`;
  if (method === 'POST' && parts.length === 1 && parts[0] === 'orders') return '/admin/sales/orders';
  if (method === 'PATCH' && parts.length === 2 && parts[0] === 'orders' && id(parts[1])) return `/admin/sales/orders/${parts[1]}`;
  if (parts.length === 3 && id(parts[1])) {
    if (parts[0] === 'orders' && parts[2] === 'cancel' && method === 'POST') return `/admin/sales/orders/${parts[1]}/cancel`;
    if (parts[0] === 'payments' && (parts[2] === 'notes' && ['GET','POST'].includes(method) || parts[2] === 'reconcile' && method === 'POST')) return `/admin/sales/payments/${parts[1]}/${parts[2]}`;
  }
  if (parts[0] !== 'refunds') return null;
  if (method === 'GET' && parts.length === 1) return `/admin/refunds${search}`;
  if (method === 'GET' && parts.length === 2 && id(parts[1])) return `/admin/refunds/${parts[1]}`;
  if (method === 'POST' && parts.length === 3 && id(parts[1]) && parts[2] === 'decision') return `/admin/refunds/${parts[1]}/decision`;
  return null;
}

async function handle(request, { params }) {
  const method = request.method;
  if (method !== 'GET' && !isAllowedAuthOrigin(request)) return json({ message: 'Origem não permitida.' }, 403);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return json({ message: 'Entre para acessar Vendas.' }, 401);
  try {
    if ((await currentUser())?.role !== 'ADMIN') return json({ message: 'Acesso restrito à administração.' }, 403);
    const path = target(method, (await params).path ?? [], new URL(request.url).search);
    if (!path) return json({ message: 'Operação inválida.' }, 422);
    let body;
    if (['POST','PATCH'].includes(method)) {
      const raw = await request.text();
      if (raw.length > 14000) return json({ message: 'Dados muito longos.' }, 413);
      try { body = JSON.parse(raw); } catch { return json({ message: 'Dados inválidos.' }, 400); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ message: 'Dados inválidos.' }, 400);
    }
    const createsRecord = method === 'POST' && (path === '/admin/sales/orders' || path.endsWith('/notes'));
    return json(await backendAuth(path, { token, method, body }), createsRecord ? 201 : 200);
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 500;
    const messages = { 401: 'Sua sessão expirou. Entre novamente.', 403: 'Acesso negado.', 404: 'Registro não encontrado.', 409: error instanceof AuthError ? error.message : 'O estado da venda mudou. Atualize os dados.', 422: 'Confira os dados informados.' };
    return json(authErrorPayload(error, { message: messages[status] ?? 'Não foi possível acessar Vendas.' }), status);
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
