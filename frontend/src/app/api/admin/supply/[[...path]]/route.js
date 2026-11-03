import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthError, backendAuth, currentUser, SESSION_COOKIE } from '@/lib/auth/server';
import { isAllowedAuthOrigin } from '@/lib/auth/request-origin.mjs';

const json = (data, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const id = value => typeof value === 'string' && /^[1-9]\d{0,9}$/.test(value) && BigInt(value) <= 4294967295n;

function target(method, parts, search) {
  const [group, second, third, fourth] = parts;
  if (group === 'users' && parts.length === 1 && method === 'GET') return `/admin/users${search}`;
  if (group === 'suppliers') {
    if (parts.length === 1 && ['GET', 'POST'].includes(method)) return `/admin/suppliers${method === 'GET' ? search : ''}`;
    if (parts.length === 2 && id(second) && ['GET', 'PATCH', 'DELETE'].includes(method)) return `/admin/suppliers/${second}`;
    if (parts.length === 3 && id(second) && third === 'locations' && ['GET', 'POST'].includes(method)) return `/admin/suppliers/${second}/locations${method === 'GET' ? search : ''}`;
    if (parts.length === 4 && id(second) && third === 'locations' && id(fourth) && method === 'DELETE') return `/admin/suppliers/${second}/locations/${fourth}`;
  }
  if (group === 'equipment') {
    if (parts.length === 1 && ['GET', 'POST'].includes(method)) return `/equipment${method === 'GET' ? search : ''}`;
    if (parts.length === 2 && id(second) && ['GET', 'PATCH', 'DELETE'].includes(method)) return `/equipment/${second}`;
  }
  if (group === 'inventory' && second === 'equipment' && parts.length === 3 && id(third) && method === 'GET') return `/inventory/equipment/${third}`;
  if (group === 'inventory' && second === 'movements' && parts.length === 2 && method === 'POST') return '/inventory/movements';
  if (group === 'requests') {
    if (parts.length === 1 && ['GET', 'POST'].includes(method)) return `/stock/requests${method === 'GET' ? search : ''}`;
    if (parts.length === 2 && id(second) && method === 'GET') return `/stock/requests/${second}`;
    if (parts.length === 3 && id(second) && ['approve', 'refuse'].includes(third) && method === 'POST') return `/stock/requests/${second}/${third}`;
  }
  if (group === 'logistics') {
    if (parts.length === 1 && method === 'GET') return `/logistics${search}`;
    if (parts.length === 2 && id(second) && method === 'GET') return `/logistics/${second}`;
    if (parts.length === 3 && id(second) && ['send', 'transit', 'receive', 'return', 'cancel'].includes(third) && method === 'POST') return `/logistics/${second}/${third}`;
  }
  return null;
}

async function handle(request, { params }) {
  const method = request.method;
  if (method !== 'GET' && !isAllowedAuthOrigin(request)) return json({ message: 'Origem não permitida.' }, 403);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return json({ message: 'Entre para acessar Suprimentos.' }, 401);
  try {
    if ((await currentUser())?.role !== 'ADMIN') return json({ message: 'Acesso restrito à administração.' }, 403);
    const path = target(method, (await params).path ?? [], new URL(request.url).search);
    if (!path) return json({ message: 'Operação inválida.' }, 422);
    let body;
    if (['POST', 'PATCH', 'PUT'].includes(method) && !/(?:\/approve|\/refuse|\/send|\/transit|\/receive|\/return|\/cancel)$/.test(path)) {
      const raw = await request.text();
      if (raw.length > 13000) return json({ message: 'Dados muito longos.' }, 413);
      try { body = JSON.parse(raw); } catch { return json({ message: 'Dados inválidos.' }, 400); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ message: 'Dados inválidos.' }, 400);
    }
    const data = await backendAuth(path, { token, method, body });
    return method === 'DELETE' ? new NextResponse(null, { status: 204 }) : json(data);
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 503;
    const messages = { 401: 'Sua sessão expirou. Entre novamente.', 403: 'Acesso negado.', 404: 'Registro não encontrado.', 409: error.message, 422: 'Confira os dados informados.' };
    return json({ message: messages[status] ?? 'Não foi possível acessar Suprimentos.' }, status);
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
