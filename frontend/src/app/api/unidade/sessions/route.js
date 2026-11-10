import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { authErrorPayload, AuthError, backendAuth, currentUser, SESSION_COOKIE } from '@/lib/auth/server';

const json = (data, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
export async function GET(request) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return json({ message: 'Entre para acessar sua unidade.' }, 401);
  try {
    if (!['SUPERVISOR','COLABORADOR'].includes((await currentUser())?.role)) return json({ message: 'Acesso restrito ao supervisor.' }, 403);
    const params = new URL(request.url).searchParams;
    const cursor = params.get('cursor');
    const limit = params.get('limit') ?? '100';
    if ([...params.keys()].some(key => !['cursor', 'limit'].includes(key)) || cursor && !/^[1-9]\d{0,9}$/.test(cursor) || !/^\d{1,3}$/.test(limit) || Number(limit) < 1 || Number(limit) > 100) return json({ message: 'Filtro inválido.' }, 422);
    const context = await backendAuth('/teams/context', { token });
    const localId = context.locations?.[0]?.id_local;
    if (!localId) return json({ items: [], pagination: { nextCursor: null } });
    return json(await backendAuth(`/unit/sessions?localId=${encodeURIComponent(localId)}&limit=${limit}${cursor ? `&cursor=${cursor}` : ''}`, { token }));
  } catch (error) {
    return json(authErrorPayload(error, { message: error instanceof AuthError ? error.message : 'Não foi possível consultar as sessões.' }), error instanceof AuthError ? error.status : 500);
  }
}
