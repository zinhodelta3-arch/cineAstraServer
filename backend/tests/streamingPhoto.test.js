import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import sharp from 'sharp';
import {createStreamingPhotoService,normalizeProfilePhoto} from '../src/services/streamingPhotoService.js';
import {createStreamingPhotoModel} from '../src/models/streamingPhotoModel.js';
import {createStreamingPhotoController} from '../src/controllers/streamingPhotoController.js';
import {streamingPhotoRoutes} from '../src/routes/streamingPhotoRoutes.js';
import {createStreamingProfileService} from '../src/services/streamingProfileService.js';
import {errorMiddleware} from '../src/middlewares/errorMiddleware.js';
import {deadline} from '../src/middlewares/requestMiddleware.js';
import {ApiError} from '../src/utils/ApiError.js';
const png=()=>sharp({create:{width:700,height:350,channels:3,background:'#123456'}}).png().toBuffer();
function fixture(processor){
 let photo=null,auditFail=false,owner='1';
 const model={own:async(c,user,id)=>user===owner&&id==='7'?{id_perfil:id}:null,get:async()=>photo,put:async(c,id,image)=>{photo={imagem:image.buffer,largura:image.width,altura:image.height};},remove:async()=>{photo=null;}};
 const identity={activeActor:async(c,ctx)=>({id_usuario:ctx.actor.id,tipo_usuario:ctx.actor.tipo}),transaction:async fn=>{const before=photo;try{return await fn({});}catch(e){photo=before;throw e;}},audit:async()=>{if(auditFail)throw new Error('audit failed');}};
 const service=createStreamingPhotoService({model,identity,...(processor?{processor}:{})}),app=express();app.use(deadline(5000));app.use((req,res,next)=>{res.locals.requestId='test';next();});app.use(streamingPhotoRoutes(createStreamingPhotoController(service),{auth:(req,res,next)=>{if(!req.headers['x-user'])throw ApiError.naoAutorizado();req.usuario={id:req.headers['x-user'],tipo:req.headers['x-role']??'CLIENTE'};next();},limits:{upload:[]}}));app.use(errorMiddleware);
 return {service,app,model,identity,photo:()=>photo,fail:()=>{auditFail=true;},changeOwner:()=>{owner='2';},api:(method,user='1')=>request(app)[method]('/api/streaming/profiles/7/photo').set('x-user',user)};
}
const ctx={actor:{id:'1',tipo:'CLIENTE'}};
test('upload real normaliza tamanho; leitura privada, substituição e remoção idempotente',async()=>{
 const f=fixture();await f.api('get').expect(404);
 const result=await f.api('put').attach('image',await png(),{filename:'private.png',contentType:'image/png'}).expect(200);
 assert.equal(result.body.data.width,512);assert.equal(result.body.data.height,256);assert.ok(result.body.data.bytes<=262144);
 const read=await f.api('get').expect(200);assert.match(read.headers['content-type'],/image\/webp/);assert.equal(read.headers['cache-control'],'private, no-store');assert.equal(read.headers['x-content-type-options'],'nosniff');
 const meta=await sharp(f.photo().imagem).metadata();assert.equal(meta.format,'webp');assert.equal(meta.exif,undefined);
 await f.api('put').attach('image',await png(),'new.png').expect(200);
 const profiles=createStreamingProfileService({model:{list:async()=>[{id_perfil:'7',nome:'Nome',avatar:'lua',tem_foto:1}]},identity:f.identity});
 assert.equal((await profiles.list(ctx)).items[0].photoUrl,'/api/streaming/profiles/7/photo');
 await f.api('delete').expect(204);await f.api('delete').expect(204);await f.api('get').expect(404);
});
test('outra conta e role não leem ou alteram; anonimato não acessa',async()=>{
 const f=fixture();await request(f.app).get('/api/streaming/profiles/7/photo').expect(401);
 for(const method of ['get','delete'])await f.api(method,'2').expect(404);
 await f.api('put','2').attach('image',await png(),'photo.png').expect(404);
 await f.api('get').set('x-role','ADMIN').expect(403);
 await assert.rejects(f.service.read('7',{actor:{id:'1',tipo:'ADMIN'}}),{statusCode:403});
});
test('rejeita arquivo falso, SVG, campos adicionais e payload excessivo',async()=>{
 const f=fixture();await f.api('put').send({image:'base64'}).expect(415);
 await f.api('put').attach('image',Buffer.from('invalid'),'fake.png').expect(415);
 await f.api('put').attach('image',Buffer.from('<svg/>'),'fake.svg').expect(415);
 await f.api('put').field('ownerId','2').attach('image',await png(),'photo.png').expect(400);
 await f.api('put').attach('image',Buffer.alloc(5*1024*1024+1),'large.png').expect(413);
 assert.equal(f.photo(),null);
});
test('revalida propriedade após processamento e rollback mantém foto anterior',async()=>{
 const f=fixture();await f.service.upload('7',{buffer:await png(),mimetype:'image/png'},ctx);const before=f.photo();f.fail();
 await assert.rejects(f.service.remove('7',ctx),/audit failed/);assert.equal(f.photo(),before);
 await assert.rejects(f.service.upload('7',{buffer:await png(),mimetype:'image/png'},ctx),/audit failed/);assert.equal(f.photo(),before);
 const changed=fixture(async()=>{changed.changeOwner();return {buffer:Buffer.from('x'),width:1,height:1};});
 await assert.rejects(changed.service.upload('7',{},ctx),{statusCode:404});assert.equal(changed.photo(),null);
});
test('limite de concorrência libera vaga uma vez; aborto não persiste',async()=>{
 const f=fixture(),a=f.service.acquire(),b=f.service.acquire();assert.throws(()=>f.service.acquire(),{statusCode:503});a();a();const c=f.service.acquire();assert.throws(()=>f.service.acquire(),{statusCode:503});b();c();
 const abort=new AbortController();abort.abort();await assert.rejects(normalizeProfilePhoto({buffer:await png(),mimetype:'image/png'},abort.signal),{statusCode:408});assert.equal(f.photo(),null);
});
test('SQL valida proprietário, substitui única foto e parametriza bytes',async()=>{
 const calls=[],c={execute:async(sql,args)=>{calls.push({sql,args});return [[]];}},m=createStreamingPhotoModel();await m.own(c,'1','7');await m.put(c,'7',{buffer:Buffer.from('bytes'),width:1,height:1});await m.remove(c,'7');
 assert.match(calls[0].sql,/id_usuario=\? AND id_perfil=\?/);assert.deepEqual(calls[0].args,['1','7']);assert.match(calls[1].sql,/ON DUPLICATE KEY UPDATE/);assert.equal(calls[1].args[1].toString(),'bytes');assert.match(calls[2].sql,/WHERE id_perfil=\?/);
});
