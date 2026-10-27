export async function readSessionResponse(response) {
 let data;
 try {
  data = await response.json();
 } catch (error) {
  if (error.name === 'AbortError') throw error;
  throw new Error(`O servidor retornou uma resposta inválida (HTTP ${response.status}). Tente novamente; se persistir, informe este código ao suporte.`);
 }
 if (!data || typeof data !== 'object' || Array.isArray(data)) {
  throw new Error(`O servidor retornou uma resposta inválida (HTTP ${response.status}).`);
 }
 if (!response.ok) {
  throw new Error(typeof data.message === 'string' ? data.message : `Não foi possível concluir a operação (HTTP ${response.status}).`);
 }
 return data;
}
