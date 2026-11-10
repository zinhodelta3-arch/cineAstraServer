import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authErrorPayload, AuthError, backendAuth, currentUser, SESSION_COOKIE } from '@/lib/auth/server';
import { isAllowedAuthOrigin } from '@/lib/auth/request-origin.mjs';

const json = (data, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const id = value => typeof value === 'string' && /^[1-9]\d{0,9}$/.test(value) && BigInt(value) <= 4294967295n;
const slugs = new Set(['business', 'team', 'history', 'reputation', 'partners', 'social-campaigns', 'terms', 'privacy', 'faq']);

function target(method, parts, search) {
  const [group, second, third] = parts;
  if (['banners', 'experiences', 'partners'].includes(group)) {
    if (parts.length === 1 && ['GET', 'POST'].includes(method)) return `/admin/${group}${method === 'GET' ? search : ''}`;
    if (parts.length === 2 && id(second) && ['GET', 'PATCH'].includes(method)) return `/admin/${group}/${second}`;
  }
  if (group === 'categories') {
    if (parts.length === 1 && ['GET', 'POST'].includes(method)) return `/admin/newsletter/categories${method === 'GET' ? search : ''}`;
    if (parts.length === 2 && id(second) && ['PATCH', 'DELETE'].includes(method)) return `/admin/newsletter/categories/${second}`;
  }
  if (group === 'campaigns') {
    if (parts.length === 1 && ['GET', 'POST'].includes(method)) return `/admin/newsletter/campaigns${method === 'GET' ? search : ''}`;
    if (parts.length === 2 && id(second) && ['GET', 'PATCH'].includes(method)) return `/admin/newsletter/campaigns/${second}`;
    if (parts.length === 3 && id(second) && ['schedule', 'cancel'].includes(third) && method === 'POST') return `/admin/newsletter/campaigns/${second}/${third}`;
  }
  if (group === 'content') {
    if (parts.length === 1 && method === 'POST') return '/admin/content';
    if (parts.length === 2 && slugs.has(second) && method === 'GET') return `/content/${second}`;
  }
  return null;
}

async function handle(request, { params }) {
  const method = request.method;
  if (method !== 'GET' && !isAllowedAuthOrigin(request)) return json({ message: 'Origem não permitida.' }, 403);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return json({ message: 'Entre para acessar Marketing.' }, 401);
  let path;
  try {
    if ((await currentUser())?.role !== 'ADMIN') return json({ message: 'Acesso restrito à administração.' }, 403);
    path = target(method, (await params).path ?? [], new URL(request.url).search);
    if (!path) return json({ message: 'Operação inválida.' }, 422);
    let body;
    if (['POST', 'PATCH'].includes(method) && !path.endsWith('/cancel')) {
      const raw = await request.text();
      if (raw.length > 220000) return json({ message: 'Dados muito longos.' }, 413);
      try { body = JSON.parse(raw); } catch { return json({ message: 'Dados inválidos.' }, 400); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ message: 'Dados inválidos.' }, 400);
    }
    const data = await backendAuth(path, { token, method, body });
    return json(data, method === 'POST' && !/\/(?:schedule|cancel)$/.test(path) ? 201 : 200);
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 500;
    if (method === 'GET' && path?.startsWith('/content/') && status === 404) return json({ published: false });
    const messages = { 401: 'Sua sessão expirou. Entre novamente.', 403: 'Acesso negado.', 404: 'Registro não encontrado.', 409: error.message, 422: 'Confira os dados informados.' };
    return json(authErrorPayload(error, { message: messages[status] ?? 'Não foi possível acessar Marketing.' }), status);
  }
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const DELETE = handle;
