import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import {createStreamingProfileService} from '../src/services/streamingProfileService.js';
import {createStreamingProfileModel} from '../src/models/streamingProfileModel.js';
import {createStreamingProfileController} from '../src/controllers/streamingProfileController.js';
import {streamingProfileRoutes} from '../src/routes/streamingProfileRoutes.js';
import {errorMiddleware} from '../src/middlewares/errorMiddleware.js';
import {ApiError} from '../src/utils/ApiError.js';
import {migrationPlan} from '../scripts/migrationPlan.js';
function fixture(){
 let rows=[],nextId=1,chain=Promise.resolve(),failAudit=false;
 const model={list:async(c,owner)=>rows.filter(r=>r.owner===owner),insert:async(c,owner,d,key)=>{const id=String(nextId++);rows.push({owner,id_perfil:id,nome:d.name,avatar:d.avatar,infantil:d.kids,selecionado:d.selected});return id;},update:async(c,owner,id,d)=>Object.assign(rows.find(r=>r.owner===owner&&r.id_perfil===id),{nome:d.name,avatar:d.avatar,infantil:d.kids}),remove:async(c,owner,id)=>{rows=rows.filter(r=>r.owner!==owner||r.id_perfil!==id);},select:async(c,owner,id)=>{rows.filter(r=>r.owner===owner).forEach(r=>r.selecionado=r.id_perfil===id);}};
 const identity={transaction:async fn=>{const previous=chain;let release;chain=new Promise(r=>release=r);await previous;const before=structuredClone(rows);try{return await fn({});}catch(e){rows=before;throw e;}finally{release();}},activeActor:async(c,ctx)=>({id_usuario:ctx.actor.id,tipo_usuario:ctx.actor.tipo}),audit:async()=>{if(failAudit)throw new Error('audit failed');}};
 const service=createStreamingProfileService({model,identity}),app=express();app.use(express.json());
 const auth=(req,res,next)=>{if(!req.get('x-user'))throw ApiError.naoAutorizado();req.usuario={id:req.get('x-user'),tipo:req.get('x-role')||'CLIENTE'};next();};
 app.use(streamingProfileRoutes(createStreamingProfileController(service),{auth,limits:{checkout:[]}}));app.use(errorMiddleware);
 const api=(method,path='',owner='1')=>request(app)[method]('/api/streaming/profiles'+path).set('x-user',owner);
 return {app,api,service,failAudit:()=>failAudit=true};
}
const ctx={actor:{id:'1',tipo:'CLIENTE'}};
test('CRUD, seleção persistente, isolamento e proteção do último perfil',async()=>{
 const f=fixture();assert.deepEqual((await f.api('get').expect(200)).body.data,{items:[],activeProfileId:null,maxProfiles:5});
 const a=await f.api('post').send({name:'  Ana  '}).expect(201);assert.equal(a.headers.location,'/api/streaming/profiles/1');assert.equal(a.body.data.name,'Ana');assert.equal(a.body.data.selected,true);
 await f.api('delete','/1').expect(409);
 await f.api('post').send({name:'Bia',avatar:'gato',kids:true}).expect(201);
 await f.api('post','/2/select').send({}).expect(200);
 assert.equal((await f.api('get').expect(200)).body.data.activeProfileId,'2');
 await f.api('patch','/2').send({name:'Bia nova',avatar:'lua',kids:false}).expect(200);
 assert.equal((await f.api('get','/2').expect(200)).body.data.kids,false);
 for(const method of ['get','patch','delete']){const req=f.api(method,'/2','2');if(method==='patch')req.send({name:'Intruso'});await req.expect(404);}
 await f.api('post','/2/select','2').send({}).expect(404);
 assert.deepEqual((await f.api('get','','2').expect(200)).body.data.items,[]);
 await f.api('delete','/2').expect(204);assert.equal((await f.api('get').expect(200)).body.data.activeProfileId,'1');
 await f.api('get','/2').expect(404);
});
test('limite cinco e nomes únicos inclusive NFC e maiúsculas, preservados em corrida',async()=>{
 const f=fixture();await f.api('post').send({name:'José'}).expect(201);
 await f.api('post').send({name:' JOSE\u0301 '}).expect(409);
 await f.api('post').send({name:'José'}).set('x-user','2').expect(201);
 for(const name of ['B','C','D'])await f.api('post').send({name}).expect(201);
 const results=await Promise.all(['E','F'].map(name=>f.api('post').send({name})));
 assert.deepEqual(results.map(r=>r.status).sort(),[201,409]);
 const list=(await f.api('get')).body.data.items;assert.equal(list.length,5);assert.equal(list.filter(p=>p.selected).length,1);
 await f.api('patch','/1').send({name:'B'}).expect(409);
 const second=fixture();const duplicate=await Promise.all([second.api('post').send({name:'Ana'}),second.api('post').send({name:'ana'})]);assert.deepEqual(duplicate.map(r=>r.status).sort(),[201,409]);
});
test('remoções concorrentes mantêm um perfil; falha de auditoria reverte escrita',async()=>{
 const f=fixture();await f.api('post').send({name:'A'});await f.api('post').send({name:'B'});
 const results=await Promise.all([f.api('delete','/1'),f.api('delete','/2')]);assert.deepEqual(results.map(r=>r.status).sort(),[204,409]);
 const before=(await f.api('get')).body.data;assert.equal(before.items.length,1);assert.equal(before.activeProfileId,before.items[0].id);
 f.failAudit();await assert.rejects(f.service.patch(before.items[0].id,{name:'Changed'},ctx),/audit failed/);assert.deepEqual((await f.api('get')).body.data,before);
});
test('validação e autenticação impedem IDs inválidos, campos extras e fotos arbitrárias',async()=>{
 const f=fixture();await request(f.app).get('/api/streaming/profiles').expect(401);
 await f.api('get').set('x-role','ADMIN').expect(403);
 await assert.rejects(f.service.list({actor:{id:'1',tipo:'FORNECEDOR'}}),{statusCode:403});
 for(const data of [{name:''},{name:'a'.repeat(25)},{name:'X',avatar:'bad'},{name:'X',kids:'true'},{name:'X',ownerId:'2'},{name:'X',selected:true},{name:'X',photo:'data:image/svg+xml;bad'},{name:'\u0000'}])await f.api('post').send(data).expect(422);
 for(const id of ['0','-1','abc','4294967296','1%20OR%201=1'])await f.api('get','/'+id).expect(422);
 await f.api('patch','/1').send({}).expect(422);
 await f.api('post','/1/select').send({ownerId:'2'}).expect(422);
});
test('SQL filtra por proprietário em todas operações e migration entra no plano',async()=>{
 const calls=[],c={execute:async(sql,args)=>{calls.push({sql,args});return sql.startsWith('INSERT')?[{insertId:1}]:[[]];}},m=createStreamingProfileModel();
 await m.list(c,'2');await m.insert(c,'2',{name:'Ana',avatar:'lua',kids:false,selected:true},'ana');await m.update(c,'2','1',{name:'B',avatar:'gato',kids:true},'b');await m.select(c,'2','1');await m.remove(c,'2','1');
 for(const call of calls.filter(x=>!x.sql.startsWith('INSERT')))assert.match(call.sql,/WHERE id_usuario=\?/);
 assert.deepEqual(calls[4].args,['2','1']);assert.deepEqual(calls[3].args,['1','2']);
 const plan=await migrationPlan();assert.ok(plan.some(p=>p.name.startsWith('20261025_31_streaming_profiles.sql:')&&p.sql.includes('UNIQUE KEY uk_streaming_perfil_nome')));
});
