import test from 'node:test';
import assert from 'node:assert/strict';
import {notificationId,notificationItem} from '../src/lib/api/notifications.mjs';
test('notification IDs preserve bigint precision and reject route injection',()=>{
 assert.ok(notificationId('18446744073709551615'));
 for(const id of ['18446744073709551616','0','../users',1])assert.equal(notificationId(id),false);
});
test('maps actual content and read state without fabricated order fields',()=>{
 const item=notificationItem({id_notificacao:'1',titulo:'Resposta',mensagem:'Mensagem real',tipo:'SUPPORT_REPLY',lida:true,data_envio:'2026-10-29 12:00:00'});
 assert.equal(item.createdAt,'2026-10-29T12:00:00.000Z');assert.equal(item.type,'support');assert.equal(item.read,true);
 assert.equal(item.details,'Mensagem real');assert.equal(item.fields.some(f=>f.label==='Pedido'),false);
});
test('unknown notification type and invalid dates remain safe',()=>{
 const item=notificationItem({id_notificacao:'1',titulo:'Aviso',tipo:'NEW_EVENT',lida:false,data_envio:'invalid'});
 assert.equal(item.type,'notice');assert.equal(item.createdAt,null);assert.equal(item.read,false);
});
test('abre somente detalhes de solicitações com identificador válido, inclusive quando lidas', () => {
 const row = { tipo: 'EXPERIENCE_REQUEST_CREATED', solicitacao_experiencia_id: '42' };
 assert.equal(notificationItem({ ...row, lida: true }).href, '/cinema/experiencias/solicitacoes?pedido=42');
 for (const invalid of ['42&next=/admin', '4294967296', '0']) {
  assert.equal(notificationItem({ ...row, solicitacao_experiencia_id: invalid }).href, null);
 }
 assert.equal(notificationItem({ ...row, tipo: 'SUPPORT_REPLY' }).href, null);
});
