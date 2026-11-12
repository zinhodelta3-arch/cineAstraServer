import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authErrorPayload, AuthError, backendAuth, currentUser, SESSION_COOKIE } from '@/lib/auth/server';
import { isAllowedAuthOrigin } from '@/lib/auth/request-origin.mjs';

const json = (data, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const id = value => typeof value === 'string' && /^[1-9]\d{0,9}$/.test(value) && BigInt(value) <= 4294967295n;

function target(method, parts, search) {
  const [group, second, third] = parts;
  if (group === 'me' && parts.length === 1 && method === 'GET') return '/suppliers/me';
  if (group === 'transports') {
    if (parts.length === 1 && ['GET','POST'].includes(method)) return `/suppliers/me/transports${method==='GET'?search:''}`;
    if (parts.length === 2 && id(second) && ['GET','PATCH','DELETE'].includes(method)) return `/suppliers/me/transports/${second}`;
  }
  if (group === 'locations') {
    if (parts.length === 1 && method === 'GET') return `/suppliers/me/locations${search}`;
    if (parts.length === 2 && id(second) && method === 'GET') return `/locations/${second}`;
  }
  if (['inputs', 'equipment'].includes(group)) {
    if (parts.length === 1 && ['GET', 'POST'].includes(method)) return `/${group}${method === 'GET' ? search : ''}`;
    if (parts.length === 2 && id(second) && ['GET', 'PATCH', 'DELETE'].includes(method)) return `/${group}/${second}`;
  }
  if (group === 'inventory') {
    if (second === 'movements' && parts.length === 2 && ['GET', 'POST'].includes(method)) return `/inventory/movements${method === 'GET' ? search : ''}`;
    if (second === 'alerts' && parts.length === 2 && method === 'GET') return `/inventory/alerts${search}`;
    if (['inputs', 'equipment'].includes(second) && parts.length === 3 && id(third) && method === 'GET') return `/inventory/${second}/${third}`;
  }
  if (group === 'requests') {
    if (parts.length === 1 && method === 'GET') return `/stock/requests${search}`;
    if (parts.length === 2 && id(second) && method === 'GET') return `/stock/requests/${second}`;
    if (parts.length === 3 && id(second) && ['approve', 'refuse'].includes(third) && method === 'POST') return `/stock/requests/${second}/${third}`;
  }
  if (group === 'logistics') {
    if (parts.length === 1 && method === 'GET') return `/logistics${search}`;
    if (parts.length === 2 && id(second) && method === 'GET') return `/logistics/${second}`;
    if (parts.length === 3 && id(second) && third === 'history' && method === 'GET') return `/logistics/${second}/history${search}`;
    if (parts.length === 3 && id(second) && ['send', 'transit', 'return', 'cancel', 'incidents'].includes(third) && method === 'POST') return `/logistics/${second}/${third}`;
  }
  return null;
}

async function handle(request, { params }) {
  const method = request.method;
  if (method !== 'GET' && !isAllowedAuthOrigin(request)) return json({ message: 'Origem não permitida.' }, 403);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return json({ message: 'Entre para acessar sua área.' }, 401);
  try {
    if ((await currentUser())?.role !== 'FORNECEDOR') return json({ message: 'Acesso restrito ao fornecedor.' }, 403);
    const path = target(method, (await params).path ?? [], new URL(request.url).search);
    if (!path) return json({ message: 'Operação inválida.' }, 422);
    let body;
    if (['POST', 'PATCH'].includes(method) && !/\/(?:approve|refuse|transit|return|cancel)$/.test(path)) {
      const raw = await request.text();
      if (raw.length > 25000) return json({ message: 'Dados muito longos.' }, 413);
      try { body = JSON.parse(raw); } catch { return json({ message: 'Dados inválidos.' }, 400); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ message: 'Dados inválidos.' }, 400);
    }
    const data = await backendAuth(path, { token, method, body });
    return method === 'DELETE' ? new NextResponse(null, { status: 204 }) : json(data, method === 'POST' && path.endsWith('/incidents') ? 201 : 200);
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 500;
    const messages = { 401: 'Sua sessão expirou. Entre novamente.', 403: 'Acesso negado.', 404: 'Registro não encontrado.', 409: error.message, 422: 'Confira os dados informados.' };
    return json(authErrorPayload(error, { message: messages[status] ?? 'Não foi possível concluir a operação.' }), status);
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
