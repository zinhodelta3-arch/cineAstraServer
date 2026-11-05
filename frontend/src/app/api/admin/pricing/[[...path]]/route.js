import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthError, backendAuth, currentUser, SESSION_COOKIE } from '@/lib/auth/server';
import { isAllowedAuthOrigin } from '@/lib/auth/request-origin.mjs';

const json = (data, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const id = value => typeof value === 'string' && /^[1-9]\d{0,9}$/.test(value) && BigInt(value) <= 4294967295n;
const category = value => ['SESSION', 'INPUT', 'COMBO', 'RENTAL', 'PURCHASE', 'PLAN'].includes(value);
const kind = value => ['inputs', 'sessions', 'films', 'combos', 'plans'].includes(value);

function target(method, parts) {
  const [group, second, third] = parts;
  if (group === 'parameters') {
    if (parts.length === 1 && method === 'GET') return '/admin/pricing/parameters';
    if (parts.length === 2 && category(second) && method === 'PUT') return `/admin/pricing/parameters/${second}`;
  }
  if (group === 'costs' && parts.length === 3 && kind(second) && id(third) && ['GET', 'PUT'].includes(method)) return `/admin/pricing/costs/${second}/${third}`;
  if (group === 'publish' && parts.length === 3 && category(second) && id(third) && method === 'POST') return `/admin/pricing/publish/${second}/${third}`;
  if (['promotions', 'coupons'].includes(group)) {
    if (parts.length === 1 && ['GET', 'POST'].includes(method)) return `/admin/pricing/${group}`;
    if (parts.length === 2 && id(second) && ['PATCH', 'DELETE'].includes(method)) return `/admin/pricing/${group}/${second}`;
  }
  return null;
}

async function handle(request, { params }) {
  const method = request.method;
  if (method !== 'GET' && !isAllowedAuthOrigin(request)) return json({ message: 'Origem não permitida.' }, 403);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return json({ message: 'Entre para acessar Precificação.' }, 401);
  try {
    if ((await currentUser())?.role !== 'ADMIN') return json({ message: 'Acesso restrito à administração.' }, 403);
    let path = target(method, (await params).path ?? []);
    if (!path) return json({ message: 'Operação inválida.' }, 422);
    if(method==='GET'&&['/admin/pricing/promotions','/admin/pricing/coupons'].includes(path))path+=new URL(request.url).search;
    let body;
    if (['POST', 'PATCH', 'PUT'].includes(method) && !path.includes('/publish/')) {
      const raw = await request.text();
      if (raw.length > 10000) return json({ message: 'Dados muito longos.' }, 413);
      try { body = JSON.parse(raw); } catch { return json({ message: 'Dados inválidos.' }, 400); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ message: 'Dados inválidos.' }, 400);
    }
    const data = await backendAuth(path, { token, method, body });
    return method === 'DELETE' ? new NextResponse(null, { status: 204 }) : json(data);
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 503;
    const messages = { 401: 'Sua sessão expirou. Entre novamente.', 403: 'Acesso negado.', 404: 'Registro não encontrado.', 409: error.message, 422: 'Confira os dados informados.' };
    return json({ message: messages[status] ?? 'Não foi possível acessar Precificação.' }, status);
  }
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
