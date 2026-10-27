import 'server-only';
import { registrationErrorMessage } from './registration-errors.mjs';
import { resolveApiBase } from '@/lib/api/api-base.mjs';
import { cookies } from 'next/headers';
export const SESSION_COOKIE = 'cineastra_session';
export const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/' };
export class AuthError extends Error { constructor(status, message) { super(message); this.status = status; } }
export async function backendAuth(path, { token, body, method = 'GET' } = {}) {
 const base = resolveApiBase(process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL);
 if (!base || !/^https?:\/\//.test(base)) throw new AuthError(503, 'Serviço de autenticação indisponível.');
 let response;
 try { response = await fetch(`${base.replace(/\/$/,'')}${path}`, { method, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000), headers: { Accept: 'application/json', ...(body ? {'Content-Type':'application/json'} : {}), ...(token ? {Authorization:`Bearer ${token}`} : {}) }, ...(body ? {body:JSON.stringify(body)} : {}) }); }
 catch { throw new AuthError(503, 'Não foi possível conectar ao serviço de autenticação.'); }
 const payload = response.status === 204 ? null : await response.json().catch(() => null);
 if (!response.ok) {
  if (response.status === 422 && path === '/auth/register') throw new AuthError(422, registrationErrorMessage(payload));
  const messages = {404:'Rota de autenticação não encontrada (HTTP 404). Confira o endereço da API e a implantação.',401:'E-mail ou senha inválidos, ou sessão expirada.',403:'Acesso não permitido para esta conta.',409:'A operação não pôde ser concluída no estado atual da conta.',422:'Confira os dados informados. O link pode estar inválido ou expirado.',429:'Muitas tentativas. Aguarde antes de tentar novamente.'};
  throw new AuthError(response.status >= 500 ? 503 : response.status, messages[response.status] || 'Serviço temporariamente indisponível.');
 }
 if (response.status !== 204 && (payload?.success !== true || payload.data == null)) throw new AuthError(503,'Resposta inválida do serviço de autenticação.');
 return payload?.data;
}
export async function currentUser() {
 const token = (await cookies()).get(SESSION_COOKIE)?.value;
 if (!token) return null;
 try { return await backendAuth('/users/me', {token}); }
 catch (error) { if ([401,403].includes(error.status)) return null; throw error; }
}
