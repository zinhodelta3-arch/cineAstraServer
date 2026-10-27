import test from 'node:test';
import assert from 'node:assert/strict';
import {readSessionResponse} from '../src/lib/auth/session-response.mjs';
test('resposta de proxy não vaza erro de parsing nem é tratada como sucesso', async () => {
 for (const [body,status] of [['404 page not found',404],['<html>Bad Gateway</html>',502],['',200],['null',200],['[]',200]]) {
  await assert.rejects(readSessionResponse(new Response(body,{status})),new RegExp(`resposta inválida \\(HTTP ${status}\\)`));
 }
});
test('preserva sucesso e mensagem de erro JSON da aplicação', async () => {
 assert.deepEqual(await readSessionResponse(Response.json({user:{id:1}},{status:201})),{user:{id:1}});
 await assert.rejects(readSessionResponse(Response.json({message:'Origem não permitida.'},{status:403})),/Origem não permitida/);
});
