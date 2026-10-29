import test from 'node:test';
import assert from 'node:assert/strict';
import {validateExperienceInquiry as validate} from '../src/lib/api/experience-inquiry.mjs';
const valid={experienceId:'1',date:'2099-01-01',guests:30,details:'Evento para a nossa equipe.'};
test('valida data civil real, limites e descrição antes de abrir chamado',()=>{
 assert.deepEqual(validate(valid),valid);
 for(const change of [{date:'2099-02-30'},{date:'2020-01-01'},{experienceId:'4294967296'},{guests:0},{guests:1.5},{guests:100001},{details:'curto'},{details:'x'.repeat(4001)}])assert.equal(validate({...valid,...change}),null);
 assert.equal(validate(null),null);assert.equal(validate([]),null);
});
