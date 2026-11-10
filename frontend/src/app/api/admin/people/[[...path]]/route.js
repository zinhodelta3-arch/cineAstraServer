import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authErrorPayload, AuthError, backendAuth, currentUser, SESSION_COOKIE } from '@/lib/auth/server';
import { isAllowedAuthOrigin } from '@/lib/auth/request-origin.mjs';

const json = (data, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const id = (value, max) => typeof value === 'string' && /^[1-9]\d{0,19}$/.test(value) && BigInt(value) <= max;
const userId = value => id(value, 4294967295n);
const requestId = value => id(value, 18446744073709551615n);

function target(method, parts, search) {
  const [group, second, third] = parts;
  if (group === 'users') {
    if (parts.length === 1 && ['GET', 'POST'].includes(method)) return `/admin/users${method === 'GET' ? search : ''}`;
    if (parts.length === 2 && userId(second) && ['GET', 'PATCH'].includes(method)) return `/admin/users/${second}`;
    if (parts.length === 3 && userId(second) && third === 'access' && method === 'PATCH') return `/admin/users/${second}/access`;
    if (parts.length === 3 && userId(second) && third === 'location' && ['GET', 'PATCH'].includes(method)) return `/admin/users/${second}/location`;
  }
  if (group === 'privacy') {
    if (parts.length === 1 && method === 'GET') return `/admin/privacy-requests${search}`;
    if (parts.length === 2 && requestId(second) && method === 'GET') return `/admin/privacy-requests/${second}`;
  }
  return null;
}

async function handle(request, { params }) {
  const method = request.method;
  if (method !== 'GET' && !isAllowedAuthOrigin(request)) return json({ message: 'Origem não permitida.' }, 403);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return json({ message: 'Entre para acessar Usuários.' }, 401);
  try {
    if ((await currentUser())?.role !== 'ADMIN') return json({ message: 'Acesso restrito à administração.' }, 403);
    const path = target(method, (await params).path ?? [], new URL(request.url).search);
    if (!path) return json({ message: 'Operação inválida.' }, 422);
    let body;
    if (method !== 'GET') {
      const raw = await request.text();
      if (raw.length > 5000) return json({ message: 'Dados muito longos.' }, 413);
      try { body = JSON.parse(raw); } catch { return json({ message: 'Dados inválidos.' }, 400); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ message: 'Dados inválidos.' }, 400);
    }
    return json(await backendAuth(path, { token, method, body }), method === 'POST' ? 201 : 200);
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 500;
    const messages = { 401: 'Sua sessão expirou. Entre novamente.', 403: 'Acesso negado.', 404: 'Registro não encontrado.', 409: error.message, 422: 'Confira os dados informados.' };
    return json(authErrorPayload(error, { message: messages[status] ?? 'Não foi possível acessar Usuários.' }), status);
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
