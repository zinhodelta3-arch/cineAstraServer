import { responseError, networkError } from '../api/api-errors.mjs';

export async function sessionFetch(input, options) {
 try { return await fetch(input, options); }
 catch (error) {
  if (options?.signal?.aborted) throw error;
  throw networkError(error);
 }
}

export async function readSessionResponse(response) {
 let data;
 try {
  data = await response.json();
 } catch (error) {
  if (error.name === 'AbortError') throw error;
  throw responseError(response, { code: 'INVALID_RESPONSE', message: `O servidor retornou uma resposta inválida (HTTP ${response.status}).` });
 }
 if (!data || typeof data !== 'object' || Array.isArray(data)) {
  throw responseError(response, { code: 'INVALID_RESPONSE', message: `O servidor retornou uma resposta inválida (HTTP ${response.status}).` });
 }
 if (!response.ok) {
  throw responseError(response, data);
 }
 return data;
}
