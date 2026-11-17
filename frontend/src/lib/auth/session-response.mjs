import { responseError, networkError } from '../api/api-errors.mjs';

export async function sessionFetch(input, options) {
 try { return await fetch(input, options); }
 catch (error) {
  if (options?.signal?.aborted) throw error;
  throw networkError(error);
 }
}

export async function readSessionResponse(response) {
 let data = null;
 try {
  data = await response.json();
 } catch (error) {
  if (['AbortError', 'TimeoutError'].includes(error.name)) throw error;
 }
 const valid = data !== null && typeof data === 'object' && !Array.isArray(data);
 if (!response.ok) {
  throw responseError(response, valid ? data : null);
 }
 if (!valid) {
  throw responseError(response, { code: 'INVALID_RESPONSE' });
 }
 return data;
}
