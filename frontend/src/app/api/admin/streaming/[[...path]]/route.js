import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authErrorPayload, AuthError, backendAuth, currentUser, SESSION_COOKIE } from '@/lib/auth/server';
import { isAllowedAuthOrigin } from '@/lib/auth/request-origin.mjs';

const json = (data, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const id = value => typeof value === 'string' && /^[1-9]\d{0,9}$/.test(value) && BigInt(value) <= 4294967295n;

function target(method, parts, search) {
  if (parts[0] === 'plans') {
    if (parts.length === 1 && ['GET', 'POST'].includes(method)) return `/admin/plans${method === 'GET' ? search : ''}`;
    if (parts.length === 2 && id(parts[1]) && ['GET', 'PATCH', 'DELETE'].includes(method)) return `/admin/plans/${parts[1]}`;
  }
  if (method === 'GET' && parts.length === 1 && ['subscriptions', 'accesses'].includes(parts[0])) return `/admin/streaming/${parts[0]}${search}`;
  return null;
}

async function handle(request, { params }) {
  const method = request.method;
  if (method !== 'GET' && !isAllowedAuthOrigin(request)) return json({ message: 'Origem não permitida.' }, 403);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return json({ message: 'Entre para acessar Streaming.' }, 401);
  try {
    if ((await currentUser())?.role !== 'ADMIN') return json({ message: 'Acesso restrito à administração.' }, 403);
    const path = target(method, (await params).path ?? [], new URL(request.url).search);
    if (!path) return json({ message: 'Operação inválida.' }, 422);
    let body;
    if (['POST', 'PATCH'].includes(method)) {
      const raw = await request.text();
      if (raw.length > 9000) return json({ message: 'Dados muito longos.' }, 413);
      try { body = JSON.parse(raw); } catch { return json({ message: 'Dados inválidos.' }, 400); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ message: 'Dados inválidos.' }, 400);
    }
    const data = await backendAuth(path, { token, method, body });
    return method === 'DELETE' ? new NextResponse(null, { status: 204 }) : json(data);
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 500;
    const messages = { 401: 'Sua sessão expirou. Entre novamente.', 403: 'Acesso negado.', 404: 'Registro não encontrado.', 409: error.message, 422: 'Confira os dados informados.' };
    return json(authErrorPayload(error, { message: messages[status] ?? 'Não foi possível acessar Streaming.' }), status);
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
