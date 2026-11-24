import { idString } from '../utils/dto.js';

const fields = 'n.id_notificacao,n.id_usuario,n.titulo,n.mensagem,n.tipo,n.lida,n.data_envio,n.dedupe_key,n.destino';
const linked = `${fields},
    (SELECT m.id_suporte FROM suporte_mensagens m JOIN suporte s ON s.id_suporte=m.id_suporte
        WHERE n.destino IS NULL AND n.tipo='SUPPORT_REPLY' AND n.dedupe_key REGEXP '^support-message-[0-9]+$'
          AND m.id_mensagem=CAST(SUBSTRING(n.dedupe_key,17) AS UNSIGNED) AND s.id_cliente=n.id_usuario) AS legacy_support_id,
    r.id_reembolso AS legacy_refund_id,p.id_pedido AS legacy_refund_order_id`;
const refund = `LEFT JOIN reembolso_solicitacoes r ON n.destino IS NULL AND n.tipo LIKE 'REFUND_%'
    AND n.dedupe_key REGEXP '^refund-[a-z]+:[0-9]+$'
    AND r.id_reembolso=CAST(SUBSTRING_INDEX(n.dedupe_key,':',-1) AS UNSIGNED) AND r.id_usuario=n.id_usuario
    LEFT JOIN pagamentos p ON p.id_pagamento=r.id_pagamento`;
export function createNotificationModel(database) {
    const rows = async (c, sql, params = []) => (await c.execute(sql, params))[0];
    const one = async (c, sql, params = []) => (await rows(c, sql, params))[0] ?? null;
    return {
        list(userId, q) {
            if (!Number.isInteger(q.limit) || q.limit < 1 || q.limit > 100) throw new TypeError('Limite inválido');
            const recent = q.order === 'recent';
            const where = ['n.id_usuario = ?'], args = [userId];
            let anchor = '';
            if (q.cursor) {
                if (recent) {
                    anchor = 'JOIN notificacoes anchor_notice ON anchor_notice.id_usuario=n.id_usuario AND anchor_notice.id_notificacao=?';
                    args.unshift(q.cursor);
                    where.push('(n.data_envio<anchor_notice.data_envio OR (n.data_envio IS NULL AND anchor_notice.data_envio IS NOT NULL) OR (n.data_envio<=>anchor_notice.data_envio AND n.id_notificacao<anchor_notice.id_notificacao))');
                } else { where.push('n.id_notificacao > ?'); args.push(q.cursor); }
            }
            if (q.unread !== undefined) { where.push('n.lida = ?'); args.push(q.unread ? 0 : 1); }
            if (q.type) { where.push('n.tipo = ?'); args.push(q.type); }
            return rows(database, `SELECT ${linked} FROM notificacoes n ${anchor} ${refund} WHERE ${where.join(' AND ')}
                ORDER BY ${recent?'n.data_envio DESC,n.id_notificacao DESC':'n.id_notificacao ASC'} LIMIT ${q.limit + 1}`, args);
        },
        own: (c, userId, id) => one(c, `SELECT ${linked} FROM notificacoes n ${refund} WHERE n.id_usuario = ? AND n.id_notificacao = ?`, [userId, id]),
        async emit(c, input) {
            const conversation = input.type==='SUPPORT_REPLY' && input.dedupeKey.startsWith('support-conversation:');
            await c.execute(`INSERT INTO notificacoes (id_usuario,titulo,mensagem,tipo,dedupe_key,destino,lida,data_envio)
                VALUES (?,?,?,?,?,?,FALSE,UTC_TIMESTAMP()) AS incoming ON DUPLICATE KEY UPDATE
                ${conversation?'titulo=incoming.titulo,mensagem=incoming.mensagem,destino=incoming.destino,lida=FALSE,data_envio=incoming.data_envio':'id_notificacao=id_notificacao'}`,
                [input.recipientId,input.title,input.message,input.type,input.dedupeKey,input.target?JSON.stringify(input.target):null]);
            const row = await one(c, `SELECT ${fields} FROM notificacoes n WHERE n.id_usuario = ? AND n.dedupe_key = ?`, [input.recipientId, input.dedupeKey]);
            if (!row) throw new Error('Notificação não persistida');
            return row;
        },
        async emitBatch(c, events) {
            const ids=events.map(event=>event.recipientId);
            const [existing]=await c.execute(`SELECT id_usuario FROM notificacoes WHERE dedupe_key=? AND id_usuario IN (${ids.map(()=>'?').join(',')})`,
                [events[0].dedupeKey,...ids]);
            const known=new Set(existing.map(row=>idString(row.id_usuario)));
            const pending=events.filter(event=>!known.has(event.recipientId));
            if(!pending.length)return 0;
            await c.execute(`INSERT INTO notificacoes (id_usuario,titulo,mensagem,tipo,dedupe_key,destino,lida,data_envio)
                VALUES ${pending.map(()=>'(?,?,?,?,?,?,FALSE,UTC_TIMESTAMP())').join(',')}`,
                pending.flatMap(event=>[event.recipientId,event.title,event.message,event.type,event.dedupeKey,JSON.stringify(event.target)]));
            return pending.length;
        },
        async markRead(c, userId, id) {
            await c.execute('UPDATE notificacoes SET lida = TRUE WHERE id_usuario = ? AND id_notificacao = ? AND lida = FALSE', [userId, id]);
            return this.own(c, userId, id);
        }
    };
}
