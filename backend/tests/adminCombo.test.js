import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import {createComboModel} from '../src/models/comboModel.js';
import {createComboService} from '../src/services/comboService.js';
import {createComboController} from '../src/controllers/comboController.js';
import {comboRoutes} from '../src/routes/comboRoutes.js';
import {errorMiddleware} from '../src/middlewares/errorMiddleware.js';
import {ApiError} from '../src/utils/ApiError.js';
function fixture(){
 let reads=0;
 const rows=[{id_combo:'3',id_local:null,nome:'Legado',descricao:null,preco:'12.00',ativo:0,data_cadastro:null,item_count:0},{id_combo:'2',id_local:'1',nome:'Pipoca',preco:'15.00',ativo:1,data_cadastro:'2026-10-25 12:00:00',item_count:2},{id_combo:'1',id_local:'2',nome:'Pipoca antiga',preco:'10.00',ativo:0,data_cadastro:'2026-10-25 12:00:00',item_count:1}];
 const model={adminList:async(c,q)=>{reads++;return rows.filter(r=>(!q.cursor||BigInt(r.id_combo)<BigInt(q.cursor))&&(!q.localId||r.id_local===q.localId)&&(q.active===undefined||Boolean(r.ativo)===q.active)&&(!q.q||r.nome.toLowerCase().includes(q.q.toLowerCase()))).slice(0,q.limit+1);},combo:async id=>{reads++;return rows.find(r=>r.id_combo===id);},items:async()=>[]};
 const identity={transaction:async fn=>fn({}),activeActor:async(c,ctx)=>{if(ctx.actor.id==='99')throw ApiError.naoAutorizado();return {tipo_usuario:ctx.actor.tipo};}};
 const service=createComboService({model,identity}),app=express();
 const auth=(req,res,next)=>{if(!req.get('x-role'))throw ApiError.naoAutorizado();req.usuario={id:req.get('x-user')||'1',tipo:req.get('x-role')};next();};
 app.use(comboRoutes(createComboController(service),{auth}));app.use(errorMiddleware);
 return {app,service,reads:()=>reads,api:s=>request(app).get('/api/admin/combos'+s).set('x-role','ADMIN')};
}
test('admin lista ativos, arquivados e legado sem local/composição com paginação e filtros',async()=>{
 const f=fixture(),first=await f.api('?limit=2').expect(200);assert.equal(first.headers['cache-control'],'no-store');
 assert.deepEqual(first.body.data.items[0],{id_combo:'3',id_local:null,nome:'Legado',descricao:null,preco:'12.00',ativo:false,data_cadastro:null,itemCount:0});assert.equal(first.body.data.pagination.nextCursor,'2');
 const last=await f.api('?limit=2&cursor=2').expect(200);assert.deepEqual(last.body.data.items.map(x=>x.id_combo),['1']);assert.equal(last.body.data.pagination.nextCursor,null);
 assert.deepEqual((await f.api('?active=false')).body.data.items.map(x=>x.id_combo),['3','1']);
 assert.deepEqual((await f.api('?localId=1&active=true&q=pipoca')).body.data.items.map(x=>x.id_combo),['2']);
 assert.deepEqual((await f.api('?q=absent')).body.data,{items:[],pagination:{limit:20,nextCursor:null}});
 await f.api('/3').expect(200);
});
test('lista e detalhe revalidam ADMIN ativo antes de ler o catálogo',async()=>{
 const f=fixture();for(const s of ['','/2']){await request(f.app).get('/api/admin/combos'+s).expect(401);for(const role of ['CLIENTE','FORNECEDOR','SUPERVISOR'])await f.api(s).set('x-role',role).expect(403);await f.api(s).set('x-user','99').expect(401);}
 await assert.rejects(f.service.adminList({limit:20},{actor:{id:'1',tipo:'CLIENTE'}}),{statusCode:403});await assert.rejects(f.service.adminGet('2',{actor:{id:'1',tipo:'CLIENTE'}}),{statusCode:403});assert.equal(f.reads(),0);
});
test('valida booleano literal, limites, cursor e IDs',async()=>{
 const f=fixture();for(const q of ['active=0','active=yes','active=false&active=true','limit=0','limit=101','cursor=abc','cursor=4294967296','localId=abc','q=','q='+('x'.repeat(151)),'status=ATIVO'])await f.api('?'+q).expect(422);
 await f.api('/abc').expect(422);assert.equal(f.reads(),0);
});
test('SQL de listagem administrativa não aplica visibilidade pública e parametriza pesquisa',async()=>{
 const calls=[],c={execute:async(sql,args)=>{calls.push({sql,args});return [[]];}},m=createComboModel();
 await m.adminList(c,{limit:2,cursor:'9',localId:'1',active:false,q:'50%_!'});
 assert.deepEqual(calls[0].args,['9','1',0,'%50!%!_!!%',3]);assert.match(calls[0].sql,/ORDER BY c.id_combo DESC LIMIT \?/);assert.match(calls[0].sql,/COUNT\(\*\)/);assert.doesNotMatch(calls[0].sql,/JOIN locais|NOT EXISTS|DISPONIVEL/);
 await m.adminList(c,{limit:20});assert.deepEqual(calls[1].args,[21]);assert.doesNotMatch(calls[1].sql,/c.ativo=\?/);
});
