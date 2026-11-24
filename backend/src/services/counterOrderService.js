import { createHash } from 'node:crypto';
import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';
import { interval } from './sessionService.js';
import { customerSearchTerm, maskedCustomerEmail } from './attendanceCustomer.js';

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
    function ensurePayable(price) {
        if (price.lines.some(line => line.catalogOutOfSync)) {
            throw new ApiError('O preço do catálogo precisa ser atualizado pelo cinema.', 409, null, 'CATALOG_PRICE_OUT_OF_SYNC');
        }
        if (!price.finalizable || price.total === '0.00') throw conflict('Confira a disponibilidade e o preço dos itens antes de confirmar o pedido.');
    }
    async function findCustomer(c, input, lock = false) {
        if (!input.customerId && !input.customerEmail) return null;
        const field = input.customerId ? 'id_usuario' : 'email';
        const row = await first(c, `SELECT id_usuario FROM usuarios
            WHERE ${field}=? AND tipo_usuario='CLIENTE' AND status='ATIVO'${lock ? ' FOR UPDATE' : ''}`, [input.customerId ?? input.customerEmail]);
        if (!row) throw new ApiError('Cliente cadastrado não encontrado',404,null,'COUNTER_CUSTOMER_NOT_FOUND');
        return idString(row.id_usuario);
    }
    async function customers(sessionId, query, context) {
        return identity.transaction(async c => {
            const { session } = await scopedSession(c, sessionId, context);
            ensureSellable(session);
            const search = customerSearchTerm(query.q);
            const rows = await select(c, `SELECT u.id_usuario,u.nome,u.email FROM usuarios u
                WHERE u.tipo_usuario='CLIENTE' AND u.status='ATIVO' AND u.id_usuario>? AND ${search.condition}
                ORDER BY u.id_usuario LIMIT ?`,[query.cursor ?? '0',search.value,query.limit+1]);
            const page = rows.slice(0,query.limit);
            return {items:page.map(row=>({id:idString(row.id_usuario),name:row.nome,emailHint:maskedCustomerEmail(row.email)})),
                pagination:{nextCursor:rows.length>query.limit?idString(page.at(-1).id_usuario):null}};
        }, context);
    }
    async function catalog(sessionId, context) {
        return identity.transaction(async c => {
            const { session } = await scopedSession(c, sessionId, context);
            ensureSellable(session);
            const seatMap = (await sessionModel.seatAvailability(sessionId, c)).filter(row=>row.id_assento!=null).map(row=>({
                id:idString(row.id_assento),row:row.fileira,number:row.numero,
                position:row.posicao_visual??row.numero,type:row.tipo,availability:row.disponibilidade
            }));
            const snacks = await select(c, `SELECT id_insumo AS id, nome, 'INPUT' AS kind FROM insumos
                WHERE id_local=? AND oferta_local=TRUE AND venda_avulsa=TRUE AND status='DISPONIVEL' AND quantidade>quantidade_reservada
                UNION ALL SELECT id_combo AS id, nome, 'COMBO' AS kind FROM combos
                WHERE id_local=? AND oferta_local=TRUE AND ativo=TRUE AND (id_sessao_evento IS NULL OR id_sessao_evento=?) ORDER BY nome,id`,
                [session.id_local, session.id_local, sessionId]);
            return {
                classification: session.classificacao,
                seats:seatMap.filter(seat=>seat.availability==='DISPONIVEL').map(seat=>({id:seat.id,label:`${seat.row}${seat.number}`})),
                seatMap,
                snacks: snacks.map(row => ({ id: idString(row.id), name: row.nome, kind: row.kind })),
            };
        }, context);
    }
    async function quote(sessionId, input, context) {
        return identity.transaction(async c => {
            const { session } = await scopedSession(c, sessionId, context);
            ensureSellable(session);
            const customerId = await findCustomer(c, input);
            return orders.quoteOnConnection(c, cart(sessionId, session, input.lines), context,
                { counter: true, ageConfirmed: input.ageConfirmed, customerId });
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
            if (input.channel === 'BALCAO' && !input.customerId && !input.customerName) {
                throw ApiError.validacao('Informe o nome do comprador para concluir a venda de balcão.');
            }
            const local = await sessionModel.local(session.id_local, c);
            const room = await sessionModel.room(session.id_sala, c, true);
            const current = await sessionModel.sessionForUpdate(sessionId, c);
            if (!local || !room || !current || idString(room.id_local) !== idString(session.id_local)
                || idString(current.id_sala) !== idString(room.id_sala)) throw conflict('Sessão indisponível para venda');
            ensureSellable({ ...session, ...current, local_status:local.status, sala_status:room.sala_status });
            const orderInput = cart(sessionId, session, input.lines);
            const customerId = await findCustomer(c, input, true);
            const ownerId = customerId ?? idString(actor.id_usuario);
            let orderId;
            let total = null;
            let status = 'EM_ANDAMENTO';
            if (input.channel === 'APP') {
                if (!customerId) throw ApiError.validacao('Selecione a conta do cliente.');
                if (orderInput.lines.some(line=>line.kind==='SESSION') && interval(session).start<=Date.now()) {
                    throw conflict('A sessão já começou. Use o Pix simulado no balcão para vender o ingresso.');
                }
                // A elegibilidade etária da conta é aplicada no checkout do cliente.
                const price = await orders.quoteOnConnection(c, orderInput, context, { counter: true, ageConfirmed: true, customerId });
                ensurePayable(price);
                orderId = await salesModel.createDraft(c, customerId, orderInput);
            } else {
                const price = await orders.quoteOnConnection(c, orderInput, context, { counter: true, ageConfirmed: input.ageConfirmed, customerId });
                ensurePayable(price);
                if (price.total !== input.expectedTotal) {
                    throw conflict('O total precisa ser conferido novamente antes de pagar');
                }
                const internalKey = `counter:${createHash('sha256').update(`${actor.id_usuario}:${key}`).digest('hex')}`;
                const reserved = await checkout.reserveCheckout(c, {
                    input: orderInput, key: internalKey, hash, context, actorId: ownerId, quote: price,
                });
                orderId = reserved.orderId;
                await payment.settleCounter(c, { orderId, amount: price.total, owner: ownerId, key: internalKey, notifyOrder: Boolean(customerId) }, context);
                const paid = await orderModel.checkoutOrder(c, orderId);
                if (paid.status !== 'PAGO') throw conflict('Não foi possível concluir o Pix simulado');
                total = price.total;
                status = paid.status;
                if (input.ageConfirmed && orderInput.lines.some(line => line.kind === 'SESSION')) {
                    await identity.audit(c, 'COUNTER_ORDER.AGE_CONFIRMED', orderId, context);
                }
            }
            await c.execute('INSERT INTO pedidos_presenciais(id_pedido,id_sessao,id_operador,chave,hash_pedido,canal,nome_cliente) VALUES(?,?,?,?,?,?,?)',
                [orderId, sessionId, actor.id_usuario, key, hash, input.channel, input.customerName ?? null]);
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
    return { catalog, customers, quote, sell };
}
