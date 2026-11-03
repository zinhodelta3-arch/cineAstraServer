import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthError, backendAuth, currentUser, SESSION_COOKIE } from '@/lib/auth/server';
import { isAllowedAuthOrigin } from '@/lib/auth/request-origin.mjs';

const json = (data, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const id = value => typeof value === 'string' && /^[1-9]\d{0,19}$/.test(value) && BigInt(value) <= 18446744073709551615n;

function target(method, parts, search) {
  if (method === 'GET' && parts.length === 1 && parts[0] === 'orders') return `/admin/sales/orders${search}`;
  if (method === 'GET' && parts.length === 1 && parts[0] === 'payments') return `/admin/sales/payments${search}`;
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
    if (method === 'POST') {
      const raw = await request.text();
      if (raw.length > 4000) return json({ message: 'Dados muito longos.' }, 413);
      try { body = JSON.parse(raw); } catch { return json({ message: 'Dados inválidos.' }, 400); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ message: 'Dados inválidos.' }, 400);
    }
    return json(await backendAuth(path, { token, method, body }));
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 503;
    const messages = { 401: 'Sua sessão expirou. Entre novamente.', 403: 'Acesso negado.', 404: 'Registro não encontrado.', 409: 'O estado da venda mudou. Atualize os dados.', 422: 'Confira os dados informados.' };
    return json({ message: messages[status] ?? 'Não foi possível acessar Vendas.' }, status);
  }
}

export const GET = handle;
export const POST = handle;
