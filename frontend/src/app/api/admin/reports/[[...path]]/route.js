import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AuthError, backendAuth, currentUser, SESSION_COOKIE } from '@/lib/auth/server';

const json = (data, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
const targets = { finance: '/admin/reports/finance', social: '/admin/reports/social-allocation', audit: '/admin/audit-logs', http: '/admin/http-logs' };

export async function GET(request, { params }) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return json({ message: 'Entre para acessar Relatórios.' }, 401);
  try {
    if ((await currentUser())?.role !== 'ADMIN') return json({ message: 'Acesso restrito à administração.' }, 403);
    const parts = (await params).path ?? [];
    if (parts.length !== 1 || !Object.hasOwn(targets, parts[0])) return json({ message: 'Consulta inválida.' }, 422);
    const data = await backendAuth(`${targets[parts[0]]}${new URL(request.url).search}`, { token });
    return json(data);
  } catch (error) {
    const status = error instanceof AuthError ? error.status : 503;
    const messages = { 401: 'Sua sessão expirou. Entre novamente.', 403: 'Acesso negado.', 422: 'Confira período e filtros informados.' };
    return json({ message: messages[status] ?? 'Não foi possível consultar o relatório.' }, status);
  }
}
