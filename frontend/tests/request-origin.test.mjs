import test from 'node:test';
import assert from 'node:assert/strict';
import {isAllowedAuthOrigin} from '../src/lib/auth/request-origin.mjs';
const request = (headers) => new Request('http://localhost:3000/api/session/register', {headers});
test('permite acesso local e domínio público atrás do Coolify', () => {
 assert.equal(isAllowedAuthOrigin(request({origin:'http://localhost:3000'}), ''), true);
 assert.equal(isAllowedAuthOrigin(request({origin:'https://cinema.example.com',host:'cinema.example.com','x-forwarded-proto':'https'}), ''), true);
 assert.equal(isAllowedAuthOrigin(request({origin:'http://cinema.example.com',host:'cinema.example.com','x-forwarded-proto':'http'}), ''), true);
});
test('rejeita origem ausente, externa, protocolo diferente e headers ambíguos', () => {
 for (const origin of ['', 'null', 'https://evil.example', 'http://cinema.example.com', 'https://cinema.example.com/path']) {
  assert.equal(isAllowedAuthOrigin(request({origin,host:'cinema.example.com','x-forwarded-proto':'https'}), ''), false);
 }
 assert.equal(isAllowedAuthOrigin(request({origin:'https://evil.example',host:'cinema.example.com','x-forwarded-host':'evil.example','x-forwarded-proto':'https'}), ''), false);
 assert.equal(isAllowedAuthOrigin(request({origin:'https://cinema.example.com',host:'cinema.example.com','x-forwarded-proto':'https,http'}), ''), false);
});
test('origem configurada é exclusiva mesmo se o proxy reescrever Host', () => {
 assert.equal(isAllowedAuthOrigin(request({origin:'https://cinema.example.com',host:'internal:3000'}), 'https://cinema.example.com'), true);
 assert.equal(isAllowedAuthOrigin(request({origin:'https://evil.example',host:'evil.example'}), 'https://cinema.example.com'), false);
 assert.equal(isAllowedAuthOrigin(request({origin:'http://localhost:3000'}), 'invalid'), false);
});
