import {z} from 'zod';
import {ApiError} from '../utils/ApiError.js';
const big=z.string().regex(/^[1-9]\d{0,19}$/).refine(v=>/^[1-9]\d{0,19}$/.test(v)&&BigInt(v)<=18446744073709551615n);
const page=z.object({limit:z.string().regex(/^[1-9]\d{0,2}$/).transform(Number).pipe(z.number().max(100)).default(20),cursor:big.optional()}).strict();
export const favoriteBody=z.object({}).strict().default({});
export function favoriteParams(req,res,next){
    for(const key of ['profileId','filmId'])if(req.params[key]!==undefined){const id=req.params[key];if(!/^[1-9]\d{0,9}$/.test(id)||BigInt(id)>4294967295n)throw ApiError.validacao('ID inválido');}
    next();
}
export function favoritePage(req,res,next){const parsed=page.safeParse(req.query);if(!parsed.success)throw ApiError.validacao('Paginação inválida');req.favoritePage=parsed.data;next();}
