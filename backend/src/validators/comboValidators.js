import { z } from 'zod';
import { catalogId } from './catalogValidators.js';
import { ApiError } from '../utils/ApiError.js';

const name = z.string().trim().min(1).max(150);
const price = z.string().regex(/^(0|[1-9]\d{0,7})\.\d{2}$/);
const event = z.object({ eventId:catalogId, sessionId:catalogId, totalLimit:z.number().int().min(1).max(100000),
    customerLimit:z.number().int().min(1).max(100) }).strict().refine(value=>value.customerLimit<=value.totalLimit).nullable().optional();
const item = z.object({ inputId: catalogId, quantidade: z.number().int().min(1).max(2147483647) }).strict();
const items = z.array(item).min(1).max(100).superRefine((value, ctx) => {
    const ids = new Set();
    for (const [index, row] of value.entries()) {
        if (ids.has(row.inputId)) ctx.addIssue({ code: 'custom', path: [index, 'inputId'], message: 'Insumo duplicado' });
        ids.add(row.inputId);
    }
});
export const comboSchemas = {
    create: z.object({ localId: catalogId, nome: name, descricao: z.string().trim().max(10000).nullable().optional(), preco: price.optional(), priceMode: z.literal('RULE').optional(), custo_operacional: price, items, event }).strict()
        .refine(input => input.priceMode === 'RULE' ? input.preco === undefined : input.preco !== undefined, { path: ['preco'] }),
    patch: z.object({ nome: name.optional(), descricao: z.string().trim().max(10000).nullable().optional(), preco: price.optional(), custo_operacional: price.optional(), event }).strict().refine(v => Object.keys(v).length > 0),
    composition: z.object({ items }).strict(),
    query: z.object({ localId: catalogId, limit: z.string().regex(/^\d{1,3}$/).transform(Number).pipe(z.number().min(1).max(100)).default(20), cursor: catalogId.optional(),
        inStock: z.enum(['true','false']).transform(value=>value==='true').optional(), sessionId:catalogId.optional() }).strict()
};
export function comboParams(req, res, next) { if (!/^[1-9]\d{0,9}$/.test(req.params.id) || !catalogId.safeParse(req.params.id).success) throw ApiError.validacao('ID inválido'); next(); }
export function comboQuery(req, res, next) { const parsed = comboSchemas.query.safeParse(req.query); if (!parsed.success) throw ApiError.validacao('Filtro inválido'); req.comboQuery = parsed.data; next(); }

const adminId=z.string().regex(/^[1-9]\d{0,9}$/).refine(v=>/^[1-9]\d{0,9}$/.test(v)&&BigInt(v)<=4294967295n);
const adminQuery=z.object({localId:adminId.optional(),cursor:adminId.optional(),limit:z.string().regex(/^[1-9]\d{0,2}$/).transform(Number).pipe(z.number().max(100)).default(20),active:z.enum(['true','false']).transform(v=>v==='true').optional(),q:z.string().trim().min(1).max(150).regex(/^[^\u0000-\u001f\u007f]+$/).optional()}).strict();
export function adminComboQuery(req,res,next){const p=adminQuery.safeParse(req.query);if(!p.success)throw ApiError.validacao('Filtros ou paginação inválidos');req.comboQuery=p.data;next();}
