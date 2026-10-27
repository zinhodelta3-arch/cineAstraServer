import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import {createIdentityModel} from '../src/models/identityModel.js';
import {createProfileService} from '../src/services/profileService.js';
import {createIdentityController} from '../src/controllers/identityController.js';
import {identityRoutes} from '../src/routes/identityRoutes.js';
import {errorMiddleware} from '../src/middlewares/errorMiddleware.js';
import {ApiError} from '../src/utils/ApiError.js';
function fixture(){
 let reads=0;
 const data=[{owner:'1',link:'ATIVO',id_usuario:'9',nome:'A',status:'ATIVO',faixa_etaria:'ATE_16',cpf:'secret'},{owner:'1',link:'ATIVO',id_usuario:'8',nome:'B',status:'ATIVO',faixa_etaria:null},{owner:'1',link:'ATIVO',id_usuario:'7',nome:'C',status:'BLOQUEADO',faixa_etaria:'ATE_16'},{owner:'1',link:'ATIVO',id_usuario:'6',nome:'D',status:'ATIVO',faixa_etaria:'MAIOR_16'},{owner:'2',link:'ATIVO',id_usuario:'5',nome:'E',status:'ATIVO',faixa_etaria:'ATE_16'},{owner:'1',link:'REVOGADO',id_usuario:'4',nome:'F',status:'ATIVO',faixa_etaria:'ATE_16'}];
 const model={children:async(c,owner,q)=>{reads++;return data.filter(r=>r.owner===owner&&r.link==='ATIVO'&&(!q.cursor||BigInt(r.id_usuario)<BigInt(q.cursor))).slice(0,q.limit+1);}};
 const identity={model,transaction:async fn=>fn({}),activeActor:async(c,ctx)=>{if(ctx.actor.id==='99')throw ApiError.naoAutorizado();return {id_usuario:ctx.actor.id};}};
 const service=createProfileService({identity,config:{},providers:{}}),app=express();
 const auth=(req,res,next)=>{if(!req.get('x-user'))throw ApiError.naoAutorizado();req.usuario={id:req.get('x-user'),tipo:req.get('x-role')||'CLIENTE'};next();};
 app.use(identityRoutes(createIdentityController({},service),{auth,limits:{register:[],login:[],recovery:[],twoFactor:[]}}));app.use(errorMiddleware);
 return {app,reads:()=>reads,api:(q='',owner='1')=>request(app).get('/api/users/me/children'+q).set('x-user',owner)};
}
test('lista vínculos próprios, paginação e indicador de elegibilidade sem dados sensíveis',async()=>{
 const f=fixture(),first=await f.api('?limit=2').expect(200);assert.equal(first.headers['cache-control'],'no-store');
 assert.deepEqual(first.body.data,{items:[{id:'9',name:'A',status:'ATIVO',parentalControlsAvailable:true},{id:'8',name:'B',status:'ATIVO',parentalControlsAvailable:false}],pagination:{limit:2,nextCursor:'8'}});
 const next=await f.api('?limit=2&cursor=8').expect(200);assert.deepEqual(next.body.data.items.map(r=>[r.id,r.parentalControlsAvailable]),[['7',false],['6',false]]);assert.equal(next.body.data.pagination.nextCursor,null);
 assert.deepEqual((await f.api('','2')).body.data.items.map(r=>r.id),['5']);
 assert.deepEqual((await f.api('','3')).body.data,{items:[],pagination:{limit:20,nextCursor:null}});
 // ADMIN does not gain access to another guardian's children.
 assert.deepEqual((await f.api('','3').set('x-role','ADMIN')).body.data.items,[]);
});
test('sessão ausente/expirada e parâmetros manipulados não consultam dependentes',async()=>{
 const f=fixture();await request(f.app).get('/api/users/me/children').expect(401);await f.api('','99').expect(401);
 for(const q of ['limit=0','limit=101','limit=1&limit=2','cursor=abc','cursor=0','cursor=4294967296','userId=2','guardianId=2'])await f.api('?'+q).expect(422);
 assert.equal(f.reads(),0);
});
test('SQL filtra responsável e vínculo ativo e seleciona última prova vigente',async()=>{
 const calls=[],c={execute:async(sql,args)=>{calls.push({sql,args});return [[]];}};
 await createIdentityModel().children(c,'1',{limit:2,cursor:'8'});
 assert.deepEqual(calls[0].args,['1','8',3]);const sql=calls[0].sql;
 for(const part of ["r.id_responsavel=?","r.status='ATIVO'",'u.id_usuario<?','v.expiracao>UTC_TIMESTAMP(3)','ORDER BY v.id_verificacao DESC LIMIT 1','ORDER BY u.id_usuario DESC LIMIT ?'])assert.ok(sql.includes(part));
 assert.doesNotMatch(sql,/cpf|email|senha|referencia_prova|data_nascimento|INSERT|UPDATE|DELETE/);
});
