import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import {createRefundModel} from '../src/models/refundModel.js';
import {createRefundService} from '../src/services/refundService.js';
import {createRefundController} from '../src/controllers/refundController.js';
import {refundRoutes} from '../src/routes/refundRoutes.js';
import {errorMiddleware} from '../src/middlewares/errorMiddleware.js';
import {ApiError} from '../src/utils/ApiError.js';
const base={id_pagamento:'7',id_usuario:'9',id_pedido:'11',id_cobranca:null,motivo:'OUTRO',dentro_prazo:false,valor_solicitado:null,valor_confirmado:null,status:'EM_ANALISE',compensacao_status:'NAO_APLICAVEL',solicitado_em:'2026-10-25 12:00:00',prazo_resposta_em:'2026-10-30 12:00:00',respondido_em:null,pagamento_valor:'24.50',pagamento_status:'APROVADO',detalhes:'Pedido do cliente',termos_versao:'v1',decisao_fundamento:null,provider_ref:'SECRET',chave_idempotencia:'SECRET',transacao_id:'SECRET'};
function fixture(){
 let reads=0,gateway=0;
 const rows=[{...base,id_reembolso:'9007199254740995'},{...base,id_reembolso:'9007199254740993',status:'CONFIRMADA',compensacao_status:'PENDENTE',valor_solicitado:'24.50',valor_confirmado:'24.50'}];
 const model={adminList:async(c,q)=>{reads++;return rows.filter(r=>(!q.cursor||BigInt(r.id_reembolso)<BigInt(q.cursor))&&Object.entries({status:'status',reason:'motivo',compensation:'compensacao_status',userId:'id_usuario',paymentId:'id_pagamento',orderId:'id_pedido',chargeId:'id_cobranca'}).every(([key,col])=>!q[key]||q[key]===r[col])).slice(0,q.limit+1);},adminGet:async(c,id)=>{reads++;return rows.find(r=>r.id_reembolso===id);}};
 const identity={transaction:async fn=>fn({}),activeActor:async(c,ctx)=>({tipo_usuario:ctx.actor.tipo})};
 const provider={refund:async()=>{gateway++;throw new Error('must not dispatch');},consultRefund:async()=>{gateway++;throw new Error('must not reconcile');}};
 const service=createRefundService({model,identity,provider}),app=express();
 const auth=(req,res,next)=>{if(!req.get('x-role'))throw ApiError.naoAutorizado();req.usuario={id:'1',tipo:req.get('x-role')};next();};
 app.use(refundRoutes(createRefundController(service),{auth,limits:{checkout:[]}}));app.use(errorMiddleware);
 return {app,service,reads:()=>reads,gateway:()=>gateway,api:path=>request(app).get('/api/admin/refunds'+path).set('x-role','ADMIN')};
}
test('fila paginada, filtros combinados, valores monetários e detalhe sem segredos',async()=>{
 const f=fixture();const first=await f.api('?limit=1').expect(200);assert.equal(first.headers['cache-control'],'no-store');assert.equal(first.body.data.pagination.nextCursor,'9007199254740995');
 assert.equal(first.body.data.items[0].paymentAmount,'24.50');assert.equal(first.body.data.items[0].receivedAt,'2026-10-25T12:00:00.000Z');assert.equal(first.body.data.items[0].requestedAmount,null);
 const last=await f.api('?limit=1&cursor='+first.body.data.pagination.nextCursor).expect(200);assert.equal(last.body.data.items[0].id,'9007199254740993');assert.equal(last.body.data.pagination.nextCursor,null);
 const filtered=await f.api('?status=EM_ANALISE&reason=OUTRO&userId=9&paymentId=7&orderId=11&compensation=NAO_APLICAVEL').expect(200);assert.equal(filtered.body.data.items.length,1);
 assert.deepEqual((await f.api('?chargeId=1')).body.data,{items:[],pagination:{limit:20,nextCursor:null}});
 const detail=await f.api('/9007199254740995').expect(200);assert.equal(detail.body.data.details,'Pedido do cliente');assert.equal(detail.body.data.termsVersion,'v1');assert.equal(detail.body.data.decisionBasis,null);
 for(const field of ['provider_ref','chave_idempotencia','transacao_id','detalhes','details','termsVersion','decisionBasis'])assert.equal(first.body.data.items[0][field],undefined);
 for(const field of ['provider_ref','chave_idempotencia','transacao_id'])assert.equal(detail.body.data[field],undefined);
 assert.equal(f.gateway(),0);await f.api('/999').expect(404);
});
test('somente ADMIN acessa fila/detalhe, service também revalida papel',async()=>{
 const f=fixture();for(const suffix of ['','/1']){await request(f.app).get('/api/admin/refunds'+suffix).expect(401);for(const role of ['CLIENTE','FORNECEDOR','SUPERVISOR','COLABORADOR'])await f.api(suffix).set('x-role',role).expect(403);}
 const ctx={actor:{tipo:'CLIENTE'}};await assert.rejects(f.service.adminList({limit:20},ctx),{statusCode:403});await assert.rejects(f.service.adminGet('1',ctx),{statusCode:403});assert.equal(f.reads(),0);
});
test('validação não aceita filtros extras, arrays, IDs inválidos ou paginação fora dos limites',async()=>{
 const f=fixture();for(const q of ['limit=0','limit=101','limit=1&limit=2','cursor=abc','cursor=0','cursor=18446744073709551616','userId=4294967296','status=INVALID','reason=INVALID','compensation=INVALID','sort=provider_ref'])await f.api('?'+q).expect(422);
 for(const id of ['abc','0','-1','18446744073709551616'])await f.api('/'+id).expect(422);
 assert.equal(f.reads(),0);
});
test('model parametriza filtros e consulta apenas projeção administrativa',async()=>{
 const calls=[],c={execute:async(sql,args)=>{calls.push({sql,args});return [[]];}},m=createRefundModel();
 await m.adminList(c,{limit:2,cursor:'9007199254740995',status:'EM_ANALISE',reason:'OUTRO',compensation:'PENDENTE',userId:'9',paymentId:'7',orderId:'11',chargeId:'3'});
 assert.deepEqual(calls[0].args,['9007199254740995','EM_ANALISE','OUTRO','PENDENTE','9','7','11','3',3]);assert.match(calls[0].sql,/ORDER BY r.id_reembolso DESC LIMIT \?/);
 await m.adminGet(c,'1');assert.deepEqual(calls[1].args,['1']);assert.match(calls[1].sql,/r.decisao_fundamento/);
 for(const {sql} of calls)assert.doesNotMatch(sql,/provider_ref|transacao_id|chave_idempotencia|FOR UPDATE|UPDATE |INSERT |DELETE /);
});
