import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import {createOrderModel} from '../src/models/orderModel.js';
import {createOrderService} from '../src/services/orderService.js';
import {createOrderController} from '../src/controllers/orderController.js';
import {orderRoutes} from '../src/routes/orderRoutes.js';
import {errorMiddleware} from '../src/middlewares/errorMiddleware.js';
import {ApiError} from '../src/utils/ApiError.js';
const row=(id,owner='1')=>({id_pedido:id,owner,status:'PAGO',valor_total:'25.00',data_pedido:'2026-10-25 12:00:00',checkout_key:'secret'});
function fixture(rows=[]){
    let reads=0;
    const model={async listOwn(c,owner,limit,cursor){reads++;return rows.filter(r=>r.owner===owner&&(!cursor||BigInt(r.id_pedido)<BigInt(cursor))).sort((a,b)=>BigInt(a.id_pedido)>BigInt(b.id_pedido)?-1:1).slice(0,limit+1);}};
    const identity={transaction:async fn=>fn({}),activeActor:async(c,ctx)=>({id_usuario:ctx.actor.id,tipo_usuario:ctx.actor.tipo})};
    const service=createOrderService({model,identity}),app=express();
    const auth=(req,res,next)=>{if(!req.get('x-user'))throw ApiError.naoAutorizado();req.usuario={id:req.get('x-user'),tipo:req.get('x-role')||'CLIENTE'};next();};
    app.use(orderRoutes(createOrderController(service),{auth,limits:{checkout:[]}}));app.use(errorMiddleware);
    return {app,service,reads:()=>reads};
}
test('listagem isola proprietário e pagina IDs grandes sem expor campos internos',async()=>{
    const {app}=fixture([row('9007199254740995'),row('9007199254740994','2'),row('9007199254740993'),row('8')]);
    const first=await request(app).get('/api/orders?limit=2').set('x-user','1').expect(200);
    assert.deepEqual(first.body.data.items.map(x=>x.orderId),['9007199254740995','9007199254740993']);
    assert.deepEqual(first.body.data.items[0],{orderId:'9007199254740995',financialStatus:'PAGO',total:'25.00',currency:'BRL',createdAt:'2026-10-25T12:00:00.000Z'});
    assert.equal(first.body.data.pagination.nextCursor,'9007199254740993');
    const second=await request(app).get('/api/orders?limit=2&cursor='+first.body.data.pagination.nextCursor).set('x-user','1').expect(200);
    assert.deepEqual(second.body.data.items.map(x=>x.orderId),['8']);assert.equal(second.body.data.pagination.nextCursor,null);
    const other=await request(app).get('/api/orders').set('x-user','2').expect(200);
    assert.deepEqual(other.body.data.items.map(x=>x.orderId),['9007199254740994']);assert.equal(first.headers['cache-control'],'no-store');
});
test('lista vazia, limite padrão e data legada nula',async()=>{
    const {app}=fixture([{...row('1'),data_pedido:null}]);
    const empty=await request(app).get('/api/orders').set('x-user','9').expect(200);
    assert.deepEqual(empty.body.data,{items:[],pagination:{limit:20,nextCursor:null}});
    const own=await request(app).get('/api/orders?limit=100').set('x-user','1').expect(200);
    assert.equal(own.body.data.items[0].createdAt,null);assert.equal(own.body.data.pagination.nextCursor,null);
});
test('rejeita acesso sem autenticação e papéis não CLIENTE sem consultar pedidos',async()=>{
    const f=fixture();await request(f.app).get('/api/orders').expect(401);
    for(const role of ['ADMIN','FORNECEDOR','COLABORADOR'])await request(f.app).get('/api/orders').set('x-user','1').set('x-role',role).expect(403);
    await assert.rejects(f.service.list({limit:20},{actor:{id:'1',tipo:'ADMIN'}}),{statusCode:403});assert.equal(f.reads(),0);
});
test('rejeita query inválida e tentativa de escolher dono',async()=>{
    const f=fixture();
    for(const q of ['limit=0','limit=101','limit=-1','limit=1.5','limit=abc','limit=','limit=2&limit=3','cursor=0','cursor=-1','cursor=18446744073709551616','cursor=1&cursor=2','cursor=1%20OR%201=1','ownerId=2','userId=2'])await request(f.app).get('/api/orders?'+q).set('x-user','1').expect(422);
    assert.equal(f.reads(),0);
});
test('SQL usa proprietário e cursor parametrizados, ordem estável e uma linha extra',async()=>{
    const calls=[],c={execute:async(sql,args)=>{calls.push({sql,args});return [[]];}},model=createOrderModel();
    await model.listOwn(c,'17',20);await model.listOwn(c,'18',2,'9007199254740995');
    assert.match(calls[0].sql,/WHERE id_usuario=\?/);assert.match(calls[0].sql,/ORDER BY id_pedido DESC LIMIT \?/);assert.deepEqual(calls[0].args,['17',21]);
    assert.match(calls[1].sql,/id_usuario=\? AND id_pedido<\?/);assert.deepEqual(calls[1].args,['18','9007199254740995',3]);
});
