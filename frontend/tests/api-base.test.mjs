import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveApiBase,DEFAULT_API_URL} from '../src/lib/api/api-base.mjs';
test('usa o backend CineAstra por padrão e inclui /api no domínio raiz',()=>{
 assert.equal(resolveApiBase(undefined),DEFAULT_API_URL);
 assert.equal(resolveApiBase(''),DEFAULT_API_URL);
 assert.equal(resolveApiBase('http://backend.cineastra.10.189.87.231.sslip.io/'),DEFAULT_API_URL);
 assert.equal(resolveApiBase(DEFAULT_API_URL+'/'),DEFAULT_API_URL);
 assert.equal(resolveApiBase('http://localhost:8080'), 'http://localhost:8080/api');
 assert.equal(resolveApiBase('http://backend:8080/api'), 'http://backend:8080/api');
 assert.equal(resolveApiBase('/api'), '/api');
});
