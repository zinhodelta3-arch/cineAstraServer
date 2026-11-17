import test from 'node:test';
import assert from 'node:assert/strict';
import {readSessionResponse} from '../src/lib/auth/session-response.mjs';
test('resposta de proxy não vaza erro de parsing nem é tratada como sucesso', async () => {
 for (const [body,status,code] of [['404 page not found',404,'NOT_FOUND'],['<html>Bad Gateway</html>',502,'INVALID_RESPONSE'],['',200,'INVALID_RESPONSE'],['null',200,'INVALID_RESPONSE'],['[]',200,'INVALID_RESPONSE']]) {
  await assert.rejects(readSessionResponse(new Response(body,{status})),error =>
   error.status === status && error.code === code && !/404 page not found|<html>|SyntaxError/.test(error.message));
 }
});
test('preserva sucesso e mensagem de erro JSON da aplicação', async () => {
 assert.deepEqual(await readSessionResponse(Response.json({user:{id:1}},{status:201})),{user:{id:1}});
 await assert.rejects(readSessionResponse(Response.json({message:'Origem não permitida.'},{status:403})),/Origem não permitida/);
});
