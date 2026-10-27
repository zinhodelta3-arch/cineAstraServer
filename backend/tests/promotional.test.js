import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import {createPromotionalService} from '../src/services/promotionalService.js';
import {createPromotionalController} from '../src/controllers/promotionalController.js';
import {promotionalRoutes} from '../src/routes/promotionalRoutes.js';
import {createPromotionalModel} from '../src/models/promotionalModel.js';
import {errorMiddleware} from '../src/middlewares/errorMiddleware.js';
import {ApiError} from '../src/utils/ApiError.js';
function fixture(){
 let rows=[],audit=[];
 const get=(kind,id)=>rows.find(r=>r.tipo===kind&&r.id_conteudo===id);
 const save=(kind,id,input)=>{if(rows.some(r=>r.tipo===kind&&r.slug===input.slug&&r.id_conteudo!==id))throw Object.assign(new Error(),{code:'ER_DUP_ENTRY'});const {slug,active,...data}=input;return {id_conteudo:id,tipo:kind,slug,ativo:active,dados:JSON.stringify(data)};};
 const model={list:async(c,k,q,admin)=>rows.filter(r=>r.tipo===k&&(!q.placement||JSON.parse(r.dados).placement===q.placement)&&(admin?(q.active===undefined||r.ativo===q.active):r.ativo)&&(!q.cursor||Number(r.id_conteudo)<Number(q.cursor))).reverse().slice(0,q.limit+1),get:async(c,k,id,admin)=>{const r=get(k,id);return r&&(admin||r.ativo)?r:null;},create:async(c,k,i)=>{const id=String(rows.length+1);rows.push(save(k,id,i));return id;},update:async(c,k,id,i)=>Object.assign(get(k,id),save(k,id,i))};
 const identity={transaction:async fn=>{const old=structuredClone(rows),a=[...audit];try{return await fn({});}catch(e){rows=old;audit=a;throw e;}},activeActor:async(c,ctx)=>({tipo_usuario:ctx.actor.tipo}),audit:async(c,action,id)=>audit.push({action,id})};
 const service=createPromotionalService({model,identity}),app=express();app.use(express.json());app.use((req,res,next)=>{res.locals.requestId='test';next();});app.use(promotionalRoutes(createPromotionalController(service),{auth:(req,res,next)=>{if(!req.headers['x-role'])throw ApiError.naoAutorizado();req.usuario={id:'1',tipo:req.headers['x-role']};next();}}));app.use(errorMiddleware);
 return {service,api:(method,path,role)=>{const r=request(app)[method]('/api/'+path);return role?r.set('x-role',role):r;},audit:()=>audit};
}
const payload={slug:'exemplo',title:'Título',summary:'Resumo'};
test('conteúdo começa oculto, ADMIN publica e desativa; leitura pública isola tipos',async()=>{
 const f=fixture();
 for(const kind of ['partners','experiences','banners']){
 const body={...payload,...(kind==='banners'?{placement:'cinema-home'}:{})};
 await f.api('post','admin/'+kind).send(body).expect(401);
 await f.api('post','admin/'+kind,'CLIENTE').send(body).expect(403);
 const created=await f.api('post','admin/'+kind,'ADMIN').send(body).expect(201),id=created.body.data.id;
 assert.equal(created.body.data.active,false);
 await f.api('get',kind+'/'+id).expect(404);
 await f.api('patch','admin/'+kind+'/'+id,'ADMIN').send({active:true}).expect(200);
 const visible=await f.api('get',kind+'/'+id).expect(200);assert.equal(visible.body.data.title,'Título');
 await f.api('patch','admin/'+kind+'/'+id,'ADMIN').send({title:'Novo'}).expect(200);
 assert.equal((await f.api('get',kind+'/'+id).expect(200)).body.data.active,true);
 await f.api('patch','admin/'+kind+'/'+id,'ADMIN').send({active:false}).expect(200);
 await f.api('get',kind+'/'+id).expect(404);
 await f.api('get','admin/'+kind+'/'+id,'ADMIN').expect(200);
 }
 assert.equal(f.audit().length,12);
 await f.api('get','admin/partners/2','ADMIN').expect(404);
});
test('paginação exclusiva, filtro admin e unicidade de slug',async()=>{
 const f=fixture();for(let i=1;i<=3;i++)await f.api('post','admin/partners','ADMIN').send({...payload,slug:'item-'+i,active:i!==2}).expect(201);
 const first=(await f.api('get','partners?limit=1').expect(200)).body.data;assert.equal(first.items[0].id,'3');assert.equal(first.pagination.nextCursor,'3');
 const last=(await f.api('get','partners?limit=1&cursor=3').expect(200)).body.data;assert.equal(last.items[0].id,'1');assert.equal(last.pagination.nextCursor,null);
 assert.equal((await f.api('get','admin/partners?active=false','ADMIN')).body.data.items[0].id,'2');
 await f.api('post','admin/partners','ADMIN').send({...payload,slug:'item-1'}).expect(409);
 await f.api('patch','admin/partners/3','ADMIN').send({slug:'item-1'}).expect(409);
 assert.equal((await f.api('get','partners/3')).body.data.slug,'item-3');
});
test('valida URLs, campos por tipo, IDs e consultas; público não consulta rascunhos',async()=>{
 const f=fixture();
 for(const extra of [{targetUrl:'javascript:alert(1)'},{imageUrl:'//evil.test/a'},{targetUrl:'/\\evil.test'},{imageUrl:'http://example.com/a'},{targetUrl:'https://user:pass@example.com'},{active:'true'},{placement:'cinema-home'}])await f.api('post','admin/partners','ADMIN').send({...payload,...extra}).expect(422);
 await f.api('post','admin/banners','ADMIN').send(payload).expect(422);
 await f.api('post','admin/experiences','ADMIN').send({...payload,details:['Sala privativa'],priceLabel:'Sob consulta',imageUrl:'https://example.com/a.png',targetUrl:'/cinema/experiencias'}).expect(201);
 await f.api('patch','admin/experiences/1','ADMIN').send({}).expect(422);
 for(const q of ['active=false','limit=101','cursor=0','limit=1&limit=2','q=x'])await f.api('get','partners?'+q).expect(422);
 await f.api('get','partners/4294967296').expect(422);
 await assert.rejects(f.service.create('partners',payload,{actor:{tipo:'FORNECEDOR'}}),{statusCode:403});
});
test('SQL filtra publicação/tipo e bloqueia edição; valores permanecem parametrizados',async()=>{
 const calls=[],db={execute:async(sql,args)=>{calls.push({sql,args});return [[]];}},m=createPromotionalModel(db);
 await m.list(null,'partners',{limit:2,cursor:'8'},false);await m.get(null,'experiences','2',false);await m.get(db,'banners','3',true,true);
 assert.match(calls[0].sql,/tipo=\? AND ativo=\? AND id_conteudo<\?/);assert.deepEqual(calls[0].args,['partners',true,'8',3]);
 assert.match(calls[1].sql,/AND ativo=TRUE/);assert.match(calls[2].sql,/FOR UPDATE$/);
});

test('banners filtram a página de destino e edição não altera os demais campos',async()=>{
 const f=fixture();
 for(const placement of ['cinema-home','streaming-home'])await f.api('post','admin/banners','ADMIN').send({...payload,slug:placement,placement,active:true}).expect(201);
 const list=await f.api('get','banners?placement=cinema-home').expect(200);
 assert.equal(list.body.data.items.length,1);assert.equal(list.body.data.items[0].slug,'cinema-home');
 await f.api('patch','admin/banners/1','ADMIN').send({title:'Atualizado'}).expect(200);
 assert.equal((await f.api('get','banners/1')).body.data.placement,'cinema-home');
 await f.api('get','banners?placement=desconhecido').expect(422);
 const calls=[],m=createPromotionalModel({execute:async(sql,args)=>{calls.push({sql,args});return [[]];}});
 await m.list(null,'banners',{placement:'cinema-home',limit:20},false);
 assert.match(calls[0].sql,/JSON_EXTRACT/);assert.deepEqual(calls[0].args,['banners',true,'cinema-home',21]);
});
