import test from 'node:test';
import assert from 'node:assert/strict';
import { createPurchaseDocumentService } from '../src/services/purchaseDocumentService.js';

test('comprovante vincula a referência ao titular e consulta o estado atual sem códigos de uso', async () => {
    const orderId = '18446744073709551615';
    const row = { status: 'PAGO', valor_total: '18.00', data_pedido: '2026-11-22 20:42:00', payment_status: 'APROVADO', payment_type: 'PIX', provider: 'simulado', data_pagamento: '2026-11-22 20:43:00' };
    const ticket = { id_ticket: '12', id_item: '9', tipo: 'RETIRADA_INSUMO', status: 'GERADO', expira_em: '2020-01-01 00:00:00', codigo: 'reservado' };
    const model = {
        ownPurchaseDocument: async (c, id, owner) => id === orderId && owner === '7' ? row : null,
        purchaseDocumentItems: async () => [{ id_item: '9', id_insumo: '28', item_name: 'Pipoca salgada', quantidade: 1, subtotal: '18.00' }],
        purchaseDocumentTickets: async () => [ticket],
    };
    const identity = { transaction: async work => work({}), activeActor: async (c, context) => context.actor };
    const service = createPurchaseDocumentService({ model, identity, secret: 'segredo-isolado-da-fixture' });
    const owner = { actor: { id_usuario: '7', tipo_usuario: 'CLIENTE' } };
    const other = { actor: { id_usuario: '8', tipo_usuario: 'CLIENTE' } };
    const original = await service.document(orderId, owner);
    assert.equal(original.orderId, orderId);
    assert.equal(original.tickets[0].status, 'EXPIRADO');
    assert.equal(Object.hasOwn(original.tickets[0], 'code'), false);
    assert.equal(Object.hasOwn(original.tickets[0], 'codigo'), false);
    await assert.rejects(service.document(orderId, other), { statusCode: 404 });
    await assert.rejects(service.verify(original.reference, other), { statusCode: 404 });
    await assert.rejects(service.verify(original.reference + '0', owner), { statusCode: 404 });
    row.payment_status = 'PARCIALMENTE_ESTORNADO';
    ticket.status = 'UTILIZADO';
    const verified = await service.verify(original.reference, owner);
    assert.equal(verified.reference, original.reference);
    assert.equal(verified.payment.status, 'PARCIALMENTE_ESTORNADO');
    assert.equal(verified.tickets[0].status, 'UTILIZADO');
});
