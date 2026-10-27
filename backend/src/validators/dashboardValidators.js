import {z} from 'zod';
import {ApiError} from '../utils/ApiError.js';
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>{const d=new Date(v+'T00:00:00Z');return Number.isFinite(+d)&&d.toISOString().slice(0,10)===v;});
export const dashboardQuery=z.object({from:date,to:date,localId:z.string().regex(/^[1-9]\d{0,9}$/).refine(v=>BigInt(v)<=4294967295n).optional()}).strict().refine(v=>v.from>='1000-01-01'&&v.to<='9999-12-30'&&v.to>=v.from&&(Date.parse(v.to)-Date.parse(v.from))/86400000<93);
export const validateDashboard=(req,res,next)=>{const p=dashboardQuery.safeParse(req.query);if(!p.success)throw ApiError.validacao('Período inválido: use até 93 dias e localId opcional');req.dashboardQuery=p.data;next();};
