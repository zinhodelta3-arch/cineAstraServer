import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';

const eventSchema = z.object({
    recipientId: z.string().regex(/^[1-9]\d{0,9}$/).refine(v => BigInt(v) <= 4294967295n),
    title: z.string().trim().min(1).max(200),
    message: z.string().trim().min(1).max(10000),
    type: z.string().regex(/^[A-Z][A-Z0-9_]{0,49}$/),
    dedupeKey: z.string().trim().min(1).max(191)
}).strict();
const experienceType = 'EXPERIENCE_REQUEST_CREATED';
const experienceKey = 'experience-request-created';
export function experienceRequestNotice(recipientId, requestId) {
    return {
        recipientId, type: experienceType, dedupeKey: `${experienceKey}:${requestId}`,
        title: 'Solicitação de experiência recebida',
        message: `Acompanhe o pedido EXP-${requestId} e as mensagens da equipe.`
    };
}
export const notificationDto = row => {
    // A chave desse evento é estável por solicitação; expomos somente o identificador público.
    const [key, requestId, extra] = row.tipo === experienceType ? (row.dedupe_key ?? '').split(':') : [];
    const hasRequest = key === experienceKey && extra === undefined && /^[1-9]\d{0,9}$/.test(requestId) && Number(requestId) <= 4294967295;
    return {
        id_notificacao: idString(row.id_notificacao), titulo: row.titulo, mensagem: row.mensagem ?? null,
        tipo: row.tipo ?? null, lida: Boolean(row.lida), data_envio: row.data_envio,
        ...(hasRequest && { solicitacao_experiencia_id: requestId })
    };
};
export function createNotificationService({ model, identity }) {
    return {
        // API interna: sempre usa a conexão da transação de negócio do consumidor.
        async emit(c, input) {
            if (!c?.execute) throw new TypeError('Conexão transacional obrigatória');
            const event = eventSchema.parse(input);
            return notificationDto(await model.emit(c, event));
        },
        async list(q, context) {
            const rows = await model.list(context.actor.id, q);
            const items = rows.slice(0, q.limit);
            return { items: items.map(notificationDto), pagination: { limit: q.limit, nextCursor: rows.length > q.limit ? idString(items.at(-1).id_notificacao) : null } };
        },
        async markRead(id, context) {
            return identity.transaction(async c => {
                const actor = await identity.activeActor(c, context);
                const row = await model.markRead(c, idString(actor.id_usuario), id);
                if (!row) throw ApiError.naoEncontrado();
                return notificationDto(row);
            }, context);
        }
    };
}
