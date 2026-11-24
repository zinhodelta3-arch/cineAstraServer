import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';

const referenceId=z.string().regex(/^[1-9]\d{0,19}$/).refine(value=>BigInt(value)<=18446744073709551615n);
const targetSchema=z.object({
    kind:z.enum(['support','adminSupport','order','refund','supply','team','experience','unitCommunication','subscription']),
    id:referenceId,
    detailId:referenceId.optional()
}).strict();
const eventSchema = z.object({
    recipientId: z.string().regex(/^[1-9]\d{0,9}$/).refine(v => BigInt(v) <= 4294967295n),
    title: z.string().trim().min(1).max(200),
    message: z.string().trim().min(1).max(10000),
    type: z.string().regex(/^[A-Z][A-Z0-9_]{0,49}$/),
    dedupeKey: z.string().trim().min(1).max(191),
    target:targetSchema.optional()
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
    let destination = row.destino;
    if (typeof destination === 'string') {
        try { destination=JSON.parse(destination); } catch { destination=null; }
    }
    if (!destination && row.legacy_support_id != null) destination={kind:'support',id:idString(row.legacy_support_id)};
    if (!destination && row.legacy_refund_id != null) destination={kind:'refund',id:idString(row.legacy_refund_id),...(row.legacy_refund_order_id!=null&&{detailId:idString(row.legacy_refund_order_id)})};
    const target=targetSchema.safeParse(destination);
    return {
        id_notificacao: idString(row.id_notificacao), titulo: row.titulo, mensagem: row.mensagem ?? null,
        tipo: row.tipo ?? null, lida: Boolean(row.lida), data_envio: row.data_envio,
        ...(hasRequest && { solicitacao_experiencia_id: requestId }),
        ...(target.success && { destino:target.data })
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
        async emitUnitCommunication(c, recipients, input) {
            const fields={title:input.title,message:input.message,type:'UNIT_COMMUNICATION',dedupeKey:input.dedupeKey,
                target:{kind:'unitCommunication',id:input.localId}};
            let delivered=0;
            for(let index=0;index<recipients.length;index+=200) {
                const batch=recipients.slice(index,index+200).map(recipientId=>eventSchema.parse({...fields,recipientId}));
                delivered+=await model.emitBatch(c,batch);
            }
            return delivered;
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
