import {z} from 'zod';
import {ApiError} from '../utils/ApiError.js';
const big=z.string().regex(/^[1-9]\d{0,19}$/).refine(v=>/^[1-9]\d{0,19}$/.test(v)&&BigInt(v)<=18446744073709551615n);
const small=z.string().regex(/^[1-9]\d{0,9}$/).refine(v=>/^[1-9]\d{0,9}$/.test(v)&&BigInt(v)<=4294967295n);
const price=z.string().regex(/^(0|[1-9]\d{0,7})\.\d{2}$/).refine(v=>v!=='0.00');
const order=z.object({reason:z.enum(['ARREPENDIMENTO','DEFEITO','OUTRO']),details:z.string().trim().min(1).max(1000).optional()}).strict();
export const refundSchemas={
    order,
    adminOrder:order.extend({paymentId:big.optional()}),
    request:z.object({reason:z.enum(['ARREPENDIMENTO','DEFEITO','OUTRO','CANCELAMENTO_PLANO']),details:z.string().trim().min(1).max(1000).optional()}).strict(),
    decision:z.object({decision:z.enum(['APPROVE','DENY','CANCEL']),amount:price.optional(),
        itemIds:z.array(big).min(1).max(50).refine(ids=>new Set(ids).size===ids.length).optional(),
        termsVersion:z.string().min(1).max(50),basis:z.string().trim().min(10).max(1000),
        response:z.string().trim().min(10).max(1000)}).strict()
        .refine(x=>x.decision==='APPROVE'===Boolean(x.amount)&&(!x.itemIds||x.decision==='APPROVE'))
};
const orderRefundQuery=z.object({
    limit:z.string().regex(/^[1-9]\d{0,2}$/).transform(Number).pipe(z.number().max(100)).default(20),cursor:big.optional(),
}).strict();
export function orderRefundPage(req,res,next){
    const result=orderRefundQuery.safeParse(req.query);
    if(!result.success)throw ApiError.validacao('Paginação inválida');
    req.refundPage=result.data;
    next();
}
export function refundId(req,res,next){if(!big.safeParse(req.params.id).success)throw ApiError.validacao('ID inválido');next();}
export function subscriptionId(req,res,next){if(!small.safeParse(req.params.id).success)throw ApiError.validacao('ID inválido');next();}

const adminRefundQuery=z.object({
    limit:z.string().regex(/^[1-9]\d{0,2}$/).transform(Number).pipe(z.number().max(100)).default(20),cursor:big.optional(),
    stage:z.enum(['pending','closed']).optional(),
    visibility:z.enum(['active','archived']).optional(),
    status:z.enum(['RECEBIDA','EM_ANALISE','ENVIADA','CONFIRMADA','NEGADA','FALHOU','CANCELADA']).optional(),
    reason:z.enum(['ARREPENDIMENTO','DEFEITO','OUTRO','CANCELAMENTO_PLANO']).optional(),
    compensation:z.enum(['NAO_APLICAVEL','PENDENTE','CONCLUIDA']).optional(),
    userId:small.optional(),paymentId:big.optional(),orderId:big.optional(),chargeId:big.optional()
}).strict();
export function adminRefundPage(req,res,next){const p=adminRefundQuery.safeParse(req.query);if(!p.success)throw ApiError.validacao('Filtros ou paginação inválidos');req.adminRefundQuery=p.data;next();}
