import {z} from 'zod';
import {ApiError} from '../utils/ApiError.js';

const id=z.string().regex(/^[1-9]\d{0,19}$/).refine(v=>BigInt(v)<=18446744073709551615n);
const code=z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export const ticketValidationBody=z.object({code,sessionId:id.optional()}).strict();
export const ticketConsumeBody=ticketValidationBody.extend({halfEvidenceType:z.enum(['CIE','PCD','ID_JOVEM','IDOSO']).optional()});
export const customerPassageBody=z.object({ticketId:id,direction:z.enum(['ENTRADA','SAIDA']),halfEvidenceType:ticketConsumeBody.shape.halfEvidenceType}).strict()
    .refine(value=>value.direction==='ENTRADA'||value.halfEvidenceType===undefined);
export function ticketIdParam(req,res,next){const idValue=req.params.orderId??req.params.sessionId;if(!id.safeParse(idValue).success)throw ApiError.validacao('ID inválido');next();}
const pageFields={limit:z.coerce.number().int().min(1).max(100).default(50),cursor:z.union([z.literal('0'),id]).default('0')};
const page=z.object(pageFields).strict();
const sessionPage=page.extend({presence:z.enum(['PRESENTE','SAIU','AUSENTE','AGUARDANDO','SEM_REGISTRO']).optional()});
const parsePage=schema=>(req,res,next)=>{const q=schema.safeParse(req.query);
    if(!q.success)throw ApiError.validacao('Paginação inválida');req.ticketPage=q.data;next();}
export const ticketPage=parsePage(page);
export const sessionTicketPage=parsePage(sessionPage);
export function sessionRecordSection(req,res,next){
    if(!['orders','staff','payments','refunds','audit'].includes(req.params.section))throw ApiError.naoEncontrado();
    next();
}
