import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authErrorPayload, AuthError, backendAuth, SESSION_COOKIE } from '@/lib/auth/server';
import { isAllowedAuthOrigin } from '@/lib/auth/request-origin.mjs';

const json = (data, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const destinations = '/admin/reports/social-destinations';
const targets = { finance: '/admin/reports/finance', social: '/admin/reports/social-allocation', audit: '/admin/audit-logs', http: '/admin/http-logs', destinations };

function target(method, [section, id, detail, ...rest]) {
  if (!id && method === 'GET' && Object.hasOwn(targets, section)) return targets[section];
  if (section !== 'destinations' || rest.length) return null;
  if (method === 'POST' && !id) return destinations;
  if (!/^[1-9]\d{0,19}$/.test(id ?? '')) return null;
  if (method === 'PATCH' && !detail) return `${destinations}/${id}`;
  if (method === 'GET' && detail === 'history') return `${destinations}/${id}/history`;
  return null;
}

async function handle(request, { params }) {
  const method = request.method;
  if (method !== 'GET' && !isAllowedAuthOrigin(request)) return json({ message: 'Origem não permitida.' }, 403);
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return json({ message: 'Entre para acessar Relatórios.' }, 401);
  try {
    // Every report endpoint authorizes ADMIN before accessing the resource.
    const parts = (await params).path ?? [];
    const path = target(method, parts);
    if (!path) return json({ message: 'Operação inválida.' }, 422);
    if (method === 'GET') return json(await backendAuth(`${path}${new URL(request.url).search}`, { token }));
    const raw = await request.text();
    if (raw.length > 12000) return json({ message: 'Dados muito longos.' }, 413);
    let body;
    try { body = JSON.parse(raw); } catch { return json({ message: 'Dados inválidos.' }, 400); }
    return json(await backendAuth(path, { token, method, body }), method === 'POST' ? 201 : 200);
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 500;
    const messages = { 401: 'Sua sessão expirou. Entre novamente.', 403: 'Acesso negado.', 404: 'Destinação não encontrada.', 409: 'A destinação mudou. Atualize a lista e reabra o cadastro.', 422: method === 'GET' ? 'Confira período e filtros informados.' : 'Confira os dados da destinação.' };
    return json(authErrorPayload(error, { message: messages[status] ?? 'Não foi possível concluir a operação.' }), status);
  }
}

export { handle as GET, handle as POST, handle as PATCH };
