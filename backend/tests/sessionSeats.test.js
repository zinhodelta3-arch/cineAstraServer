import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import {createSessionModel} from '../src/models/sessionModel.js';
import {createSessionService} from '../src/services/sessionService.js';
import {createSessionController} from '../src/controllers/sessionController.js';
import {sessionRoutes} from '../src/routes/sessionRoutes.js';
import {errorMiddleware} from '../src/middlewares/errorMiddleware.js';

function fixture(rows){
    let calls=0;
    const service=createSessionService({model:{seatAvailability:async id=>{calls++;assert.equal(id,'1');return rows;}}});
    const app=express();
    app.use(sessionRoutes(createSessionController(service),{auth(){throw new Error('Public endpoint must not require auth');}}));
    app.use(errorMiddleware);
    return {app,calls:()=>calls};
}
const base={id_sessao:'1',id_sala:'2',id_local:'3'};
test('consulta pública retorna mapa com tipos e estados sem dados do comprador',async()=>{
    const states=['DISPONIVEL','RESERVADO','VENDIDO','INDISPONIVEL'];
    const rows=states.map((state,i)=>({...base,id_assento:String(i+1),fileira:'A',numero:i+1,tipo:i===1?'PCD':'COMUM',disponibilidade:state,id_usuario:'secret',id_pedido:'private',expira_em:'private'}));
    const f=fixture(rows),res=await request(f.app).get('/api/sessions/1/seats').expect(200);
    assert.equal(res.headers['cache-control'],'no-store');
    assert.deepEqual(res.body.data,{sessionId:'1',roomId:'2',locationId:'3',seats:states.map((state,i)=>({seatId:String(i+1),row:'A',number:i+1,type:i===1?'PCD':'COMUM',availability:state}))});
});
test('sala sem assentos retorna mapa vazio; sessão não pública/inexistente retorna 404',async()=>{
    const empty=fixture([{...base,id_assento:null}]);
    const res=await request(empty.app).get('/api/sessions/1/seats').expect(200);assert.deepEqual(res.body.data.seats,[]);
    await request(fixture([]).app).get('/api/sessions/1/seats').expect(404);
});
test('IDs inválidos não atingem model nem provocam erro interno',async()=>{
    const f=fixture([]);
    for(const id of ['abc','0','-1','1.5','4294967296','1%20OR%201=1'])await request(f.app).get(`/api/sessions/${id}/seats`).expect(422);
    assert.equal(f.calls(),0);
});
test('model consulta sala e ocupação da sessão em uma leitura sem escrita nem dados pessoais',async()=>{
    const calls=[],db={execute:async(sql,args)=>{calls.push({sql,args});return [[]];}};
    await createSessionModel(db).seatAvailability('17');
    assert.equal(calls.length,1);assert.deepEqual(calls[0].args,['17']);
    const sql=calls[0].sql;
    assert.match(sql,/a.id_sala=s.id_sala/);assert.match(sql,/o.id_sessao=s.id_sessao AND o.id_assento=a.id_assento/);
    assert.match(sql,/o.estado='RESERVADA' AND o.expira_em>UTC_TIMESTAMP\(3\)/);
    assert.match(sql,/o.estado='CONFIRMADA' THEN 'VENDIDO'/);
    assert.match(sql,/a.status IS NULL OR a.status<>'ATIVA'/);
    for(const condition of ["s.status IN ('AGENDADA','EM_CARTAZ')","sa.status='ATIVA'","l.status='ATIVO'","f.status='ATIVO'",'f.disponivel_cinema=TRUE'])assert.ok(sql.includes(condition));
    assert.doesNotMatch(sql,/id_usuario|id_pedido|id_ticket|FOR UPDATE|DELETE|INSERT|UPDATE /);
});
