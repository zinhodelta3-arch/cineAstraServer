import { z } from 'zod';
import { catalogId } from './catalogValidators.js';
import { ApiError } from '../utils/ApiError.js';

const bigId = z.string().regex(/^[1-9]\d{0,19}$/).refine(v => BigInt(v) <= 18446744073709551615n);
const oneItem = value => Boolean(value.inputId) !== Boolean(value.equipmentId);
const quantity = z.number().int().min(-2147483647).max(2147483647).refine(v => v !== 0);
const balance = z.number().int().min(0).max(2147483647);
const manualTypes=z.enum(['ENTRADA','SAIDA','AJUSTE','PERDA','DEVOLUCAO']);
const matchesSign=v=>['ENTRADA','DEVOLUCAO'].includes(v.tipo)?v.quantidade>0:['SAIDA','PERDA'].includes(v.tipo)?v.quantidade<0:true;
const reason=z.string().trim().min(1).max(255);
const q=z.string().trim().min(1).max(120).optional();
export const inventorySchemas = {
    offerQuery: z.object({ offered: z.enum(['true','false']).transform(v => v === 'true').default(true),
        q: z.string().trim().min(1).max(150).optional(), limit: z.string().regex(/^\d{1,3}$/).transform(Number).pipe(z.number().min(1).max(100)).default(20), cursor: catalogId.optional() }).strict(),
    offer: z.object({ offered: z.boolean() }).strict(),
    adjustment: z.object({ quantity: balance, expectedQuantity: balance, reason: z.string().trim().min(1).max(255) }).strict(),
    movement: z.object({ inputId:catalogId.optional(),equipmentId:catalogId.optional(),localId:catalogId.optional(),
        tipo:manualTypes,quantidade:quantity,motivo:reason.optional() }).strict().refine(oneItem)
        .refine(v=>!['AJUSTE','PERDA','DEVOLUCAO'].includes(v.tipo)||Boolean(v.motivo)).refine(matchesSign),
    correction:z.object({tipo:manualTypes,quantidade:quantity,motivo:reason}).strict().refine(matchesSign),
    reversal:z.object({motivo:reason}).strict(),
    movementsQuery: z.object({ q, inputId: catalogId.optional(), equipmentId: catalogId.optional(), localId: catalogId.optional(),
        kind:z.literal('inputs').optional(), scope:z.literal('linked').optional(), order:z.literal('recent').optional(),
        limit: z.string().regex(/^\d{1,3}$/).transform(Number).pipe(z.number().int().min(1).max(100)).default(20), cursor: bigId.optional() })
        .strict().refine(v => !(v.equipmentId && (v.inputId || v.kind==='inputs'))),
    alertsQuery: z.object({ q, localId: catalogId, limit: z.string().regex(/^\d{1,3}$/).transform(Number).pipe(z.number().int().min(1).max(100)).default(20), cursor: catalogId.optional() }).strict()
};
export function inventoryParams(req,res,next) { if (!catalogId.safeParse(req.params.id).success) throw ApiError.validacao('ID inválido'); next(); }
export function movementParams(req,res,next) { if(!bigId.safeParse(req.params.id).success)throw ApiError.validacao('ID inválido');next(); }
export function inventoryQuery(schema) { return (req,res,next) => { const parsed = schema.safeParse(req.query); if (!parsed.success) throw ApiError.validacao('Filtro inválido'); req.inventoryQuery = parsed.data; next(); }; }
