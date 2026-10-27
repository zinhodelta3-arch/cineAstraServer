import { z } from 'zod';
import {ApiError} from '../utils/ApiError.js';
const id=z.string().regex(/^[1-9]\d{0,19}$/).refine(v=>/^[1-9]\d{0,19}$/.test(v)&&BigInt(v)<=18446744073709551615n);
const quantity=z.number().int().min(1).max(100);
const seat=z.object({kind:z.literal('SESSION'),id,seatId:id,quantity:z.literal(1),halfPreview:z.boolean().optional()}).strict();
const input=z.object({kind:z.literal('INPUT'),id,quantity}).strict();
const combo=z.object({kind:z.literal('COMBO'),id,quantity,sessionId:id.optional()}).strict();
const streaming=z.object({kind:z.literal('STREAMING'),id,mode:z.enum(['ALUGUEL','COMPRA']),quantity:z.literal(1)}).strict();
export const orderBody=z.object({localId:id.optional(),lines:z.array(z.discriminatedUnion('kind',[seat,input,combo,streaming])).min(1).max(50),couponCode:z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{1,50}$/).optional(),acceptance:z.object({offerHash:z.string().regex(/^[a-f0-9]{64}$/),accepted:z.literal(true)}).strict().optional()}).strict();
export const orderCancelBody=z.object({}).strict().default({});

const orderListQuery=z.object({limit:z.string().regex(/^[1-9]\d{0,2}$/).transform(Number).pipe(z.number().max(100)).default(20),cursor:id.optional()}).strict();
export function orderPage(req,res,next){
    const parsed=orderListQuery.safeParse(req.query);
    if(!parsed.success)throw ApiError.validacao('Paginação inválida');
    req.orderPage=parsed.data;next();
}
