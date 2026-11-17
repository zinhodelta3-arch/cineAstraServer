import { createHash } from 'node:crypto';
import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';
import { interval } from './sessionService.js';

const conflict = message => new ApiError(message, 409, null, 'COUNTER_ORDER_CONFLICT');
const select = async (c, sql, args) => (await c.execute(sql, args))[0];
const first = async (c, sql, args) => (await select(c, sql, args))[0];

export function createCounterOrderService({ identity, ticketModel, orderModel, sessionModel, salesModel, orders, checkout, payment }) {
    async function scopedSession(c, sessionId, context) {
        const actor = await identity.activeActor(c, context);
        if (actor.tipo_usuario !== 'COLABORADOR') throw ApiError.acessoNegado();
        const session = await orderModel.session(c, sessionId);
        if (!session) throw ApiError.naoEncontrado();
        if (!await ticketModel.staffScope(c, actor.id_usuario, actor.tipo_usuario, sessionId, session.id_local)) throw ApiError.acessoNegado();
        return { actor, session };
    }
    function ensureSellable(session) {
        if (!['AGENDADA', 'EM_CARTAZ'].includes(session.status) || session.local_status !== 'ATIVO' ||
            session.sala_status !== 'ATIVA' || session.filme_status !== 'ATIVO' ||
            !session.disponivel_cinema || interval(session).end <= Date.now()) throw conflict('Sessão indisponível para venda');
    }
    function cart(sessionId, session, lines) {
        if (lines.reduce((n, line) => n + line.quantity, 0) > 500) throw ApiError.validacao('Quantidade total excede o limite do pedido');
        if (lines.some(line => line.kind === 'SESSION' && line.id !== sessionId)) throw conflict('Ingresso de outra sessão');
        return { localId: idString(session.id_local), lines: lines.map(line => line.kind === 'COMBO' ? { ...line, sessionId } : line) };
    }
    async function catalog(sessionId, context) {
        return identity.transaction(async c => {
            const { session } = await scopedSession(c, sessionId, context);
            ensureSellable(session);
            const seats = (await sessionModel.seatAvailability(sessionId, c)).filter(row => row.disponibilidade === 'DISPONIVEL');
            const snacks = await select(c, `SELECT id_insumo AS id, nome, 'INPUT' AS kind FROM insumos
                WHERE id_local=? AND venda_avulsa=TRUE AND status='DISPONIVEL' AND quantidade>quantidade_reservada
                UNION ALL SELECT id_combo AS id, nome, 'COMBO' AS kind FROM combos
                WHERE id_local=? AND ativo=TRUE AND (id_sessao_evento IS NULL OR id_sessao_evento=?) ORDER BY nome,id`,
                [session.id_local, session.id_local, sessionId]);
            return {
                classification: session.classificacao,
                seats: seats.map(row => ({ id: idString(row.id_assento), label: `${row.fileira}${row.numero}` })),
                snacks: snacks.map(row => ({ id: idString(row.id), name: row.nome, kind: row.kind })),
            };
        }, context);
    }
    async function quote(sessionId, input, context) {
        return identity.transaction(async c => {
            const { session } = await scopedSession(c, sessionId, context);
            ensureSellable(session);
            return orders.quoteOnConnection(c, cart(sessionId, session, input.lines), context,
                { counter: true, ageConfirmed: input.ageConfirmed });
        }, context);
    }
    async function sell(sessionId, input, key, context) {
        const hash = createHash('sha256').update(JSON.stringify({ sessionId, input })).digest('hex');
        return identity.transaction(async c => {
            const { actor, session } = await scopedSession(c, sessionId, context);
            const previous = await first(c, `SELECT x.id_pedido,x.hash_pedido,x.canal,p.status,p.valor_total
                FROM pedidos_presenciais x JOIN pedidos p ON p.id_pedido=x.id_pedido
                WHERE x.id_operador=? AND x.chave=? FOR UPDATE`, [actor.id_usuario, key]);
            if (previous) {
                if (previous.hash_pedido !== hash) throw conflict('Chave reutilizada com outro pedido');
                return result(c, previous.id_pedido, previous.canal, previous.status, previous.valor_total);
            }
            ensureSellable(session);
            const orderInput = cart(sessionId, session, input.lines);
            let orderId;
            let total = null;
            let status = 'EM_ANDAMENTO';
            if (input.channel === 'APP') {
                const customer = await first(c, `SELECT id_usuario FROM usuarios
                    WHERE email=? AND tipo_usuario='CLIENTE' AND status='ATIVO' FOR UPDATE`, [input.customerEmail]);
                if (!customer) throw new ApiError('Cliente cadastrado não encontrado',404,null,'COUNTER_CUSTOMER_NOT_FOUND');
                // A elegibilidade etária da conta é aplicada no checkout do cliente.
                const price = await orders.quoteOnConnection(c, orderInput, context, { counter: true, ageConfirmed: true });
                if (!price.finalizable || price.total === '0.00') throw conflict('O carrinho não está disponível para venda');
                orderId = await salesModel.createDraft(c, customer.id_usuario, orderInput);
            } else {
                const price = await orders.quoteOnConnection(c, orderInput, context, { counter: true, ageConfirmed: input.ageConfirmed });
                if (!price.finalizable || price.total === '0.00' || price.total !== input.expectedTotal) {
                    throw conflict('O total precisa ser conferido novamente antes de pagar');
                }
                const internalKey = `counter:${createHash('sha256').update(key).digest('hex')}`;
                const reserved = await checkout.reserveCheckout(c, {
                    input: orderInput, key: internalKey, hash, context, actorId: actor.id_usuario, quote: price,
                });
                orderId = reserved.orderId;
                await payment.settleCounter(c, { orderId, amount: price.total, owner: actor.id_usuario, key: internalKey }, context);
                const paid = await orderModel.checkoutOrder(c, orderId);
                if (paid.status !== 'PAGO') throw conflict('Não foi possível concluir o Pix simulado');
                total = price.total;
                status = paid.status;
                if (input.ageConfirmed && orderInput.lines.some(line => line.kind === 'SESSION')) {
                    await identity.audit(c, 'COUNTER_ORDER.AGE_CONFIRMED', orderId, context);
                }
            }
            await c.execute('INSERT INTO pedidos_presenciais(id_pedido,id_sessao,id_operador,chave,hash_pedido,canal) VALUES(?,?,?,?,?,?)',
                [orderId, sessionId, actor.id_usuario, key, hash, input.channel]);
            await identity.audit(c, 'COUNTER_ORDER.CREATED', orderId, context);
            return result(c, orderId, input.channel, status, total);
        }, context);
    }
    async function result(c, orderId, channel, status, total) {
        const tickets = channel === 'BALCAO' && ['PAGO', 'FINALIZADO'].includes(status)
            ? await select(c, `SELECT t.codigo,t.tipo FROM tickets t JOIN itens_pedido ip ON ip.id_item=t.id_item
                WHERE ip.id_pedido=? ORDER BY t.id_ticket`, [orderId])
            : [];
        return { orderId: idString(orderId), channel, status, total: status === 'EM_ANDAMENTO' ? null : total,
            tickets: tickets.map(row => ({ code: row.codigo, type: row.tipo })) };
    }
    return { catalog, quote, sell };
}
