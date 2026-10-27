import test from 'node:test';
import assert from 'node:assert/strict';
import {loginDestination,passwordValid} from '../src/lib/auth/destination.mjs';
test('destino por perfil sem criar área do supervisor',()=>{
 assert.equal(loginDestination('ADMIN'),'/admin/dashboard');
 for(const role of ['CLIENTE','FORNECEDOR','COLABORADOR'])assert.equal(loginDestination(role),'/cinema/home');
 assert.equal(loginDestination('SUPERVISOR'),null);assert.equal(loginDestination('INVALID'),null);
});
test('nova senha atende comprimento, composição e limite de bytes do backend',()=>{
 assert.equal(passwordValid('MinhaSenha123!','MinhaSenha123!'),true);
 for(const [p,c] of [['curta1!','curta1!'],['minhasenha123!','minhasenha123!'],['MinhaSenha123!','diferente'],['Á'.repeat(40)+'a1!','Á'.repeat(40)+'a1!']])assert.equal(passwordValid(p,c),false);
});
