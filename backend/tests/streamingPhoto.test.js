import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import {createStreamingPhotoService} from '../src/services/streamingPhotoService.js';
import {createStreamingPhotoModel} from '../src/models/streamingPhotoModel.js';
import {createStreamingPhotoController} from '../src/controllers/streamingPhotoController.js';
import {streamingPhotoRoutes} from '../src/routes/streamingPhotoRoutes.js';
import {createStreamingProfileService} from '../src/services/streamingProfileService.js';
import {errorMiddleware} from '../src/middlewares/errorMiddleware.js';
import {ApiError} from '../src/utils/ApiError.js';

const path='/api/streaming/profiles/7/photo';
const ctx={actor:{id:'1',tipo:'CLIENTE'}};
const storedPhoto={imagem:Buffer.from('foto-legada')};

function fixture() {
    let photo=storedPhoto;
    let auditFail=false;
    const model={
        own:async(c,user,id)=>user==='1'&&id==='7'?{id_perfil:id}:null,
        get:async()=>photo,
        remove:async()=>{photo=null;}
    };
    const identity={
        activeActor:async(c,context)=>({id_usuario:context.actor.id,tipo_usuario:context.actor.tipo}),
        transaction:async work=>{
            const before=photo;
            try { return await work({}); }
            catch(error) { photo=before; throw error; }
        },
        audit:async()=>{if(auditFail)throw new Error('audit failed');}
    };
    const service=createStreamingPhotoService({model,identity});
    const app=express();
    app.use(streamingPhotoRoutes(createStreamingPhotoController(service),{
        auth(req,res,next){
            if(!req.headers['x-user'])throw ApiError.naoAutorizado();
            req.usuario={id:req.headers['x-user'],tipo:req.headers['x-role']??'CLIENTE'};
            next();
        },
        limits:{upload:[]}
    }));
    app.use(errorMiddleware);
    return {app,service,identity,photo:()=>photo,fail:()=>{auditFail=true;},api:(method,user='1')=>request(app)[method](path).set('x-user',user)};
}

test('envio de foto de terceiros é bloqueado e preserva a foto legada',async()=>{
    const f=fixture();
    const result=await f.api('put').attach('image',Buffer.from('arquivo'),{filename:'perfil.png',contentType:'image/png'}).expect(405);
    assert.equal(result.body.code,'PROFILE_PHOTO_UPLOAD_DISABLED');
    assert.equal(result.headers.allow,'GET, DELETE');
    assert.equal(f.photo(),storedPhoto);
});

test('o perfil lista apenas avatares oficiais, com fallback para valor legado desconhecido',async()=>{
    const f=fixture();
    const service=createStreamingProfileService({model:{list:async()=>[
        {id_perfil:'7',nome:'Lia',avatar:'lua',tem_foto:1},
        {id_perfil:'8',nome:'Caio',avatar:null,tem_foto:1}
    ]},identity:f.identity});
    const {items}=await service.list(ctx);
    assert.deepEqual(items.map(({avatar,photoUrl})=>({avatar,photoUrl})),[
        {avatar:'lua',photoUrl:null},
        {avatar:'astronauta',photoUrl:null}
    ]);
});

test('foto legada pode ser lida e removida de modo idempotente pelo dono',async()=>{
    const f=fixture();
    const response=await f.api('get').expect(200);
    assert.match(response.headers['content-type'],/image\/webp/);
    assert.equal(response.headers['cache-control'],'private, no-store');
    await f.api('delete').expect(204);
    await f.api('delete').expect(204);
    await f.api('get').expect(404);
});

test('conta alheia, perfil administrativo e acesso anônimo não leem nem removem fotos legadas',async()=>{
    const f=fixture();
    for (const method of ['get','delete']) {
        await request(f.app)[method](path).expect(401);
        await f.api(method,'2').expect(404);
        await f.api(method).set('x-role','ADMIN').expect(403);
    }
    assert.equal(f.photo(),storedPhoto);
});

test('falha de auditoria preserva foto legada no rollback',async()=>{
    const f=fixture();
    f.fail();
    await assert.rejects(f.service.remove('7',ctx),/audit failed/);
    assert.equal(f.photo(),storedPhoto);
});

test('modelo parametriza propriedade, leitura e remoção',async()=>{
    const calls=[];
    const c={execute:async(sql,args)=>{calls.push({sql,args});return [[]];}};
    const model=createStreamingPhotoModel();
    await model.own(c,'1','7');await model.get(c,'7');await model.remove(c,'7');
    assert.match(calls[0].sql,/id_usuario=\? AND id_perfil=\?/);
    assert.deepEqual(calls.map(call=>call.args),[['1','7'],['7'],['7']]);
});
