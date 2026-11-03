import 'server-only';
import { commerceErrors } from '@/lib/api/commerce-errors.mjs';
import { registrationErrorMessage } from './registration-errors.mjs';
import { resolveApiBase } from '@/lib/api/api-base.mjs';
import { cookies } from 'next/headers';
export const SESSION_COOKIE = 'cineastra_session';
export class AuthError extends Error { constructor(status, message, code = null) { super(message); this.status = status; this.code = code; } }
export async function backendAuth(path, { token, body, idempotencyKey, method = 'GET' } = {}) {
 const base = resolveApiBase(process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL);
 if (!base || !/^https?:\/\//.test(base)) throw new AuthError(503, 'Serviço de autenticação indisponível.');
 let response;
 try { response = await fetch(`${base.replace(/\/$/,'')}${path}`, { method, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000), headers: { Accept: 'application/json', ...(idempotencyKey ? {'Idempotency-Key':idempotencyKey} : {}), ...(body ? {'Content-Type':'application/json'} : {}), ...(token ? {Authorization:`Bearer ${token}`} : {}) }, ...(body ? {body:JSON.stringify(body)} : {}) }); }
 catch { throw new AuthError(503, 'Não foi possível conectar ao serviço de autenticação.'); }
 const payload = response.status === 204 ? null : await response.json().catch(() => null);
 if (!response.ok) {
  if (response.status >= 400 && response.status < 500 && Object.hasOwn(commerceErrors, payload?.code)) throw new AuthError(response.status, commerceErrors[payload.code], payload.code);
  if (/^\/streaming\/(?:films\/\d+|\d+)\/play$/.test(path) && response.status === 403 && ['STREAMING_ACCESS_REQUIRED', 'AGE_VERIFICATION_REQUIRED', 'AGE_RESTRICTION'].includes(payload?.code)) throw new AuthError(403, 'Reprodução não permitida.', payload.code);
  if (response.status === 422 && path === '/auth/register') throw new AuthError(422, registrationErrorMessage(payload));
  if (response.status === 404 && path.startsWith('/teams/collaborator?')) throw new AuthError(404, 'Colaborador ativo não encontrado com este e-mail.');
  if (response.status === 409 && ['/orders/quote', '/orders/checkout'].includes(path) && ['ORDER_CONFLICT', 'PRICING_CONFLICT', 'CHECKOUT_CONFLICT'].includes(payload?.code) && typeof payload.message === 'string' && payload.message.length <= 180) throw new AuthError(409, payload.message, payload.code);
  if (response.status === 409 && /^\/admin\/users(?:\/\d+\/(?:access|location))?$/.test(path) && ['IDENTITY_CONFLICT', 'LAST_ADMIN', 'REACTIVATION_REQUIRES_REVIEW'].includes(payload?.code) && typeof payload.message === 'string' && payload.message.length <= 180) throw new AuthError(409, payload.message, payload.code);
  if (response.status === 409 && /^\/teams(?:\/\d+(?:\/.*)?)?$/.test(path) && ['TEAM_CONFLICT', 'TASK_CONFLICT'].includes(payload?.code) && typeof payload.message === 'string' && payload.message.length <= 180) throw new AuthError(409, payload.message, payload.code);
  if (response.status === 409 && /^\/unit\/(?:sessions|locations|combos)(?:\/.*)?$/.test(path) && ['SESSION_CONFLICT', 'VENUE_CONFLICT', 'COMBO_CONFLICT'].includes(payload?.code) && typeof payload.message === 'string' && payload.message.length <= 180) throw new AuthError(409, payload.message, payload.code);
  if (response.status === 409 && /^\/(?:stock|logistics|inventory)(?:\/.*)?$/.test(path) && ['SUPPLY_CONFLICT', 'INVENTORY_CONFLICT'].includes(payload?.code) && typeof payload.message === 'string' && payload.message.length <= 180) throw new AuthError(409, payload.message, payload.code);
  if (response.status === 409 && (/^\/admin\/(?:banners|experiences|partners|newsletter\/(?:categories|campaigns)|content)(?:\/.*)?$/.test(path)) && ['PROMOTIONAL_CONFLICT', 'NEWSLETTER_CONFLICT', 'CONTENT_VERSION_EXISTS'].includes(payload?.code) && typeof payload.message === 'string' && payload.message.length <= 180) throw new AuthError(409, payload.message, payload.code);
  const messages = {404:'Rota de autenticação não encontrada (HTTP 404). Confira o endereço da API e a implantação.',401:'E-mail ou senha inválidos, ou sessão expirada.',403:'Acesso não permitido para esta conta.',409:'A operação não pôde ser concluída no estado atual da conta.',422:'Confira os dados informados. O link pode estar inválido ou expirado.',429:'Muitas tentativas. Aguarde antes de tentar novamente.'};
  throw new AuthError(response.status >= 500 ? 503 : response.status, messages[response.status] || 'Serviço temporariamente indisponível.', path === '/orders/quote' && response.status === 403 && ['AGE_VERIFICATION_REQUIRED', 'AGE_RESTRICTION'].includes(payload?.code) ? payload.code : null);
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
