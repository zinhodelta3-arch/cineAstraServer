import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { catalogId } from './catalogValidators.js';

const text=max=>z.string().trim().min(1).max(max).regex(/^[^\u0000-\u001f\u007f]+$/);
const identification=z.string().trim().max(40).regex(/^[^\u0000-\u001f\u007f]*$/).transform(value=>value?value.toUpperCase():null).nullable();
const note=z.string().trim().max(2000).transform(value=>value||null).nullable();
const status=z.enum(['ATIVO','INATIVO']);
export const supplierTransportSchemas={
    create:z.object({nome:text(120),tipo:text(60),identificacao:identification.optional(),observacao:note.optional()}).strict(),
    patch:z.object({nome:text(120).optional(),tipo:text(60).optional(),identificacao:identification.optional(),observacao:note.optional(),status:status.optional()}).strict().refine(value=>Object.keys(value).length>0),
    query:z.object({limit:z.string().regex(/^[1-9]\d{0,2}$/).transform(Number).pipe(z.number().max(100)).default(20),cursor:catalogId.optional(),status:status.optional(),q:text(120).optional(),available:z.literal('true').optional()}).strict()
};
export function supplierTransportQuery(req,res,next) {
    const parsed=supplierTransportSchemas.query.safeParse(req.query);
    if(!parsed.success)throw ApiError.validacao('Filtros ou paginação inválidos.');
    req.transportQuery=parsed.data;next();
}
export function supplierTransportParams(req,res,next) {
    if(!catalogId.safeParse(req.params.id).success)throw ApiError.validacao('Transporte inválido.');
    next();
}
