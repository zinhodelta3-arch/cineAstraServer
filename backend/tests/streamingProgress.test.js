import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import {createStreamingProgressService} from '../src/services/streamingProgressService.js';
import {createStreamingProgressModel} from '../src/models/streamingProgressModel.js';
import {createStreamingProgressController} from '../src/controllers/streamingProgressController.js';
import {streamingProgressRoutes} from '../src/routes/streamingProgressRoutes.js';
import {errorMiddleware} from '../src/middlewares/errorMiddleware.js';
import {ApiError} from '../src/utils/ApiError.js';
import {migrationPlan} from '../scripts/migrationPlan.js';
function fixture(){
 let rows=[],seq=9007199254740992n,chain=Promise.resolve();
 const owners={'10':'1','11':'1','20':'2'},films=new Map(['1','2','3','4'].map(id=>[id,{id_filme:id,titulo:'Filme '+id,duracao:100,status:'ATIVO',disponivel_streaming:true}]));
 const enrich=row=>row?{...row,...films.get(row.id_filme)}:null;
 const model={profile:async(c,o,p)=>owners[p]===o?{}:null,film:async(c,id)=>films.get(id),get:async(c,p,f)=>enrich(rows.find(r=>r.profileId===p&&r.id_filme===f)),save:async(c,p,f,d,exists)=>{
  let row=rows.find(r=>r.profileId===p&&r.id_filme===f);if(!exists){row={profileId:p,id_filme:f,id_progresso:String(++seq),versao:0};rows.push(row);}
  Object.assign(row,{posicao_segundos:d.position,duracao_segundos:d.duration,concluido:d.completed,versao:row.versao+1,atualizado_em:'2026-10-25 12:00:00.000'});
 },remove:async(c,p,f)=>{const n=rows.length;rows=rows.filter(r=>r.profileId!==p||r.id_filme!==f);return rows.length<n;},list:async(c,p,{limit,cursor},continuing)=>rows.filter(r=>r.profileId===p).map(enrich).filter(r=>!continuing||(!r.concluido&&r.posicao_segundos>0&&r.status==='ATIVO'&&r.disponivel_streaming)).filter(r=>!cursor||BigInt(r.id_progresso)<BigInt(cursor.split('_')[1])).sort((a,b)=>BigInt(a.id_progresso)>BigInt(b.id_progresso)?-1:1).slice(0,limit+1)};
 const identity={transaction:async fn=>{const old=chain;let release;chain=new Promise(r=>release=r);await old;try{return await fn({});}finally{release();}},activeActor:async(c,ctx)=>({id_usuario:ctx.actor.id,tipo_usuario:ctx.actor.tipo}),audit:async()=>{}};
 const service=createStreamingProgressService({model,identity}),app=express();app.use(express.json());
 const auth=(req,res,next)=>{if(!req.get('x-user'))throw ApiError.naoAutorizado();req.usuario={id:req.get('x-user'),tipo:req.get('x-role')||'CLIENTE'};next();};
 app.use(streamingProgressRoutes(createStreamingProgressController(service),{auth,limits:{streamingProgress:[]}}));app.use(errorMiddleware);
 const api=(method,path,profile='10',owner='1')=>request(app)[method](`/api/streaming/profiles/${profile}/${path}`).set('x-user',owner);
 return {api,app,films,service};
}
test('salva progresso, calcula conclusão em 95%, permite reinício e remove histórico',async()=>{
 const f=fixture();await f.api('get','progress/1').expect(404);
 const first=await f.api('put','progress/1').send({positionSeconds:120,expectedVersion:0}).expect(200);
 assert.deepEqual(first.body.data,{filmId:'1',positionSeconds:120,durationSeconds:6000,completed:false,version:1,updatedAt:'2026-10-25T12:00:00.000Z',catalogAvailable:true,title:'Filme 1'});
 assert.equal((await f.api('get','continue-watching')).body.data.items.length,1);
 await f.api('put','progress/1').send({positionSeconds:5699,expectedVersion:1}).expect(200);
 const complete=await f.api('put','progress/1').send({positionSeconds:5700,expectedVersion:2}).expect(200);assert.equal(complete.body.data.completed,true);
 assert.equal((await f.api('get','continue-watching')).body.data.items.length,0);assert.equal((await f.api('get','history')).body.data.items.length,1);
 await f.api('put','progress/1').send({positionSeconds:0,expectedVersion:3}).expect(200);assert.equal((await f.api('get','continue-watching')).body.data.items.length,0);
 await f.api('put','progress/1').send({positionSeconds:10,expectedVersion:4}).expect(200);assert.equal((await f.api('get','continue-watching')).body.data.items.length,1);
 await f.api('delete','progress/1').expect(204);await f.api('delete','progress/1').expect(204);assert.deepEqual((await f.api('get','history')).body.data.items,[]);
});
test('versão impede atualizações atrasadas/concorrentes e posição não excede duração',async()=>{
 const f=fixture();const results=await Promise.all([100,200].map(positionSeconds=>f.api('put','progress/1').send({positionSeconds,expectedVersion:0})));assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 const current=(await f.api('get','progress/1')).body.data;
 await f.api('put','progress/1').send({positionSeconds:6001,expectedVersion:current.version}).expect(422);
 assert.deepEqual((await f.api('get','progress/1')).body.data,current);
 await f.api('put','progress/1').send({positionSeconds:6000,expectedVersion:current.version}).expect(200);
});
test('histórico paginado com empate de timestamp, separação de perfis e catálogo indisponível',async()=>{
 const f=fixture();for(const id of ['1','2','3'])await f.api('put','progress/'+id).send({positionSeconds:30,expectedVersion:0}).expect(200);
 const first=await f.api('get','history?limit=2').expect(200);assert.deepEqual(first.body.data.items.map(r=>r.filmId),['3','2']);
 const last=await f.api('get','history?limit=2&cursor='+first.body.data.pagination.nextCursor).expect(200);assert.deepEqual(last.body.data.items.map(r=>r.filmId),['1']);assert.equal(last.body.data.pagination.nextCursor,null);
 assert.deepEqual((await f.api('get','history','11')).body.data.items,[]);
 f.films.get('3').status='INATIVO';f.films.get('2').disponivel_streaming=false;
 assert.deepEqual((await f.api('get','continue-watching')).body.data.items.map(r=>r.filmId),['1']);
 assert.equal((await f.api('get','progress/3')).body.data.title,null);
 await f.api('put','progress/3').send({positionSeconds:31,expectedVersion:1}).expect(404);
 await f.api('delete','progress/3').expect(204);
});
test('autenticação e propriedade em todos os endpoints, sem conceder acesso ao vídeo',async()=>{
 const f=fixture();await request(f.app).get('/api/streaming/profiles/10/history').expect(401);await f.api('get','history').set('x-role','ADMIN').expect(403);
 for(const p of ['20','99'])for(const [method,path] of [['get','history'],['get','continue-watching'],['get','progress/1'],['put','progress/1'],['delete','progress/1']]){const req=f.api(method,path,p);if(method==='put')req.send({positionSeconds:0,expectedVersion:0});await req.expect(404);}
 await assert.rejects(f.service.list('10',{limit:20},false,{actor:{id:'1',tipo:'ADMIN'}}),{statusCode:403});
});
test('valida corpo estrito, IDs, limite e cursor composto',async()=>{
 const f=fixture();for(const body of [{positionSeconds:-1,expectedVersion:0},{positionSeconds:1.5,expectedVersion:0},{positionSeconds:1},{positionSeconds:1,expectedVersion:0,durationSeconds:3},{positionSeconds:1,expectedVersion:0,completed:true},{positionSeconds:'1',expectedVersion:0}])await f.api('put','progress/1').send(body).expect(422);
 for(const q of ['limit=0','limit=101','cursor=bad','cursor=2026-02-30T12:00:00.000Z_1','cursor=2026-10-25T12:00:00.000Z_18446744073709551616','cursor=2026-10-25T12:00:00.000Z_0','ownerId=2'])await f.api('get','history?'+q).expect(422);
 await f.api('get','progress/abc').expect(422);await f.api('get','history','4294967296').expect(422);
 await f.api('put','progress/99').send({positionSeconds:0,expectedVersion:0}).expect(404);
 f.films.get('1').duracao=null;await f.api('put','progress/1').send({positionSeconds:0,expectedVersion:0}).expect(503);
});
test('SQL de paginação usa timestamp/ID, filtra continuar e migration mantém unicidade/cascata',async()=>{
 const calls=[],c={execute:async(sql,args)=>{calls.push({sql,args});return [[]];}},m=createStreamingProgressModel();
 await m.list(c,'10',{limit:2,cursor:'2026-10-25T12:00:00.000Z_9007199254740993'},true);
 assert.deepEqual(calls[0].args,['10','2026-10-25 12:00:00.000','2026-10-25 12:00:00.000','9007199254740993',3]);
 for(const part of ['p.id_perfil=?','p.concluido=FALSE','p.posicao_segundos>0',"f.status='ATIVO'",'f.disponivel_streaming=TRUE','p.atualizado_em DESC,p.id_progresso DESC'])assert.ok(calls[0].sql.includes(part));
 const plan=await migrationPlan(),entry=plan.find(p=>p.name.startsWith('20261025_33_streaming_progress.sql:'));assert.ok(entry);assert.match(entry.sql,/UNIQUE KEY.*\(id_perfil,id_filme\)/);assert.match(entry.sql,/ON DELETE CASCADE/);assert.match(entry.sql,/posicao_segundos<=duracao_segundos/);
});
