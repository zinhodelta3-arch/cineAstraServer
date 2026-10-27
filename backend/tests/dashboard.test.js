import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import {createDashboardService} from '../src/services/dashboardService.js';
import {createDashboardModel} from '../src/models/dashboardModel.js';
import {createDashboardController} from '../src/controllers/dashboardController.js';
import {dashboardRoutes} from '../src/routes/dashboardRoutes.js';
import {dashboardQuery} from '../src/validators/dashboardValidators.js';
import {ApiError} from '../src/utils/ApiError.js';
import {errorMiddleware} from '../src/middlewares/errorMiddleware.js';
const q={from:'2026-10-01',to:'2026-10-03',localId:'2'};
function fixture(role='ADMIN'){
 let calls=0;
 const total={session_count:'3',completed_sessions:'1',capacity:'200',occupied:'50'};
 const model={daily:async(c,filter,start,end)=>{calls++;assert.equal(start,'2026-10-01 00:00:00');assert.equal(end,'2026-10-04 00:00:00');return [{day:'2026-10-02',tickets:'3',revenue:'30.03'}];},types:async()=>[{type:'INTEIRA',tickets:'2'},{type:'MEIA',tickets:'1'}],movies:async()=>[{id:'4',title:'Filme',tickets:'3',revenue:'30.03'}],occupancy:async()=>total,rooms:async()=>[{id:'1',local_id:'2',name:'Sala',...total}]};
 const identity={transaction:fn=>fn({}),activeActor:async()=>({tipo_usuario:role})};
 const service=createDashboardService({model,identity}),app=express();app.use((req,res,next)=>{res.locals.requestId='test';next();});app.use(dashboardRoutes(createDashboardController(service),{auth:(req,res,next)=>{if(!req.headers['x-role'])throw ApiError.naoAutorizado();req.usuario={tipo:req.headers['x-role']};next();}}));app.use(errorMiddleware);
 return {service,model,app,calls:()=>calls};
}
test('datas vazias são preenchidas; moeda exata, tipos reais e ocupação ponderada',async()=>{
 const f=fixture(),r=await f.service.get(q,{});
 assert.deepEqual(r.sales,{tickets:'3',ticketSalesValue:'30.03'});
 assert.deepEqual(r.daily.map(x=>x.tickets),['0','3','0']);assert.equal(r.daily[0].ticketSalesValue,'0.00');
 assert.equal(r.occupancy.occupancyPercent,25);assert.equal(r.occupancy.completedSessions,'1');
 assert.equal(r.ticketTypes[0].sharePercent,66.67);assert.equal(r.ticketTypes[1].sharePercent,33.33);assert.equal(r.topMovies[0].ticketSalesValue,'30.03');
 assert.equal(JSON.stringify(r).includes('PROMOCIONAL'),false);
});
test('sem dados retorna zeros e percentuais nulos; limita salas sem perder total global',async()=>{
 const f=fixture();f.model.daily=async()=>[];f.model.types=async()=>[];f.model.movies=async()=>[];f.model.occupancy=async()=>({});f.model.rooms=async()=>[];
 const r=await f.service.get(q,{});assert.equal(r.sales.tickets,'0');assert.equal(r.occupancy.occupancyPercent,null);assert.equal(r.ticketTypes[0].sharePercent,null);assert.equal(r.topMovies.length,0);
 f.model.rooms=async()=>Array.from({length:101},(_,i)=>({id:String(i+1),local_id:'2',name:'Sala'}));
 const limited=await f.service.get(q,{});assert.equal(limited.rooms.length,100);assert.equal(limited.roomsTruncated,true);
});
test('ADMIN exigido no HTTP e no serviço; filtros estritos e até 93 dias',async()=>{
 const f=fixture(),path='/api/admin/reports/dashboard';
 await request(f.app).get(path).query(q).expect(401);await request(f.app).get(path).set('x-role','CLIENTE').query(q).expect(403);
 const r=await request(f.app).get(path).set('x-role','ADMIN').query(q).expect(200);assert.equal(r.headers['cache-control'],'no-store');
 const denied=fixture('CLIENTE');await assert.rejects(denied.service.get(q,{}),{statusCode:403});assert.equal(denied.calls(),0);
 for(const bad of [{...q,to:'2026-02-30'},{...q,to:'2026-09-30'},{...q,scope:'ALL'},{...q,localId:'4294967296'},{...q,from:['2026-10-01','2026-10-02']}])assert.equal(dashboardQuery.safeParse(bad).success,false);
 assert.equal(dashboardQuery.safeParse({from:'2026-01-01',to:'2026-04-03'}).success,true);
 assert.equal(dashboardQuery.safeParse({from:'2026-01-01',to:'2026-04-04'}).success,false);
});
test('SQL conta cada venda uma vez; ocupação usa confirmadas e separa a data de sessão',async()=>{
 const calls=[],c={execute:async(sql,args)=>{calls.push({sql,args});return [[{}]];}},m=createDashboardModel();
 for(const action of ['daily','types','movies','occupancy','rooms'])await m[action](c,q,'start','end');
 for(const x of calls){assert.deepEqual(x.args,['start','end','2']);assert.match(x.sql,/sa.id_local=\?/);}
 for(const x of calls.slice(0,3)){assert.match(x.sql,/MIN\(data_pagamento\)/);assert.match(x.sql,/GROUP BY id_pedido/);assert.match(x.sql,/p.first_paid>=\?/);assert.doesNotMatch(x.sql,/JOIN tickets|JOIN reembolso/);}
 for(const x of calls.slice(3)){assert.match(x.sql,/estado='CONFIRMADA'/);assert.match(x.sql,/s.data>=\?/);assert.match(x.sql,/s.status<>'CANCELADA'/);}
 assert.match(calls[2].sql,/LIMIT 10/);assert.match(calls[4].sql,/LIMIT 101/);
});
test('valores grandes não perdem centavos na soma',async()=>{
 const f=fixture();f.model.daily=async()=>[{day:'2026-10-01',tickets:'9007199254740993',revenue:'9007199254740993.01'},{day:'2026-10-02',tickets:'1',revenue:'0.02'}];
 const r=await f.service.get(q,{});assert.deepEqual(r.sales,{tickets:'9007199254740994',ticketSalesValue:'9007199254740993.03'});
});
