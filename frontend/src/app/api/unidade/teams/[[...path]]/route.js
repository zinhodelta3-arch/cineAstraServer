import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthError, backendAuth, currentUser, SESSION_COOKIE } from '@/lib/auth/server';
import { isAllowedAuthOrigin } from '@/lib/auth/request-origin.mjs';

const json = (data, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const id = value => typeof value === 'string' && /^[1-9]\d{0,9}$/.test(value) && BigInt(value) <= 4294967295n;
const entryId = value => typeof value === 'string' && /^[1-9]\d{0,19}$/.test(value) && BigInt(value) <= 18446744073709551615n;

function target(method, parts, search) {
  const [teamId, section, recordId, action] = parts;
  if (!parts.length && ['GET', 'POST'].includes(method)) return `/teams${method === 'GET' ? search : ''}`;
  if (parts.length === 1 && teamId === 'context' && method === 'GET' && !search) return '/teams/context';
  if (parts.length === 1 && teamId === 'collaborator' && method === 'GET') {
    const query = new URLSearchParams(search);
    const email = query.get('email');
    return query.size === 1 && email && email.length <= 150 ? `/teams/collaborator?email=${encodeURIComponent(email)}` : null;
  }
  if (!id(teamId)) return null;
  const base = `/teams/${teamId}`;
  if (parts.length === 1 && ['GET', 'PATCH'].includes(method)) return base;
  if (section === 'members') {
    if (parts.length === 2 && method === 'GET') return `${base}/members${search}`;
    if (parts.length === 3 && id(recordId) && method === 'PATCH') return `${base}/members/${recordId}`;
  }
  if (section === 'entries') {
    if (parts.length === 2 && method === 'GET') return `${base}/entries${search}`;
    if (parts.length === 3 && recordId === 'invitations' && method === 'POST') return `${base}/entries/invitations`;
    if (parts.length === 4 && entryId(recordId) && action === 'decision' && method === 'POST') return `${base}/entries/${recordId}/decision`;
  }
  if (section === 'chamados') {
    if (parts.length === 2 && ['GET', 'POST'].includes(method)) return `${base}/chamados${method === 'GET' ? search : ''}`;
    if (!id(recordId)) return null;
    if (parts.length === 3 && ['GET', 'PATCH'].includes(method)) return `${base}/chamados/${recordId}`;
    if (parts.length === 4 && ['accept', 'resolve', 'close', 'assign'].includes(action) && method === 'POST') return `${base}/chamados/${recordId}/${action}`;
  }
  return null;
}

async function handle(request, { params }) {
  const method = request.method;
  if (method !== 'GET' && !isAllowedAuthOrigin(request)) return json({ message: 'Origem não permitida.' }, 403);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return json({ message: 'Entre para acessar sua unidade.' }, 401);
  try {
    const user = await currentUser();
    if (!['SUPERVISOR', 'COLABORADOR'].includes(user?.role)) return json({ message: 'Acesso restrito à equipe da unidade.' }, 403);
    const path = target(method, (await params).path ?? [], new URL(request.url).search);
    if (!path) return json({ message: 'Operação inválida.' }, 422);
    if (user.role === 'COLABORADOR' && (method === 'PATCH' && !path.includes('/chamados/') || method === 'POST' && (path === '/teams' || path.endsWith('/invitations') || path.endsWith('/assign')))) return json({ message: 'Operação reservada ao supervisor.' }, 403);
    let body;
    if (['POST', 'PATCH'].includes(method) && !/\/(?:accept|resolve|close)$/.test(path)) {
      const raw = await request.text();
      if (raw.length > 12000) return json({ message: 'Dados muito longos.' }, 413);
      try { body = JSON.parse(raw); } catch { return json({ message: 'Dados inválidos.' }, 400); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ message: 'Dados inválidos.' }, 400);
    }
    const data = await backendAuth(path, { token, method, body });
    return json(data, method === 'POST' && (path === '/teams' || path.endsWith('/invitations') || path.endsWith('/chamados')) ? 201 : 200);
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 503;
    return json({ message: error instanceof AuthError ? error.message : 'Não foi possível acessar sua unidade.' }, status);
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
