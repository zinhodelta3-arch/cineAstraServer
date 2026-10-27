import {z} from 'zod';
import {ApiError} from '../utils/ApiError.js';
const id=z.string().regex(/^[1-9]\d{0,9}$/).refine(v=>/^[1-9]\d{0,9}$/.test(v)&&BigInt(v)<=4294967295n);
const page=z.object({limit:z.string().regex(/^[1-9]\d{0,2}$/).transform(Number).pipe(z.number().max(100)).default(20),cursor:id.optional()}).strict();
export function childrenQuery(req,res,next){const p=page.safeParse(req.query);if(!p.success)throw ApiError.validacao('Paginação inválida');req.childrenQuery=p.data;next();}
