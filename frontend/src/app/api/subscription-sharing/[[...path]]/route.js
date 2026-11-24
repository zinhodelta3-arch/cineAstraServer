import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isAllowedAuthOrigin } from '@/lib/auth/request-origin.mjs';
import { authErrorPayload, AuthError, backendAuth, SESSION_COOKIE } from '@/lib/auth/server';

const json = (body, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
const small = /^[1-9]\d{0,9}$/;
const big = /^[1-9]\d{0,19}$/;

function target(path, method, query) {
  const [area, id, resource, detail, action] = path;
  if (area === 'invitations') {
    if (method === 'GET' && path.length === 1) return `/subscription-invitations/me${query}`;
    if (method === 'POST' && path.length === 3 && big.test(id) && ['accept', 'decline'].includes(resource)) {
      return `/subscription-invitations/${id}/${resource}`;
    }
  }
  if (area !== 'subscriptions' || !small.test(id)) return null;
  const prefix = `/subscriptions/${id}`;
  if (method === 'GET') {
    if (path.length === 3 && ['participants', 'next-cycle'].includes(resource)) return `${prefix}/${resource}`;
    if (path.length === 4 && resource === 'division-proposals' && detail === 'pending') return `${prefix}/division-proposals/pending`;
  }
  if (method === 'POST') {
    if (path.length === 3 && ['invitations', 'division-proposals'].includes(resource)) return `${prefix}/${resource}`;
    if (path.length === 5 && resource === 'participants' &&
        (detail === 'me' ? action === 'leave' : small.test(detail) && ['suspend', 'resume', 'remove'].includes(action))) {
      return `${prefix}/participants/${detail}/${action}`;
    }
    if (path.length === 5 && big.test(detail) &&
        ((resource === 'division-proposals' && action === 'consent') || (resource === 'invitations' && action === 'cancel'))) {
      return `${prefix}/${resource}/${detail}/${action}`;
    }
  }
  return null;
}

async function handle(request, { params }) {
  const { method } = request;
  if (method === 'POST' && !isAllowedAuthOrigin(request)) return json({ message: 'Origem não permitida.' }, 403);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return json({ message: 'Entre na sua conta.' }, 401);
  try {
    const path = target((await params).path ?? [], method, new URL(request.url).search);
    if (!path) return json({ message: 'Recurso indisponível.' }, 404);
    let body;
    if (method === 'POST') {
      const raw = await request.text();
      if (raw.length > 512) return json({ message: 'Dados muito longos.' }, 413);
      if (raw) {
        try { body = JSON.parse(raw); } catch { return json({ message: 'Dados inválidos.' }, 400); }
      }
    }
    return json(await backendAuth(path, { token, method, body, signal: request.signal }));
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 500;
    const message = status === 404 ? 'Convite, conta ou assinatura indisponível.' :
      [403, 409, 422].includes(status) ? error.message : 'Não foi possível acessar o compartilhamento.';
    return json(authErrorPayload(error, { message }), status);
  }
}

export const GET = handle;
export const POST = handle;
