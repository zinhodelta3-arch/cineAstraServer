import test from 'node:test';
import assert from 'node:assert/strict';
import {profileTarget} from '../src/lib/api/profile-request.mjs';
test('profile writes exclude role, email and provider secrets',()=>{
 assert.equal(profileTarget([],'PATCH',{name:'Ana',phone:null,role:'ADMIN'}),null);
 assert.equal(profileTarget([],'PATCH',{name:'Ana',phone:null,email:'x@example.com'}),null);
 assert.ok(profileTarget([],'PATCH',{name:'Ana',phone:null}));
 assert.equal(profileTarget(['payment-methods'],'POST',{token:'abc'}),null);
 assert.equal(profileTarget(['payment-methods','1'],'PATCH',{principal:false}),null);
 assert.ok(profileTarget(['payment-methods','1'],'PATCH',{principal:true}));
});
test('password change follows server policy and requires current password',()=>{
 const body={currentPassword:'old',password:'SenhaNova123!',passwordConfirmation:'SenhaNova123!'};
 assert.ok(profileTarget(['password'],'PATCH',body).password);
 for(const patch of [{currentPassword:''},{password:'short'},{passwordConfirmation:'mismatch'},{code:'abc'},{password:'A1!'+ 'é'.repeat(36),passwordConfirmation:'A1!'+ 'é'.repeat(36)}])
  assert.equal(profileTarget(['password'],'PATCH',{...body,...patch}),null);
});
test('addresses and contacts validate format without requiring authentic CEP',()=>{
 const address={logradouro:'Rua Teste',numero:'10',cidade:'São Paulo',estado:'SP',cep:'00000-000',principal:false};
 assert.ok(profileTarget(['addresses'],'POST',address));
 assert.equal(profileTarget(['addresses'],'POST',{...address,estado:'São Paulo'}),null);
 assert.equal(profileTarget(['contacts'],'POST',{tipo:'EMAIL_SECUNDARIO',valor:'invalid',principal:false}),null);
 assert.ok(profileTarget(['contacts','1'],'PATCH',{valor:'11999999999',principal:true}));
 assert.equal(profileTarget(['contacts','18446744073709551616'],'DELETE'),null);
 assert.equal(profileTarget(['admin','1'],'DELETE'),null);
});
