import test from 'node:test';
import assert from 'node:assert/strict';
import {cinemaLocation} from '../src/lib/api/cinema-locations.mjs';
test('endereço real inclui cidade/estado e preserva ID sem inventar foto/horários',()=>{
 const loc=cinemaLocation({id_local:'4294967295',nome:'Cinema',logradouro:'Rua A',numero:'10',bairro:'Centro',cidade:'Recife',estado:'PE',cep:'50000000'});
 assert.equal(loc.id,'4294967295');assert.equal(loc.street,'Rua A, 10');assert.match(loc.fullAddress,/Recife · PE/);assert.match(loc.fullAddress,/CEP 50000000/);assert.equal(loc.hours,undefined);assert.equal(loc.image,undefined);
});
test('endereço incompleto não exibe null/undefined nem cria localização fictícia',()=>{
 const loc=cinemaLocation({id_local:'1',nome:'Cinema'});assert.equal(loc.fullAddress,'');assert.equal(loc.street,'Endereço não informado');
});
