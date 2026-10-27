import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import {createAdminDirectoryModel} from '../src/models/adminDirectoryModel.js';
import {createAdminDirectoryService} from '../src/services/adminDirectoryService.js';
import {createAdminDirectoryController} from '../src/controllers/adminDirectoryController.js';
import {adminDirectoryRoutes} from '../src/routes/adminDirectoryRoutes.js';
import {errorMiddleware} from '../src/middlewares/errorMiddleware.js';
import {ApiError} from '../src/utils/ApiError.js';
function fixture(){
 const users=[{id_usuario:'3',nome:'Ana',email:'ana@example.com',tipo_usuario:'CLIENTE',status:'INATIVO',data_cadastro:null,senha:'secret',cpf:'private'},{id_usuario:'2',nome:'Ana Admin',email:'admin@example.com',tipo_usuario:'ADMIN',status:'ATIVO',data_cadastro:'2026-10-25 12:00:00'},{id_usuario:'1',nome:'Beto',email:'b@example.com',tipo_usuario:'CLIENTE',status:'ATIVO',data_cadastro:'2026-10-25 12:00:00'}];
 const privacy=[{id_solicitacao:'9007199254740995',id_usuario:'3',tipo:'EXCLUSAO',status:'RECEBIDA',criada_em:'2026-10-25 12:00:00.000',encerrada_em:null,nome:'Ana',email:'ana@example.com',motivo_decisao:'private'},{id_solicitacao:'9007199254740993',id_usuario:'1',tipo:'EXCLUSAO',status:'RECUSADA',criada_em:'2026-10-24 12:00:00.000',encerrada_em:'2026-10-25 12:00:00.000',nome:'Beto',email:'b@example.com'}];
 const calls=[];
 const filter=(rows,q,pk)=>rows.filter(r=>(!q.cursor||BigInt(r[pk])<BigInt(q.cursor))&&(!q.userId||r.id_usuario===q.userId)&&(!q.status||r.status===q.status)&&(!q.role||r.tipo_usuario===q.role)&&(!q.type||r.tipo===q.type)&&(!q.q||(r.nome+' '+r.email).toLowerCase().includes(q.q.toLowerCase()))).slice(0,q.limit+1);
 const model={users:async(c,q)=>{calls.push(q);return filter(users,q,'id_usuario');},privacy:async(c,q)=>{calls.push(q);return filter(privacy,q,'id_solicitacao');}};
 const identity={transaction:async fn=>fn({}),activeActor:async(c,ctx)=>{if(ctx.actor.id==='99')throw ApiError.naoAutorizado();return {tipo_usuario:ctx.actor.tipo};}};
 const service=createAdminDirectoryService({model,identity}),app=express();
 const auth=(req,res,next)=>{if(!req.get('x-role'))throw ApiError.naoAutorizado();req.usuario={id:req.get('x-user')||'1',tipo:req.get('x-role')};next();};
 app.use(adminDirectoryRoutes(createAdminDirectoryController(service),{auth}));app.use(errorMiddleware);
 const api=path=>request(app).get('/api/admin/'+path).set('x-role','ADMIN');return {app,api,service,calls};
}
test('usuários: paginação, filtros combinados e DTO sem segredos',async()=>{
 const f=fixture(),first=await f.api('users?limit=2').expect(200);assert.equal(first.headers['cache-control'],'no-store');
 assert.deepEqual(first.body.data.items[0],{id:'3',name:'Ana',email:'ana@example.com',role:'CLIENTE',status:'INATIVO',createdAt:null});assert.equal(first.body.data.pagination.nextCursor,'2');
 const last=await f.api('users?limit=2&cursor=2').expect(200);assert.deepEqual(last.body.data.items.map(x=>x.id),['1']);assert.equal(last.body.data.pagination.nextCursor,null);
 const filtered=await f.api('users?q=ana&role=CLIENTE&status=INATIVO&userId=3').expect(200);assert.deepEqual(filtered.body.data.items.map(x=>x.id),['3']);
 assert.deepEqual((await f.api('users?q=absent')).body.data,{items:[],pagination:{limit:20,nextCursor:null}});
 assert.equal((await f.api('users?q=admin%40example.com')).body.data.items[0].id,'2');
});
test('privacidade: fila paginada, IDs grandes, filtros e detalhe em rota separada',async()=>{
 const f=fixture(),first=await f.api('privacy-requests?limit=1').expect(200);assert.equal(first.body.data.pagination.nextCursor,'9007199254740995');
 assert.deepEqual(first.body.data.items[0],{id:'9007199254740995',user:{id:'3',name:'Ana',email:'ana@example.com'},type:'EXCLUSAO',status:'RECEBIDA',createdAt:'2026-10-25T12:00:00.000Z',closedAt:null});
 const next=await f.api('privacy-requests?limit=1&cursor='+first.body.data.pagination.nextCursor).expect(200);assert.equal(next.body.data.items[0].id,'9007199254740993');assert.equal(next.body.data.pagination.nextCursor,null);
 assert.equal((await f.api('privacy-requests?q=Beto&userId=1&type=EXCLUSAO&status=RECUSADA')).body.data.items.length,1);
 assert.deepEqual((await f.api('privacy-requests?status=CONCLUIDA')).body.data.items,[]);
});
test('sem sessão, papel não ADMIN ou sessão revogada não consulta dados',async()=>{
 const f=fixture();
 for(const path of ['users','privacy-requests']){
  await request(f.app).get('/api/admin/'+path).expect(401);
  for(const role of ['CLIENTE','FORNECEDOR','SUPERVISOR','COLABORADOR'])await f.api(path).set('x-role',role).expect(403);
  await f.api(path).set('x-user','99').expect(401);
 }
 await assert.rejects(f.service.users({limit:20},{actor:{id:'1',tipo:'CLIENTE'}}),{statusCode:403});
 await assert.rejects(f.service.privacy({limit:20},{actor:{id:'1',tipo:'CLIENTE'}}),{statusCode:403});assert.equal(f.calls.length,0);
});
test('filtros inválidos, limites, arrays e IDs fora da faixa são rejeitados',async()=>{
 const f=fixture();for(const p of ['users','privacy-requests'])for(const q of ['limit=0','limit=101','limit=abc','limit=2&limit=3','cursor=abc','cursor=0','cursor=18446744073709551616','userId=4294967296','q=','q='+('x'.repeat(151)),'q=a&q=b','status=INVALID','sort=senha'])await f.api(p+'?'+q).expect(422);
 await f.api('users?cursor=4294967296').expect(422);await f.api('users?role=ROOT').expect(422);await f.api('privacy-requests?type=EXPORT').expect(422);assert.equal(f.calls.length,0);
});
test('SQL parametrizado, busca literal de %/_/!, projeção mínima e filtros no banco',async()=>{
 const calls=[],c={execute:async(sql,args)=>{calls.push({sql,args});return [[]];}},model=createAdminDirectoryModel();
 await model.users(c,{limit:2,cursor:'9',role:'CLIENTE',status:'INATIVO',userId:'3',q:"50%_! O'Brien"});
 assert.deepEqual(calls[0].args,['9','3','CLIENTE','INATIVO',"%50!%!_!! O'Brien%","%50!%!_!! O'Brien%",3]);
 assert.match(calls[0].sql,/u.id_usuario<\?/);assert.match(calls[0].sql,/ESCAPE '!'/);assert.doesNotMatch(calls[0].sql,/senha|cpf|telefone|data_nascimento|O'Brien/);
 await model.privacy(c,{limit:20,cursor:'9007199254740995',userId:'3',status:'RECEBIDA',type:'EXCLUSAO',q:'Ana'});
 assert.deepEqual(calls[1].args,['9007199254740995','3','RECEBIDA','EXCLUSAO','%Ana%','%Ana%',21]);assert.match(calls[1].sql,/ORDER BY p.id_solicitacao DESC LIMIT \?/);assert.doesNotMatch(calls[1].sql,/motivo_decisao|senha|cpf/);
});
