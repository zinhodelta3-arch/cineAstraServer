import test from 'node:test';
import assert from 'node:assert/strict';
import {cinemaMovie,cinemaCatalogPath} from '../src/lib/api/cinema-movies.mjs';
test('classifica estreia sem inventar pré-venda, sessões ou gêneros',()=>{
 const film={id_filme:'42',titulo:'Filme real',classificacao:'L',duracao:100,data_lancamento:'2026-10-28'};
 assert.equal(cinemaMovie(film,'2026-10-27').status,'em-breve');
 assert.equal(cinemaMovie(film,'2026-10-28').status,'em-cartaz');
 assert.deepEqual(cinemaMovie(film).sessions,[]);
 assert.equal(cinemaMovie({...film,data_lancamento:null}).status,'em-cartaz');
 assert.equal(cinemaMovie({...film,trailer:'javascript:alert(1)'}).trailer,null);
});
test('busca e gênero são enviados ao servidor sem parâmetros não suportados',()=>{
 const url=new URL(cinemaCatalogPath(' Ação & luz ','7'),'http://localhost');
 assert.equal(url.searchParams.get('titulo'),'Ação & luz');assert.equal(url.searchParams.get('genreId'),'7');assert.equal(url.searchParams.get('cinema'),'true');
 assert.equal(new URL(cinemaCatalogPath('','Todos'),'http://localhost').searchParams.has('genreId'),false);
});
