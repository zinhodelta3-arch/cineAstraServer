import {z} from 'zod';
import {ApiError} from '../utils/ApiError.js';
const id=max=>z.string().regex(/^[1-9]\d{0,19}$/).refine(v=>/^[1-9]\d{0,19}$/.test(v)&&BigInt(v)<=max);
const small=id(4294967295n),big=id(18446744073709551615n);
const shared={limit:z.string().regex(/^[1-9]\d{0,2}$/).transform(Number).pipe(z.number().max(100)).default(20),q:z.string().trim().min(1).max(150).regex(/^[^\u0000-\u001f\u007f]+$/).optional()};
export const adminDirectorySchemas={
 users:z.object({...shared,cursor:small.optional(),role:z.enum(['ADMIN','FORNECEDOR','SUPERVISOR','COLABORADOR','CLIENTE']).optional(),status:z.enum(['ATIVO','INATIVO','BLOQUEADO','PENDENTE_VERIFICACAO']).optional(),userId:small.optional()}).strict(),
 privacy:z.object({...shared,cursor:big.optional(),userId:small.optional(),status:z.enum(['RECEBIDA','EM_ANALISE','CONCLUIDA','RECUSADA']).optional(),type:z.literal('EXCLUSAO').optional()}).strict()
};
export const adminDirectoryQuery=kind=>(req,res,next)=>{const p=adminDirectorySchemas[kind].safeParse(req.query);if(!p.success)throw ApiError.validacao('Filtros ou paginação inválidos');req.directoryQuery=p.data;next();};
