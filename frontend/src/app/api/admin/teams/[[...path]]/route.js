import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthError, backendAuth, currentUser, SESSION_COOKIE } from '@/lib/auth/server';
import { isAllowedAuthOrigin } from '@/lib/auth/request-origin.mjs';

const json = (data, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const small = value => typeof value === 'string' && /^[1-9]\d{0,9}$/.test(value) && BigInt(value) <= 4294967295n;
const big = value => typeof value === 'string' && /^[1-9]\d{0,19}$/.test(value) && BigInt(value) <= 18446744073709551615n;

function target(method, parts, search) {
  const [group, teamId, section, recordId, action] = parts;
  if (group !== 'teams') return null;
  if (parts.length === 1 && ['GET', 'POST'].includes(method)) return `/teams${method === 'GET' ? search : ''}`;
  if (!small(teamId)) return null;
  const base = `/teams/${teamId}`;
  if (parts.length === 2 && ['GET', 'PATCH', 'DELETE'].includes(method)) return base;
  if (section === 'members') {
    if (parts.length === 3 && method === 'GET') return `${base}/members${search}`;
    if (parts.length === 4 && small(recordId) && ['PATCH', 'DELETE'].includes(method)) return `${base}/members/${recordId}`;
  }
  if (section === 'entries') {
    if (parts.length === 3 && method === 'GET') return `${base}/entries${search}`;
    if (parts.length === 4 && ['invitations', 'requests'].includes(recordId) && method === 'POST') return `${base}/entries/${recordId}`;
    if (parts.length === 4 && big(recordId) && method === 'DELETE') return `${base}/entries/${recordId}`;
    if (parts.length === 5 && big(recordId) && action === 'decision' && method === 'POST') return `${base}/entries/${recordId}/decision`;
  }
  if (section === 'tasks') {
    const taskBase = `${base}/chamados`;
    if (parts.length === 3 && ['GET', 'POST'].includes(method)) return `${taskBase}${method === 'GET' ? search : ''}`;
    if (parts.length === 4 && small(recordId) && ['GET', 'PATCH', 'DELETE'].includes(method)) return `${taskBase}/${recordId}`;
    if (parts.length === 5 && small(recordId) && action === 'assign' && method === 'POST') return `${taskBase}/${recordId}/assign`;
    if (parts.length === 5 && small(recordId) && action === 'close' && method === 'POST') return `${taskBase}/${recordId}/close`;
    if (parts.length === 5 && small(recordId) && action === 'history' && method === 'GET') return `${taskBase}/${recordId}/history${search}`;
  }
  return null;
}

async function handle(request, { params }) {
  const method = request.method;
  if (method !== 'GET' && !isAllowedAuthOrigin(request)) return json({ message: 'Origem não permitida.' }, 403);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return json({ message: 'Entre para acessar Equipes.' }, 401);
  try {
    if ((await currentUser())?.role !== 'ADMIN') return json({ message: 'Acesso restrito à administração.' }, 403);
    const path = target(method, (await params).path ?? [], new URL(request.url).search);
    if (!path) return json({ message: 'Operação inválida.' }, 422);
    let body;
    if (['POST', 'PATCH'].includes(method) && !path.endsWith('/close')) {
      const raw = await request.text();
      if (raw.length > 12000) return json({ message: 'Dados muito longos.' }, 413);
      try { body = JSON.parse(raw); } catch { return json({ message: 'Dados inválidos.' }, 400); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ message: 'Dados inválidos.' }, 400);
    }
    const data = await backendAuth(path, { token, method, body });
    return data == null ? new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } }) : json(data, method === 'POST' && (path === '/teams' || /\/(?:invitations|requests|chamados)$/.test(path)) ? 201 : 200);
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 503;
    const messages = { 401: 'Sua sessão expirou. Entre novamente.', 403: 'Acesso negado.', 404: 'Registro não encontrado.', 409: error.message, 422: 'Confira os dados informados.' };
    return json({ message: messages[status] ?? 'Não foi possível acessar Equipes.' }, status);
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
