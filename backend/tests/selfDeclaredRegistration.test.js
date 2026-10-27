import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import {identityFixture,PASSWORD} from './identityFixture.js';
const input={captchaToken:'fixture',name:'Pessoa Teste',email:'self@example.invalid',cpf:'52998224725',dateOfBirth:'2000-01-01',password:PASSWORD,passwordConfirmation:PASSWORD,termsVersion:'fixture-v1',privacyVersion:'fixture-v1',acceptTerms:true,acceptPrivacy:true};
test('cadastro sem prova cria CLIENTE e consentimentos, mas não cria verificação ou vínculo',async t=>{
 const f=await identityFixture({providers:{age:{verify:async()=>{throw new Error('provider must not run');}}}});t.after(()=>f.close());
 const r=await request(f.app).post('/api/auth/register').send(input).expect(201);assert.equal(r.body.data.ageVerified,false);assert.equal(r.body.data.role,'CLIENTE');assert.equal(f.state.ages.length,0);assert.equal(f.state.guardians.length,0);assert.equal(f.state.consents.length,2);
 const login=await request(f.app).post('/api/auth/login').send({email:input.email,password:PASSWORD,captchaToken:'fixture'}).expect(200);
 const me=await request(f.app).get('/api/users/me').set('Authorization','Bearer '+login.body.data.accessToken).expect(200);assert.equal(me.body.data.ageVerified,false);
 await request(f.app).post('/api/auth/register').send(input).expect(409);
});
test('menor autodeclarado não recebe prova falsa e modo estrito continua disponível',async t=>{
 const f=await identityFixture();t.after(()=>f.close());await request(f.app).post('/api/auth/register').send({...input,dateOfBirth:'2015-01-01'}).expect(201);assert.equal(f.state.ages.length,0);assert.equal(f.state.guardians.length,0);
 const strict=await identityFixture({env:{ALLOW_SELF_DECLARED_AGE:'false'}});t.after(()=>strict.close());await request(strict.app).post('/api/auth/register').send(input).expect(422);assert.equal(strict.state.users.length,0);
});
test('termos atuais, role exclusiva e validação de comprovação não são contornáveis',async t=>{
 const f=await identityFixture({providers:{age:{verify:async()=>null}}});t.after(()=>f.close());
 for(const extra of [{termsVersion:'old'},{acceptTerms:false},{role:'ADMIN'},{ageVerified:true},{guardianProof:'fake'},{ageProof:'fake'}])await request(f.app).post('/api/auth/register').send({...input,...extra}).expect(422);
 assert.equal(f.state.users.length,0);
});
