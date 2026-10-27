import {z} from 'zod';
import {ApiError} from '../utils/ApiError.js';
const cursor=z.string().max(60).refine(v=>{
    const m=/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)_([1-9]\d{0,19})$/.exec(v);
    return !!m&&Number.isFinite(Date.parse(m[1]))&&new Date(m[1]).toISOString()===m[1]&&BigInt(m[2])<=18446744073709551615n;
});
export const progressBody=z.object({positionSeconds:z.number().int().min(0).max(4294967295),expectedVersion:z.number().int().min(0).max(4294967294)}).strict();
export const progressEmpty=z.object({}).strict().default({});
const page=z.object({limit:z.string().regex(/^[1-9]\d{0,2}$/).transform(Number).pipe(z.number().max(100)).default(20),cursor:cursor.optional()}).strict();
export function progressPage(req,res,next){const result=page.safeParse(req.query);if(!result.success)throw ApiError.validacao('Paginação inválida');req.progressPage=result.data;next();}
export {favoriteParams as progressParams} from './streamingFavoriteValidators.js';
