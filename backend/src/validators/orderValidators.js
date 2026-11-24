import { z } from 'zod';
import {ApiError} from '../utils/ApiError.js';
const id=z.string().regex(/^[1-9]\d{0,19}$/).refine(v=>/^[1-9]\d{0,19}$/.test(v)&&BigInt(v)<=18446744073709551615n);
const quantity=z.number().int().min(1).max(100);
const seat=z.object({kind:z.literal('SESSION'),id,seatId:id,quantity:z.literal(1),halfPreview:z.boolean().optional(),halfDeclaration:z.enum(['MEIA','NUBANK_SIMULADA']).optional()}).strict();
const input=z.object({kind:z.literal('INPUT'),id,quantity}).strict();
const combo=z.object({kind:z.literal('COMBO'),id,quantity,sessionId:id.optional()}).strict();
const streaming=z.object({kind:z.literal('STREAMING'),id,mode:z.enum(['ALUGUEL','COMPRA']),quantity:z.literal(1)}).strict();
export const orderBody=z.object({localId:id.optional(),lines:z.array(z.discriminatedUnion('kind',[seat,input,combo,streaming])).min(1).max(50),couponCode:z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{1,50}$/).optional(),acceptance:z.object({offerHash:z.string().regex(/^[a-f0-9]{64}$/),accepted:z.literal(true)}).strict().optional()}).strict();
export const orderCancelBody=z.object({}).strict().default({});
export const checkoutBody=orderBody.extend({draftOrderId:id.optional()}).strict();
const counterLine=z.discriminatedUnion('kind',[seat.omit({halfPreview:true,halfDeclaration:true}),input,combo.omit({sessionId:true})]);
const counterCart=z.object({lines:z.array(counterLine).min(1).max(50),ageConfirmed:z.boolean().default(false),customerId:id.optional()}).strict();
export const counterQuoteBody=counterCart;
const counterName=z.string().trim().min(2).max(100).regex(/^[\p{L}\p{M}][\p{L}\p{M} .’'-]*$/u);
export const counterSaleBody=z.discriminatedUnion('channel',[
    counterCart.extend({channel:z.literal('BALCAO'),expectedTotal:z.string().regex(/^\d{1,8}\.\d{2}$/),customerName:counterName.optional()}),
    counterCart.extend({channel:z.literal('APP'),customerEmail:z.string().trim().toLowerCase().email().max(254).optional()}),
]).refine(value=>value.channel!=='APP'||Boolean(value.customerId)!==Boolean(value.customerEmail), {path:['customerId']})
    .refine(value=>value.channel!=='BALCAO'||!value.customerId||!value.customerName,
        {path:['customerName'],message:'Use o nome da conta selecionada ou informe o nome do comprador.'});
const counterSearch=z.object({q:z.string().trim().min(3).max(254),limit:z.coerce.number().int().min(1).max(30).default(12),cursor:id.optional()}).strict();
export function counterCustomerQuery(req,res,next){
    const parsed=counterSearch.safeParse(req.query);
    if(!parsed.success)throw ApiError.validacao('Informe ao menos 3 caracteres do nome ou o e-mail completo.');
    req.customerQuery=parsed.data;next();
}

const orderListQuery=z.object({limit:z.string().regex(/^[1-9]\d{0,2}$/).transform(Number).pipe(z.number().max(100)).default(20),cursor:id.optional()}).strict();
export function orderPage(req,res,next){
    const parsed=orderListQuery.safeParse(req.query);
    if(!parsed.success)throw ApiError.validacao('Paginação inválida');
    req.orderPage=parsed.data;next();
}
