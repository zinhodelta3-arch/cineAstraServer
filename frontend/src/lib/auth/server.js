import 'server-only';
import { randomUUID } from 'node:crypto';
import { cache } from 'react';
import { commerceErrors } from '@/lib/api/commerce-errors.mjs';
import { registrationErrorMessage } from './registration-errors.mjs';
import { resolveApiBase } from '@/lib/api/api-base.mjs';
import { cookies } from 'next/headers';
import { errorMetadata, errorMessage } from '@/lib/api/api-errors.mjs';
export const SESSION_COOKIE = 'cineastra_session';
export class AuthError extends Error {
 constructor(status, message, code = null, metadata = {}) {
  super(message);
  this.status = status;
  Object.assign(this, errorMetadata({ ...metadata, code: code ?? metadata.code }, status));
 }
}
export function authErrorPayload(error, fallback) {
 if (fallback && typeof fallback === 'object') fallback = fallback.message;
 const status = error instanceof AuthError ? error.status : 500;
 const metadata = errorMetadata(error instanceof AuthError ? error : { requestId: randomUUID() }, status);
 if (!(error instanceof AuthError)) console.error(JSON.stringify({ event: 'frontend_request_failed', timestamp: new Date().toISOString(), requestId: metadata.requestId, errorType: ['Error', 'TypeError', 'RangeError', 'SyntaxError', 'ReferenceError'].includes(error?.name) ? error.name : 'Error' }));
 return { success: false, ...metadata, message: errorMessage(status, metadata.code, fallback ?? (error instanceof AuthError ? error.message : null)) };
}
export async function backendAuth(path, { token, body, idempotencyKey, method = 'GET' } = {}) {
 const base = resolveApiBase(process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL);
 if (!base || !/^https?:\/\//.test(base)) throw new AuthError(503, 'Serviço temporariamente indisponível.');
 let response;
 try { response = await fetch(`${base.replace(/\/$/,'')}${path}`, { method, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000), headers: { Accept: 'application/json', ...(idempotencyKey ? {'Idempotency-Key':idempotencyKey} : {}), ...(body ? {'Content-Type':'application/json'} : {}), ...(token ? {Authorization:`Bearer ${token}`} : {}) }, ...(body ? {body:JSON.stringify(body)} : {}) }); }
 catch (error) { throw new AuthError(503, 'Não foi possível conectar ao serviço.', error?.name === 'TimeoutError' ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR'); }
 const payload = response.status === 204 ? null : await response.json().catch(() => null);
 if (!response.ok) {
  const metadata = errorMetadata({ ...payload, requestId: payload?.requestId ?? response.headers.get('X-Request-Id'), retryAfter: response.headers.get('Retry-After') }, response.status);
  const failure = (status, message, code) => new AuthError(status, message, code, metadata);
  if (response.status >= 400 && response.status < 500 && Object.hasOwn(commerceErrors, payload?.code)) throw failure(response.status, commerceErrors[payload.code], payload.code);
  if (/^\/streaming\/(?:films\/\d+|\d+)\/play$/.test(path) && response.status === 403 && ['STREAMING_ACCESS_REQUIRED', 'AGE_VERIFICATION_REQUIRED', 'AGE_RESTRICTION'].includes(payload?.code)) throw failure(403, 'Reprodução não permitida.', payload.code);
  if (response.status === 422 && path === '/auth/register') throw failure(422, registrationErrorMessage(payload));
  if (response.status === 404 && path.startsWith('/teams/collaborator?')) throw failure(404, 'Colaborador ativo não encontrado com este e-mail.');
  if (response.status === 409 && ['/orders/quote', '/orders/checkout'].includes(path) && ['ORDER_CONFLICT', 'PRICING_CONFLICT', 'CHECKOUT_CONFLICT'].includes(payload?.code) && typeof payload.message === 'string' && payload.message.length <= 180) throw failure(409, payload.message, payload.code);
  if (response.status === 409 && /^\/admin\/users(?:\/\d+\/(?:access|location))?$/.test(path) && ['IDENTITY_CONFLICT', 'LAST_ADMIN', 'REACTIVATION_REQUIRES_REVIEW'].includes(payload?.code) && typeof payload.message === 'string' && payload.message.length <= 180) throw failure(409, payload.message, payload.code);
  if (response.status === 409 && /^\/teams(?:\/\d+(?:\/.*)?)?$/.test(path) && ['TEAM_CONFLICT', 'TASK_CONFLICT'].includes(payload?.code) && typeof payload.message === 'string' && payload.message.length <= 180) throw failure(409, payload.message, payload.code);
  if (response.status === 409 && /^\/unit\/(?:sessions|locations|combos)(?:\/.*)?$/.test(path) && ['SESSION_CONFLICT', 'VENUE_CONFLICT', 'COMBO_CONFLICT'].includes(payload?.code) && typeof payload.message === 'string' && payload.message.length <= 180) throw failure(409, payload.message, payload.code);
  if (response.status === 409 && /^\/(?:stock|logistics|inventory)(?:\/.*)?$/.test(path) && ['SUPPLY_CONFLICT', 'INVENTORY_CONFLICT'].includes(payload?.code) && typeof payload.message === 'string' && payload.message.length <= 180) throw failure(409, payload.message, payload.code);
  if (response.status === 409 && (/^\/admin\/(?:banners|experiences|partners|newsletter\/(?:categories|campaigns)|content)(?:\/.*)?$/.test(path)) && ['PROMOTIONAL_CONFLICT', 'NEWSLETTER_CONFLICT', 'CONTENT_VERSION_EXISTS'].includes(payload?.code) && typeof payload.message === 'string' && payload.message.length <= 180) throw failure(409, payload.message, payload.code);
  if (response.status === 409 && /^\/suppliers\/me\/transports(?:\/\d+)?$/.test(path) && payload?.code === 'SUPPLIER_TRANSPORT_CONFLICT') throw failure(409,'Já existe um transporte com essa identificação neste fornecedor.',payload.code);
  if (response.status === 409 && path === '/pricing/quote' && payload?.code === 'PRICING_CONFLICT') {
   throw failure(409, 'O preço não pôde ser cotado.', payload.code);
  }
  if (response.status === 409 && /^\/(?:inputs(?:\/\d+)?|admin\/pricing\/costs\/inputs\/\d+)$/.test(path)
      && payload?.code === 'PRODUCT_RETAIL_CONFLICT' && typeof payload.message === 'string' && payload.message.length <= 180) {
   throw failure(409, payload.message, payload.code);
  }
  const messages = {400:'Confira o formato dos dados enviados.',404:'O registro solicitado não está disponível.',401:path === '/auth/login' ? 'E-mail ou senha inválidos.' : 'Sua sessão expirou ou não é válida. Entre novamente.',403:'Acesso não permitido para esta conta.',409:'A operação conflita com o estado atual dos dados. Atualize a página.',422:'Confira os dados informados.',429:'Muitas tentativas. Aguarde antes de tentar novamente.'};
  throw failure(response.status, errorMessage(response.status, metadata.code, messages[response.status]));
 }
 if (response.status !== 204 && (payload?.success !== true || payload.data == null)) throw new AuthError(503,'Resposta inválida do servidor.', 'INVALID_RESPONSE', { requestId: response.headers.get('X-Request-Id') });
 return payload?.data;
}
// Cache limitado à renderização do servidor; não compartilha sessões entre requisições.
export const currentUser = cache(async function currentUser() {
 const token = (await cookies()).get(SESSION_COOKIE)?.value;
 if (!token) return null;
 try { return await backendAuth('/users/me', {token}); }
 catch (error) { if ([401,403].includes(error.status)) return null; throw error; }
});
