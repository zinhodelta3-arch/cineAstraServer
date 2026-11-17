import test from 'node:test';
import assert from 'node:assert/strict';
import {loginDestination,passwordValid} from '../src/lib/auth/destination.mjs';
test('login direciona cada perfil ao seu portal',()=>{
 assert.equal(loginDestination('ADMIN'),'/admin/dashboard');
 assert.equal(loginDestination('CLIENTE'),'/cinema/home');
 assert.equal(loginDestination('FORNECEDOR'),'/fornecedor');
 for(const role of ['SUPERVISOR','COLABORADOR'])assert.equal(loginDestination(role),'/unidade');
 assert.equal(loginDestination('INVALID'),null);
});
test('nova senha atende comprimento, composição e limite de bytes do backend',()=>{
 assert.equal(passwordValid('MinhaSenha123!','MinhaSenha123!'),true);
 for(const [p,c] of [['curta1!','curta1!'],['minhasenha123!','minhasenha123!'],['MinhaSenha123!','diferente'],['Á'.repeat(40)+'a1!','Á'.repeat(40)+'a1!']])assert.equal(passwordValid(p,c),false);
});

test('documentos locais apontam para os PDFs existentes com versão explícita',async()=>{
 const {registrationDocuments}=await import('../src/lib/auth/registration-documents.mjs');
 const {readFile}=await import('node:fs/promises');
 for(const doc of Object.values(registrationDocuments)){
  assert.equal(doc.version,'2.0');assert.ok(doc.url.startsWith('/docs/'));
  const file=await readFile(new URL('../public'+decodeURI(doc.url),import.meta.url));assert.equal(file.subarray(0,5).toString(),'%PDF-');
 }
});
