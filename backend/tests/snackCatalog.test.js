import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import {createSnackCatalogModel} from '../src/models/snackCatalogModel.js';
import {createSnackCatalogService} from '../src/services/snackCatalogService.js';
import {createSnackCatalogController} from '../src/controllers/snackCatalogController.js';
import {snackCatalogRoutes} from '../src/routes/snackCatalogRoutes.js';
import {errorMiddleware} from '../src/middlewares/errorMiddleware.js';
function fixture(){
 let reads=0;
 const rows=[{id_insumo:'1',id_local:'2',nome:'Pipoca',descricao:'Porção',categoria:'Comida',preco:'12.50',em_estoque:1,imagem:'/api/input-images/example',quantidade:10,custo_receita:'1.00',id_fornecedor:'secret'},{id_insumo:'2',id_local:'2',nome:'Refrigerante',categoria:'Bebida',preco:'7.00',em_estoque:0}];
 const model={list:async(local,q)=>{reads++;return rows.filter(r=>r.id_local===local&&(!q.cursor||BigInt(r.id_insumo)>BigInt(q.cursor))&&(!q.category||r.categoria===q.category)&&(!q.q||r.nome.toLowerCase().includes(q.q.toLowerCase()))&&(q.inStock===undefined||Boolean(r.em_estoque)===q.inStock)).slice(0,q.limit+1);},get:async(local,id)=>{reads++;return rows.find(r=>r.id_local===local&&r.id_insumo===id);}};
 const app=express();app.use(snackCatalogRoutes(createSnackCatalogController(createSnackCatalogService({model}))));app.use(errorMiddleware);
 return {app,reads:()=>reads,api:path=>request(app).get('/api/locations/'+path)};
}
test('catálogo público paginado, filtros e DTO sem informações internas',async()=>{
 const f=fixture(),first=await f.api('2/snacks?limit=1').expect(200);assert.equal(first.headers['cache-control'],'no-store');
 assert.deepEqual(first.body.data.items[0],{id:'1',localId:'2',name:'Pipoca',description:'Porção',category:'Comida',publishedPrice:'12.50',currency:'BRL',inStock:true,imageUrl:'/api/input-images/example',purchaseKind:'INPUT'});assert.equal(first.body.data.pagination.nextCursor,'1');
 const last=await f.api('2/snacks?limit=1&cursor=1').expect(200);assert.equal(last.body.data.items[0].inStock,false);assert.equal(last.body.data.items[0].imageUrl,null);assert.equal(last.body.data.pagination.nextCursor,null);
 assert.deepEqual((await f.api('2/snacks?category=Comida&q=pip&inStock=true')).body.data.items.map(x=>x.id),['1']);
 assert.deepEqual((await f.api('2/snacks?inStock=false')).body.data.items.map(x=>x.id),['2']);
 const detail=await f.api('2/snacks/1').expect(200);assert.deepEqual(detail.body.data,first.body.data.items[0]);
 await f.api('3/snacks/1').expect(404);await f.api('2/snacks/99').expect(404);assert.deepEqual((await f.api('3/snacks')).body.data.items,[]);
});
test('valida identificadores, limite, filtros e parâmetros repetidos',async()=>{
 const f=fixture();for(const q of ['limit=0','limit=101','cursor=abc','cursor=4294967296','q=','category=','inStock=0','inStock=true&inStock=false','supplierId=1','status=INDISPONIVEL'])await f.api('2/snacks?'+q).expect(422);
 for(const path of ['abc/snacks','0/snacks','4294967296/snacks','2/snacks/abc'])await f.api(path).expect(422);assert.equal(f.reads(),0);
});
test('SQL aplica visibilidade em lista e detalhe, considera reservas e usa projeção pública',async()=>{
 const calls=[],db={execute:async(sql,args)=>{calls.push({sql,args});return [[]];}},model=createSnackCatalogModel(db);
 await model.list('2',{limit:2,cursor:'1',q:'50%_!',category:'Bebida',inStock:true});await model.get('2','1');
 assert.deepEqual(calls[0].args,['2','1','Bebida','%50!%!_!!%',1,3]);assert.deepEqual(calls[1].args,['2','1']);
 for(const {sql} of calls){for(const filter of ["i.venda_avulsa=TRUE","i.status='DISPONIVEL'","l.status='ATIVO'","f.status='ATIVO'","u.status='ATIVO'","u.tipo_usuario='FORNECEDOR'","fl.status='ATIVO'",'i.id_local=?','i.quantidade-i.quantidade_reservada>0'])assert.ok(sql.includes(filter));assert.doesNotMatch(sql,/custo_|quantidade_minima|senha|cpf|email/);}
 assert.match(calls[0].sql,/ORDER BY i.id_insumo LIMIT \?/);assert.match(calls[1].sql,/AND i.id_insumo=\?/);
});
