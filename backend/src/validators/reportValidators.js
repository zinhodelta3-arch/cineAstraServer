import {z} from 'zod';
import {ApiError} from '../utils/ApiError.js';

const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>{const d=new Date(`${v}T00:00:00Z`);return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v;});
const id=z.string().regex(/^[1-9]\d{0,19}$/).refine(v=>BigInt(v)<=18446744073709551615n);
const range=z.object({from:date,to:date}).refine(v=>{const days=(Date.parse(`${v.to}T00:00:00Z`)-Date.parse(`${v.from}T00:00:00Z`))/86400000;return v.from>='1000-01-01'&&v.to<='9999-12-30'&&days>=0&&days<=366;});
export const financialQuery=range.safeExtend({scope:z.enum(['ALL','ORDERS','SUBSCRIPTIONS']).default('ALL')}).strict();
const logBase=range.safeExtend({limit:z.coerce.number().int().min(1).max(100).default(20),cursor:id.optional(),actorId:id.optional()});
export const auditQuery=logBase.safeExtend({eventType:z.string().regex(/^[A-Z][A-Z0-9_.]{0,79}$/).optional()}).strict();
export const httpQuery=logBase.safeExtend({status:z.coerce.number().int().min(100).max(599).optional()}).strict();
export const destinationId=id;
export const destinationPage=z.object({limit:z.coerce.number().int().min(1).max(100).default(20),cursor:id.optional()}).strict();
const text=max=>z.string().trim().min(1).max(max);
export const destinationBody=z.object({
    institution:text(150),
    category:z.enum(['CARIDADE','ONG','EMPRESA_VULNERAVEL']),
    description:text(1000),
    purpose:text(500),
    resource:text(150).nullable(),
    amount:z.string().regex(/^(0|[1-9]\d{0,9})\.\d{2}$/).refine(value=>value!=='0.00').nullable(),
    accountingReference:text(150).nullable()
}).strict();
function financialReference(value){
    return value.amount===null ? value.accountingReference===null : Boolean(value.resource && value.accountingReference);
}
export const destinationCreate=destinationBody.refine(financialReference,'Para registrar um valor, informe o recurso e a referência contábil.');
export const destinationUpdate=destinationBody.extend({revision:z.number().int().min(1).max(4294967294)})
    .refine(financialReference,'Para registrar um valor, informe o recurso e a referência contábil.');
export const query=(schema,key)=>(req,res,next)=>{const parsed=schema.safeParse(req.query);if(!parsed.success)throw ApiError.validacao('Período ou filtro inválido');req[key]=parsed.data;next();};
