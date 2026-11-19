import { apiUrl, publicGet } from './public-api.mjs';
import { responseError, networkError } from './api-errors.mjs';

export const newsletterPath = '/cinema/noticias/assinatura';
export const newsletterOptions = options => publicGet('/newsletter/options', options);

export async function newsletterAction(action, input, method = 'POST') {
  let response;
  try {
    response = await fetch(apiUrl(`/newsletter/${action}`), {
      method, credentials: 'omit', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(input), signal: AbortSignal.timeout(15000),
    });
  } catch (error) {
    throw networkError(error);
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) throw responseError(response, body);
  if (body?.success !== true || body.data == null) throw responseError(response, { code: 'INVALID_RESPONSE' });
  return body.data;
}
