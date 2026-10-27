import test from 'node:test';
import assert from 'node:assert/strict';
import {registrationErrorMessage} from '../src/lib/auth/registration-errors.mjs';
test('mostra campos inválidos sem ecoar valores ou mensagens desconhecidas',()=>{
 assert.match(registrationErrorMessage({details:[{field:'cpf'}]}),/CPF/);
 assert.match(registrationErrorMessage({message:'Verificação de idade obrigatória'}),/Verificação de idade obrigatória/);
 const result=registrationErrorMessage({message:'segredo',details:[{field:'segredo'},{field:'constructor'}]});
 assert.doesNotMatch(result,/segredo|constructor|expirado/);
 assert.match(result,/cadastro/);
});
