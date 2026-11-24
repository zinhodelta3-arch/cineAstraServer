import { createHmac, timingSafeEqual } from 'node:crypto';
import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';
import { instant } from './identityService.js';
import { cents, money } from './pricingMath.js';

const referencePattern = /^CA-([1-9][0-9]{0,19})-([A-F0-9]{6})-([A-F0-9]{6})-([A-F0-9]{6})-([A-F0-9]{6})$/;
const iso = value => value == null ? null : new Date(instant(value)).toISOString();
const kind = item => item.id_sessao ? 'SESSION' : item.id_insumo ? 'INPUT' : item.id_combo ? 'COMBO' : item.tipo_streaming === 'ALUGUEL' ? 'RENTAL' : 'PURCHASE';
const sourceId = item => idString(item.id_sessao ?? item.id_insumo ?? item.id_combo ?? item.id_filme);

function listPrices(row, items, stored) {
    if (!Array.isArray(stored?.lines) || stored.lines.length !== items.length || stored.total !== row.valor_total) return null;
    let subtotal = 0n;
    for (const [index, line] of stored.lines.entries()) {
        const item = items[index];
        if (!line || line.category !== kind(item) || line.id !== sourceId(item) || line.quantity !== item.quantidade || line.subtotal !== item.subtotal) return null;
        // Meia-entrada já é o tipo de ingresso comprado.
        const original = line.benefit === 'MEIA' ? line.unitPrice : line.base;
        if (typeof original !== 'string' || !/^(0|[1-9][0-9]{0,7})\.[0-9]{2}$/.test(original)) return null;
        subtotal += cents(original) * BigInt(line.quantity);
    }
    const discount = subtotal - cents(row.valor_total);
    if (discount <= 0n) return null;
    try { return { subtotal: money(subtotal), discount: money(discount) }; }
    catch (error) { if (error instanceof RangeError) return null; throw error; }
}

function itemDto(item) {
    return {
        id: idString(item.id_item), kind: kind(item), name: item.item_name, quantity: item.quantidade,
        subtotal: item.subtotal, venue: item.venue ?? null,
        seat: item.fileira == null ? null : `${item.fileira}${String(item.numero).padStart(2, '0')}`,
        admission: item.id_sessao ? item.tipo_ingresso : null,
        session: item.id_sessao ? {
            id: idString(item.id_sessao), status: item.session_status,
            date: item.data, time: item.horario_inicio, room: item.room,
            cinema: item.cinema, city: item.cidade, state: item.estado,
        } : null,
    };
}

export function createPurchaseDocumentService({ model, identity, secret }) {
    const key = createHmac('sha256', secret).update('cineastra/purchase-document/v1').digest();
    const tag = (id, owner) => createHmac('sha256', key).update(`${id}:${owner}`).digest().subarray(0, 12);

    function reference(id, owner) {
        return `CA-${id}-${tag(id, owner).toString('hex').toUpperCase().match(/.{6}/g).join('-')}`;
    }

    async function own(c, id, owner) {
        const row = await model.ownPurchaseDocument(c, id, owner);
        if (!row) throw ApiError.naoEncontrado();
        const items = await model.purchaseDocumentItems(c, id);
        const tickets = await model.purchaseDocumentTickets(c, id);
        const snapshot = typeof row.snapshot === 'string' ? JSON.parse(row.snapshot) : row.snapshot;
        const now = Date.now();
        return {
            orderId: id, reference: reference(id, owner), status: row.status, total: row.valor_total, createdAt: iso(row.data_pedido),
            verifiedAt: new Date(now).toISOString(), coupon: snapshot?.couponCode ?? row.coupon ?? null, discounts: listPrices(row, items, snapshot),
            payment: row.payment_status ? {
                status: row.payment_status, type: row.payment_type, simulated: row.provider === 'simulado', paidAt: iso(row.data_pagamento),
            } : null,
            items: items.map(itemDto),
            tickets: tickets.map(ticket => ({
                id: idString(ticket.id_ticket), itemId: idString(ticket.id_item), type: ticket.tipo,
                status: ticket.status === 'GERADO' && ticket.expira_em && instant(ticket.expira_em) <= now ? 'EXPIRADO' : ticket.status,
                expiresAt: iso(ticket.expira_em),
            })),
        };
    }

    async function actor(c, context) {
        const user = await identity.activeActor(c, context);
        if (user.tipo_usuario !== 'CLIENTE') throw ApiError.acessoNegado();
        return idString(user.id_usuario);
    }

    return {
        document: (id, context) => identity.transaction(async c => own(c, id, await actor(c, context)), context),
        verify: (value, context) => identity.transaction(async c => {
            const owner = await actor(c, context);
            const match = typeof value === 'string' && referencePattern.exec(value);
            if (!match || BigInt(match[1]) > 18446744073709551615n ||
                !timingSafeEqual(tag(match[1], owner), Buffer.from(match.slice(2).join(''), 'hex'))) throw ApiError.naoEncontrado();
            return own(c, match[1], owner);
        }, context),
    };
}
