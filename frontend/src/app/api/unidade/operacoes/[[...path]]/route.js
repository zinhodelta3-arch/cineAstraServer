import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthError, backendAuth, currentUser, SESSION_COOKIE } from '@/lib/auth/server';
import { isAllowedAuthOrigin } from '@/lib/auth/request-origin.mjs';

const json = (data, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const id = value => typeof value === 'string' && /^[1-9]\d{0,9}$/.test(value) && BigInt(value) <= 4294967295n;

function target(parts, method, search) {
  const [section, first, second, third, fourth] = parts;
  if (section === 'sessions') {
    if (parts.length === 1 && ['GET', 'POST'].includes(method)) return `/unit/sessions${method === 'GET' ? search : ''}`;
    if (parts.length === 2 && id(first) && ['GET', 'PATCH', 'DELETE'].includes(method)) return `/unit/sessions/${first}`;
  }
  if (section === 'combos') {
    if (parts.length === 1 && ['GET', 'POST'].includes(method)) return `/unit/combos${method === 'GET' ? search : ''}`;
    if (id(first) && parts.length === 2 && ['GET', 'PATCH', 'DELETE'].includes(method)) return `/unit/combos/${first}`;
    if (id(first) && parts.length === 3 && second === 'items' && method === 'PUT') return `/unit/combos/${first}/items`;
  }
  if (section === 'locations' && id(first) && second === 'rooms') {
    const base = `/unit/locations/${first}/rooms`;
    if (parts.length === 3 && ['GET', 'POST'].includes(method)) return `${base}${method === 'GET' ? search : ''}`;
    if (!id(third)) return null;
    if (parts.length === 4 && ['GET', 'PATCH', 'DELETE'].includes(method)) return `${base}/${third}`;
    if (fourth === 'seats') {
      if (parts.length === 5 && ['GET', 'POST'].includes(method)) return `${base}/${third}/seats${method === 'GET' ? search : ''}`;
      if (parts.length === 6 && id(parts[5]) && ['GET', 'PATCH', 'DELETE'].includes(method)) return `${base}/${third}/seats/${parts[5]}`;
    }
  }
  if (section === 'sources' && parts.length === 1 && method === 'GET') return `/unit/stock/sources${search}`;
  if (section === 'requests' && parts.length === 1 && ['GET', 'POST'].includes(method)) return `/stock/requests${method === 'GET' ? search : ''}`;
  if (section === 'logistics') {
    if (parts.length === 1 && method === 'GET') return `/logistics${search}`;
    if (parts.length === 3 && id(first) && second === 'receive' && method === 'POST') return `/logistics/${first}/receive`;
  }
  if (section === 'inventory') {
    if (first === 'movements' && parts.length === 2 && ['GET', 'POST'].includes(method)) return `/inventory/movements${method === 'GET' ? search : ''}`;
    if (first === 'alerts' && parts.length === 2 && method === 'GET') return `/inventory/alerts${search}`;
    if (['inputs', 'equipment'].includes(first) && parts.length === 3 && id(second) && method === 'GET') return `/inventory/${first}/${second}`;
  }
  if (parts.length === 1 && method === 'GET') {
    if (section === 'stock') return `/stock${search}`;
    if (section === 'films') return `/films${search}`;
  }
  return null;
}

async function handle(request, { params }) {
  const method = request.method;
  if (method !== 'GET' && !isAllowedAuthOrigin(request)) return json({ message: 'Origem não permitida.' }, 403);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return json({ message: 'Entre para acessar sua unidade.' }, 401);
  try {
    if ((await currentUser())?.role !== 'SUPERVISOR') return json({ message: 'Acesso restrito ao supervisor.' }, 403);
    const path = target((await params).path ?? [], method, new URL(request.url).search);
    if (!path) return json({ message: 'Operação inválida.' }, 422);
    let body;
    if (['POST', 'PATCH', 'PUT'].includes(method) && !/^\/logistics\/\d+\/receive$/.test(path)) {
      const raw = await request.text();
      if (raw.length > 20000) return json({ message: 'Dados muito longos.' }, 413);
      try { body = JSON.parse(raw); } catch { return json({ message: 'Dados inválidos.' }, 400); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ message: 'Dados inválidos.' }, 400);
    }
    const data = await backendAuth(path, { token, method, body });
    if (method === 'DELETE') return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
    return json(data, method === 'POST' && ['/unit/sessions', '/unit/combos', '/stock/requests', '/inventory/movements'].includes(path) || method === 'POST' && /\/rooms(?:\/\d+\/seats)?$/.test(path) ? 201 : 200);
  } catch (error) {
    return json({ message: error instanceof AuthError ? error.message : 'Não foi possível acessar a operação.' }, error instanceof AuthError ? error.status : 503);
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
