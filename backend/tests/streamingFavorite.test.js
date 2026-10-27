import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import {createStreamingFavoriteService} from '../src/services/streamingFavoriteService.js';
import {createStreamingFavoriteModel} from '../src/models/streamingFavoriteModel.js';
import {createStreamingFavoriteController} from '../src/controllers/streamingFavoriteController.js';
import {streamingFavoriteRoutes} from '../src/routes/streamingFavoriteRoutes.js';
import {errorMiddleware} from '../src/middlewares/errorMiddleware.js';
import {ApiError} from '../src/utils/ApiError.js';
import {migrationPlan} from '../scripts/migrationPlan.js';
function fixture(){
 let favorites=[],seq=9007199254740992n,chain=Promise.resolve(),fail=false;
 const films=new Map(['1','2','3','4'].map(id=>[id,{id_filme:id,titulo:'Filme '+id,duracao:120,classificacao:'12',status:'ATIVO',disponivel_streaming:true,url_reproducao:'secret'}]));
 const owners={'10':'1','11':'1','20':'2'};
 const model={profile:async(c,owner,id)=>owners[id]===owner?{id_perfil:id}:null,film:async(c,id)=>films.get(id),existing:async(c,p,f)=>favorites.find(x=>x.profileId===p&&x.id_filme===f),add:async(c,p,f)=>{favorites.push({profileId:p,id_favorito:String(++seq),id_filme:f,criado_em:'2026-10-25 12:00:00'});},remove:async(c,p,f)=>{const n=favorites.length;favorites=favorites.filter(x=>x.profileId!==p||x.id_filme!==f);return favorites.length<n;},list:async(c,p,{limit,cursor})=>favorites.filter(x=>x.profileId===p&&(!cursor||BigInt(x.id_favorito)<BigInt(cursor))).sort((a,b)=>BigInt(a.id_favorito)>BigInt(b.id_favorito)?-1:1).slice(0,limit+1).map(x=>({...x,...films.get(x.id_filme)}))};
 const identity={transaction:async fn=>{const old=chain;let release;chain=new Promise(r=>release=r);await old;const snapshot=structuredClone(favorites);try{return await fn({});}catch(e){favorites=snapshot;throw e;}finally{release();}},activeActor:async(c,ctx)=>({id_usuario:ctx.actor.id,tipo_usuario:ctx.actor.tipo}),audit:async()=>{if(fail)throw new Error('audit failed');}};
 const service=createStreamingFavoriteService({model,identity}),app=express();app.use(express.json());
 const auth=(req,res,next)=>{if(!req.get('x-user'))throw ApiError.naoAutorizado();req.usuario={id:req.get('x-user'),tipo:req.get('x-role')||'CLIENTE'};next();};
 app.use(streamingFavoriteRoutes(createStreamingFavoriteController(service),{auth,limits:{checkout:[]}}));app.use(errorMiddleware);
 const api=(method,profile='10',suffix='',owner='1')=>request(app)[method](`/api/streaming/profiles/${profile}/favorites${suffix}`).set('x-user',owner);
 return {api,app,service,films,failAudit:()=>fail=true};
}
test('favoritos paginados por perfil, IDs grandes e operações idempotentes',async()=>{
 const f=fixture();assert.deepEqual((await f.api('get')).body.data.items,[]);
 await Promise.all([f.api('put','10','/1').expect(204),f.api('put','10','/1').expect(204)]);
 for(const id of ['2','3'])await f.api('put','10','/'+id).expect(204);
 await f.api('put','11','/4').expect(204);
 const first=await f.api('get','10','?limit=2').expect(200);assert.equal(first.headers['cache-control'],'no-store');
 assert.deepEqual(first.body.data.items.map(x=>x.filmId),['3','2']);assert.equal(first.body.data.pagination.nextCursor,'9007199254740994');
 assert.deepEqual(first.body.data.items[0],{id:'9007199254740995',filmId:'3',addedAt:'2026-10-25T12:00:00.000Z',catalogAvailable:true,film:{title:'Filme 3',duration:120,classification:'12'}});
 const last=await f.api('get','10','?limit=2&cursor='+first.body.data.pagination.nextCursor).expect(200);assert.deepEqual(last.body.data.items.map(x=>x.filmId),['1']);assert.equal(last.body.data.pagination.nextCursor,null);
 assert.deepEqual((await f.api('get','11')).body.data.items.map(x=>x.filmId),['4']);
 await f.api('delete','10','/1').expect(204);await f.api('delete','10','/1').expect(204);
});
test('exige dono e CLIENTE em leitura e escrita, inclusive exclusão de item ausente',async()=>{
 const f=fixture();await request(f.app).get('/api/streaming/profiles/10/favorites').expect(401);
 await f.api('get').set('x-role','ADMIN').expect(403);
 for(const profile of ['20','99']){await f.api('get',profile).expect(404);await f.api('put',profile,'/1').expect(404);await f.api('delete',profile,'/1').expect(404);}
 await assert.rejects(f.service.list('10',{limit:20},{actor:{id:'1',tipo:'ADMIN'}}),{statusCode:403});
 await f.api('put','20','/1','2').expect(204);assert.deepEqual((await f.api('get')).body.data.items,[]);
});
test('não adiciona filmes indisponíveis; favorito arquivado fica removível sem expor catálogo privado',async()=>{
 const f=fixture();await f.api('put','10','/1').expect(204);f.films.get('1').status='INATIVO';
 await f.api('put','10','/1').expect(204);await f.api('put','11','/1').expect(404);
 f.films.get('2').disponivel_streaming=false;await f.api('put','10','/2').expect(404);await f.api('put','10','/99').expect(404);
 const item=(await f.api('get')).body.data.items[0];assert.equal(item.catalogAvailable,false);assert.equal(item.film,null);
 await f.api('delete','10','/1').expect(204);
});
test('validação de IDs, cursor, limite e corpo bloqueia entradas inválidas',async()=>{
 const f=fixture();
 for(const id of ['0','-1','abc','4294967296']){await f.api('get',id).expect(422);await f.api('put','10','/'+id).expect(422);}
 for(const q of ['limit=0','limit=101','limit=abc','limit=1&limit=2','cursor=abc','cursor=0','cursor=18446744073709551616','userId=2'])await f.api('get','10','?'+q).expect(422);
 await f.api('put','10','/1').send({ownerId:'2'}).expect(422);
 await f.api('delete','10','/1').send({profileId:'20'}).expect(422);
 await f.api('get','10','?limit=100').expect(200);
});
test('falha de auditoria reverte inclusão e exclusão',async()=>{
 const f=fixture(),ctx={actor:{id:'1',tipo:'CLIENTE'}};await f.api('put','10','/1');f.failAudit();
 await assert.rejects(f.service.add('10','2',ctx),/audit failed/);await assert.rejects(f.service.remove('10','1',ctx),/audit failed/);
 assert.deepEqual((await f.api('get')).body.data.items.map(x=>x.filmId),['1']);
});
test('SQL escopa perfil e filme; migration garante unicidade e limpeza em cascata',async()=>{
 const calls=[],c={execute:async(sql,args)=>{calls.push({sql,args});return sql.startsWith('DELETE')?[{affectedRows:1}]:[[]];}},m=createStreamingFavoriteModel();
 await m.profile(c,'7','10');await m.list(c,'10',{limit:2,cursor:'9007199254740995'});await m.remove(c,'10','1');
 assert.match(calls[0].sql,/id_usuario=\? AND id_perfil=\?/);assert.deepEqual(calls[0].args,['7','10']);
 assert.match(calls[1].sql,/fav.id_perfil=\? AND fav.id_favorito<\?/);assert.deepEqual(calls[1].args,['10','9007199254740995',3]);assert.doesNotMatch(calls[1].sql,/url_reproducao/);
 assert.deepEqual(calls[2].args,['10','1']);
 const plan=await migrationPlan(),i=plan.findIndex(p=>p.name.startsWith('20261025_32_streaming_favorites.sql:'));assert.ok(i>plan.findIndex(p=>p.name.startsWith('20261025_31_streaming_profiles.sql:')));
 assert.match(plan[i].sql,/UNIQUE KEY.*\(id_perfil,id_filme\)/);assert.match(plan[i].sql,/REFERENCES streaming_perfis\(id_perfil\) ON DELETE CASCADE/);
});
