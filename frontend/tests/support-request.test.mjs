import test from 'node:test';
import assert from 'node:assert/strict';
import {supportTarget} from '../src/lib/api/support-request.mjs';
test('proxy allows only scoped client support operations',()=>{
 assert.equal(supportTarget(['1','assign'],'POST','0',{attendantId:'1'}),null);
 assert.equal(supportTarget(['..','users'],'GET'),null);
 assert.equal(supportTarget(['4294967296'],'GET'),null);
 assert.equal(supportTarget([], 'GET','18446744073709551616'),null);
 assert.equal(supportTarget(['1','messages'],'GET','18446744073709551615').path,'/support/1/messages?limit=20&cursor=18446744073709551615');
});
test('message validation matches limits and prevents live-mode or author injection',()=>{
 assert.deepEqual(supportTarget([],'POST','0',{subject:' Ajuda ',message:' Teste '}),{path:'/support',body:{subject:'Ajuda',message:'Teste'}});
 assert.equal(supportTarget([],'POST','0',{subject:'x',message:'   '}),null);
 assert.equal(supportTarget(['1','messages'],'POST','0',{message:'x',mode:'LIVE'}),null);
 assert.equal(supportTarget(['1','messages'],'POST','0',{message:'x',authorId:'2'}),null);
 assert.equal(supportTarget(['1','messages'],'POST','0',{message:'a'.repeat(10001)}),null);
 assert.equal(supportTarget(['1','messages'],'POST','0',{message:'x'}).body.mode,'ASYNC');
 assert.equal(supportTarget(['1','close'],'POST','0',{status:'FECHADO'}),null);
});
test('assistant has independent request limits',()=>{
 assert.ok(supportTarget(['assistant','messages'],'POST','0',{message:'x'.repeat(1000)}));
 assert.equal(supportTarget(['assistant','messages'],'POST','0',{message:'x'.repeat(1001)}),null);
 assert.equal(supportTarget(['assistant','handoff'],'POST','0',{message:'x'.repeat(4001)}),null);
});
