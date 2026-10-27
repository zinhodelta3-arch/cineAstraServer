import {z} from 'zod';
import {ApiError} from '../utils/ApiError.js';
const text=max=>z.string().trim().min(1).max(max).regex(/^[^\u0000-\u001f\u007f]+$/);
const url=z.string().max(2048).refine(v=>{
 if(/[\\\u0000-\u0020\u007f]/.test(v))return false;
 if(v.startsWith('/')&&!v.startsWith('//'))return true;
 try{const u=new URL(v);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}
},'Use caminho interno ou URL HTTPS');
export const promotionalId=z.string().regex(/^[1-9]\d{0,9}$/).refine(v=>BigInt(v)<=4294967295n);
const common={slug:z.string().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),title:text(150),summary:text(500),description:text(5000).nullable().optional(),imageUrl:url.nullable().optional(),imageAlt:text(200).nullable().optional(),targetUrl:url.nullable().optional(),ctaLabel:text(80).nullable().optional(),tag:text(80).nullable().optional(),active:z.boolean().default(false)};
export const promotionalSchemas=Object.fromEntries(['partners','experiences','banners'].map(kind=>{
 const fields={...common,...(kind==='experiences'?{priceLabel:text(100).nullable().optional(),unit:text(150).nullable().optional(),details:z.array(text(250)).max(20).optional()}:{}),...(kind==='banners'?{placement:z.enum(['cinema-home','streaming-home','astrasnack'])}:{})};
 const create=z.object(fields).strict();return [kind,{create,patch:create.partial().extend({active:z.boolean().optional()}).refine(v=>Object.keys(v).length>0)}];
}));
const query=(admin,kind)=>z.object({limit:z.string().regex(/^[1-9]\d{0,2}$/).transform(Number).pipe(z.number().max(100)).default(20),cursor:promotionalId.optional(),...(kind==='banners'?{placement:z.enum(['cinema-home','streaming-home','astrasnack']).optional()}:{}),...(admin?{active:z.enum(['true','false']).transform(v=>v==='true').optional()}:{})}).strict();
export const promotionalValidation=r=>(req,res,next)=>{
 const parse=(schema,value)=>{const p=schema.safeParse(value);if(!p.success)throw ApiError.validacao('Conteúdo ou parâmetros inválidos');return p.data;};
 req.promo={query:parse(query(r.admin,r.kind),req.query)};
 if(req.params.id)req.promo.id=parse(promotionalId,req.params.id);
 if(r.action==='create'||r.action==='patch')req.promo.input=parse(promotionalSchemas[r.kind][r.action],req.body);
 next();
};
