import test from 'node:test';
import assert from 'node:assert/strict';
import {filmCard,safeLink,publicAsset,publicGet} from '../src/lib/api/public-api.mjs';
test('adapta filme real sem inventar preço, nota ou sessões',()=>{
 const film=filmCard({id_filme:'29',titulo:'Filme',descricao:null,duracao:110,classificacao:'L',data_lancamento:'2027-01-01',imagem:null,trailer:'javascript:alert(1)'});
 assert.equal(film.id,'29');assert.equal(film.age,'Livre');assert.equal(film.duration,'110 min');assert.equal(film.releaseDate,'2027-01-01');assert.equal(film.poster,null);assert.equal(film.trailerUrl,null);assert.deepEqual(film.sessions,[]);assert.equal(film.price,undefined);
});
test('URLs editoriais não aceitam scripts, credenciais ou caminhos externos disfarçados',()=>{
 for(const url of ['javascript:alert(1)','//example.com','/\\example.com','https://u:p@example.com'])assert.equal(safeLink(url),null);
 assert.equal(safeLink('/cinema/filmes'),'/cinema/filmes');assert.equal(safeLink('https://example.com/a'),'https://example.com/a');assert.equal(publicAsset('data:text/html,bad'),null);
});
test('cliente trata erro HTTP e envelope inválido; consulta pública não envia credenciais',async t=>{
 t.mock.method(globalThis,'fetch',async(url,options)=>{assert.equal(options.credentials,'omit');assert.equal(options.cache,'no-store');return {ok:true,json:async()=>({success:true,data:{items:[],pagination:{nextCursor:null}}})};});
 assert.deepEqual((await publicGet('/films')).items,[]);
 globalThis.fetch=async()=>({ok:false});await assert.rejects(publicGet('/films'),/Não foi possível/);
 globalThis.fetch=async()=>({ok:true,json:async()=>({success:false})});await assert.rejects(publicGet('/films'),/Não foi possível/);
});
