import test from 'node:test';
import assert from 'node:assert/strict';
import {subscriptionInput,planBenefits,planMoney} from '../src/lib/api/plan-subscription.mjs';
const valid={planId:'1',period:'MENSAL',autoRenew:false,divisionMode:'TITULAR_PAGA'};
test('summary accepts only the supported contract options, without client-supplied price',()=>{
 assert.deepEqual(subscriptionInput(valid),valid);
 for(const patch of [{planId:'4294967296'},{planId:1},{period:'monthly'},{autoRenew:'false'},{divisionMode:'DIVISAO_IGUAL'},{price:'0.01'},{userId:'2'}])
  assert.equal(subscriptionInput({...valid,...patch}),null);
});
test('contract creation requires explicit acceptance and current offer hash',()=>{
 assert.equal(subscriptionInput(valid,true),null);
 for(const acceptance of [{accepted:false,offerHash:'a'.repeat(64)},{accepted:true,offerHash:'bad'},{accepted:true,offerHash:'a'.repeat(64),price:1}])
  assert.equal(subscriptionInput({...valid,acceptance},true),null);
 assert.ok(subscriptionInput({...valid,acceptance:{accepted:true,offerHash:'a'.repeat(64)}},true));
});
test('benefits and price come from publication, including basis-point discounts',()=>{
 assert.deepEqual(planBenefits({maxMembers:2,catalogAccess:false,freeCombosPerMonth:0,discounts:{INGRESSO:1250,COMBO:0}}),['Até 2 membro(s)','12.5% de desconto em ingressos']);
 assert.equal(planMoney(null),'Preço indisponível');
});
