import test from 'node:test';
import assert from 'node:assert/strict';
import {sessionCookieOptions} from '../src/lib/auth/session-cookie.mjs';
test('sessão funciona em HTTP e mantém Secure no HTTPS, inclusive atrás do proxy',()=>{
 const request=(url,headers={})=>new Request(url,{headers});
 assert.deepEqual(sessionCookieOptions(request('http://cinema.example.com'),''),{httpOnly:true,secure:false,sameSite:'lax',path:'/'});
 assert.equal(sessionCookieOptions(request('https://cinema.example.com'),'').secure,true);
 assert.equal(sessionCookieOptions(request('http://localhost:3000',{'x-forwarded-proto':'https'}),'').secure,true);
 assert.equal(sessionCookieOptions(request('http://localhost:3000'),'https://cinema.example.com').secure,true);
});
