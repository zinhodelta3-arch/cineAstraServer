import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authErrorPayload, AuthError, backendAuth, SESSION_COOKIE } from '@/lib/auth/server';
import { isAllowedAuthOrigin } from '@/lib/auth/request-origin.mjs';

const id = value => typeof value === 'string' && /^[1-9]\d{0,9}$/.test(value) && Number(value) <= 4294967295;
const json = (value, status = 200) => NextResponse.json(value, { status, headers: { 'Cache-Control': 'private, no-store' } });
async function handle(request, { params }) {
  const method = request.method;
  if (method !== 'GET' && !isAllowedAuthOrigin(request)) return json({ message: 'Origem não permitida.' }, 403);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return json({ message: 'Entre na sua conta.' }, 401);
  const parts = (await params).path ?? [];
  const root = '/experience-requests';
  let path;
  if (method === 'GET' && !parts.length) path = root;
  else if (id(parts[0]) && parts.length === 1 && ['GET', 'PATCH'].includes(method)) path = root + '/' + parts[0];
  else if (id(parts[0]) && parts.length === 2 && parts[1] === 'messages' && method === 'POST') path = root + '/' + parts[0] + '/messages';
  if (!path) return json({ message: 'Operação não encontrada.' }, 404);
  const search = new URL(request.url).searchParams;
  if (method === 'GET' && search.has('cursor')) {
    if (!id(search.get('cursor'))) return json({ message: 'Página inválida.' }, 422);
    path += '?cursor=' + search.get('cursor');
  }
  try {
    let body;
    if (method !== 'GET') {
      const raw = await request.text();
      if (raw.length > 5000) return json({ message: 'Dados excessivos.' }, 413);
      try { body = JSON.parse(raw); } catch { return json({ message: 'Dados inválidos.' }, 400); }
    }
    return json(await backendAuth(path, { token, method, body }), method === 'POST' ? 201 : 200);
  } catch (error) {
    return json(authErrorPayload(error, { message: 'Não foi possível acessar a solicitação.' }), error instanceof AuthError ? error.status : 503);
  }
}
export const GET = handle;
export const PATCH = handle;
export const POST = handle;
