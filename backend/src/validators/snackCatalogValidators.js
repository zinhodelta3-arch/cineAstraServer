import {z} from 'zod';
import {ApiError} from '../utils/ApiError.js';
const id=z.string().regex(/^[1-9]\d{0,9}$/).refine(v=>/^[1-9]\d{0,9}$/.test(v)&&BigInt(v)<=4294967295n);
const text=max=>z.string().trim().min(1).max(max).regex(/^[^\u0000-\u001f\u007f]+$/);
const page=z.object({limit:z.string().regex(/^[1-9]\d{0,2}$/).transform(Number).pipe(z.number().max(100)).default(20),cursor:id.optional(),q:text(150).optional(),category:text(100).optional(),inStock:z.enum(['true','false']).transform(v=>v==='true').optional()}).strict();
export function snackParams(req,res,next){if(Object.values(req.params).some(v=>!id.safeParse(v).success))throw ApiError.validacao('ID inválido');next();}
export function snackQuery(req,res,next){const p=page.safeParse(req.query);if(!p.success)throw ApiError.validacao('Filtros inválidos');req.snackQuery=p.data;next();}
