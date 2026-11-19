import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';
import { cents, money, percent } from './pricingMath.js';

const percentageBps = 100;
const dateInCinema = date => date.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
const monthOf = date => dateInCinema(date).slice(0, 7);
const aggregateCents = value => {
    const [whole, fraction = ''] = String(value).split('.');
    return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
};
const paidInstant = value => new Date(value.replace(' ', 'T') + 'Z');
const one = async (c, sql, values = []) => (await c.execute(sql, values))[0][0] ?? null;
const fields = `i.id_iniciativa AS id,DATE_FORMAT(i.competencia,'%Y-%m') AS month,i.instituicao AS institution,
    i.categoria AS category,i.descricao AS description,i.finalidade AS purpose,
    i.comprovacao_url AS proofUrl,i.simulado AS simulated`;
const dto = row => ({ ...row, id: idString(row.id), simulated: Number(row.simulated) === 1, active: row.month === monthOf(new Date()) });

export function createSocialProgramService({ database, identity, simulated }) {
    const admin = (context, operation) => identity.transaction(async c => {
        const actor = await identity.activeActor(c, context);
        if (actor.tipo_usuario !== 'ADMIN') throw ApiError.acessoNegado();
        return operation(c);
    }, context);
    const currentMonth = (c, month, publishedBy) => one(c, `SELECT ${fields} FROM iniciativas_sociais_mensais i
        WHERE i.competencia=? AND i.publicado_em<=${publishedBy ? '?' : 'UTC_TIMESTAMP(3)'}`,
    [month + '-01', ...(publishedBy ? [publishedBy] : [])]);

    return {
        async list({ cursor, limit, period }, administrative = false) {
            const filters = [], params = [];
            if (cursor) { filters.push('i.id_iniciativa<?'); params.push(cursor); }
            if (period) {
                filters.push(period === 'current' ? 'i.competencia=?' : 'i.competencia<>?');
                params.push(monthOf(new Date()) + '-01');
            }
            const [rows] = await database.execute(`SELECT ${fields},
                (SELECT COALESCE(SUM(d.valor),0) FROM destinacao_social_pedidos d WHERE d.id_iniciativa=i.id_iniciativa) AS gross,
                (SELECT COALESCE(SUM(a.valor),0) FROM destinacao_social_ajustes a JOIN destinacao_social_pedidos d ON d.id_pedido=a.id_pedido
                    WHERE d.id_iniciativa=i.id_iniciativa) AS refunds
                FROM iniciativas_sociais_mensais i ${filters.length ? 'WHERE ' + filters.join(' AND ') : ''}
                ORDER BY i.id_iniciativa DESC LIMIT ?`, [...params, limit + 1]);
            const items = rows.slice(0, limit).map(({ gross, refunds, ...row }) => {
                const amount = aggregateCents(gross) - aggregateCents(refunds);
                return dto({ ...row, amount: (amount / 100n) + '.' + (amount % 100n).toString().padStart(2, '0'),
                    ...(administrative && { gross: String(gross), adjustments: String(refunds) }) });
            });
            return { items, pagination: { limit, nextCursor: rows.length > limit ? items.at(-1).id : null } };
        },
        publish: (input, context) => admin(context, async c => {
            if (input.month < monthOf(new Date())) throw ApiError.validacao('Escolha o mês atual ou um mês futuro.');
            const record = await one(c, 'SELECT * FROM destinacoes_sociais WHERE id_destinacao=? FOR UPDATE', [input.destinationId]);
            if (!record) throw ApiError.naoEncontrado();
            let result;
            try {
                [result] = await c.execute(`INSERT INTO iniciativas_sociais_mensais
                    (competencia,id_destinacao,instituicao,categoria,descricao,finalidade,comprovacao_url,simulado)
                    VALUES(?,?,?,?,?,?,?,?)`, [input.month + '-01', input.destinationId, record.instituicao, record.categoria,
                    record.descricao, record.finalidade, input.proofUrl ?? null, simulated]);
            } catch (error) {
                if (error.code === 'ER_DUP_ENTRY') throw new ApiError('Este mês já tem uma iniciativa publicada.', 409, null, 'SOCIAL_MONTH_OCCUPIED');
                throw error;
            }
            const id = idString(result.insertId);
            await identity.audit(c, 'SOCIAL_PROGRAM.PUBLISHED', id, context);
            return dto(await one(c, `SELECT ${fields} FROM iniciativas_sociais_mensais i WHERE i.id_iniciativa=?`, [id]));
        }),
        proof: (id, proofUrl, context) => admin(context, async c => {
            const row = await one(c, 'SELECT id_iniciativa FROM iniciativas_sociais_mensais WHERE id_iniciativa=? FOR UPDATE', [id]);
            if (!row) throw ApiError.naoEncontrado();
            await c.execute('UPDATE iniciativas_sociais_mensais SET comprovacao_url=? WHERE id_iniciativa=?', [proofUrl, id]);
            await identity.audit(c, 'SOCIAL_PROGRAM.PROOF_UPDATED', id, context);
            return dto(await one(c, `SELECT ${fields} FROM iniciativas_sociais_mensais i WHERE i.id_iniciativa=?`, [id]));
        }),
        async preview(c, total) {
            if (cents(total) === 0n) return null;
            const row = await currentMonth(c, monthOf(new Date()));
            if (!row) return null;
            return { initiativeId: idString(row.id), institution: row.institution, month: row.month,
                amount: money(percent(cents(total), percentageBps)), simulated: Number(row.simulated) === 1 };
        },
        async capture(c, { orderId, paymentId, amount, occurredAt }) {
            const row = await currentMonth(c, monthOf(paidInstant(occurredAt)), occurredAt);
            if (!row) return;
            await c.execute(`INSERT INTO destinacao_social_pedidos(id_pedido,id_pagamento,id_iniciativa,base_valor,taxa_bps,valor,capturado_em)
                VALUES(?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE id_pedido=destinacao_social_pedidos.id_pedido`,
            [orderId, paymentId, row.id, amount, percentageBps, money(percent(cents(amount), percentageBps)), occurredAt]);
        },
        async refund(c, { refundId, paymentId, cumulativeAmount }) {
            const capture = await one(c, 'SELECT id_pedido,base_valor,taxa_bps,valor FROM destinacao_social_pedidos WHERE id_pagamento=? FOR UPDATE', [paymentId]);
            if (!capture) return;
            const [applied] = await c.execute('SELECT id_reembolso,valor FROM destinacao_social_ajustes WHERE id_pedido=? FOR UPDATE', [capture.id_pedido]);
            if (applied.some(entry => idString(entry.id_reembolso) === idString(refundId))) return;
            const totalAdjusted = applied.reduce((total, entry) => total + cents(entry.valor), 0n);
            const net = percent(cents(capture.base_valor) - cents(cumulativeAmount), Number(capture.taxa_bps));
            const adjustment = cents(capture.valor) - totalAdjusted - net;
            if (adjustment < 0n) throw new Error('Ajustes de destinação social fora de sequência.');
            await c.execute(`INSERT INTO destinacao_social_ajustes(id_reembolso,id_pedido,valor) VALUES(?,?,?)
                ON DUPLICATE KEY UPDATE id_reembolso=destinacao_social_ajustes.id_reembolso`,
            [refundId, capture.id_pedido, money(adjustment)]);
        },
        async byOrder(c, orderId) {
            const row = await one(c, `SELECT d.id_iniciativa AS initiativeId,i.instituicao AS institution,
                DATE_FORMAT(i.competencia,'%Y-%m') AS month,i.simulado AS simulated,
                d.valor-COALESCE((SELECT SUM(a.valor) FROM destinacao_social_ajustes a WHERE a.id_pedido=d.id_pedido),0) AS amount
                FROM destinacao_social_pedidos d JOIN iniciativas_sociais_mensais i ON i.id_iniciativa=d.id_iniciativa
                WHERE d.id_pedido=?`, [orderId]);
            return row ? { ...row, initiativeId: idString(row.initiativeId), simulated: Number(row.simulated) === 1 } : null;
        }
    };
}
