import {Router} from 'express';
import {z} from 'zod';
import {allowRoles} from '../middlewares/authMiddleware.js';
import {ApiError} from '../utils/ApiError.js';
import {success} from '../utils/dto.js';
import {body} from '../validators/contentValidators.js';

const id=z.string().regex(/^[1-9]\d{0,9}$/).refine(value=>Number(value)<=4294967295);
const category=z.enum(['Parcerias','Transmissões','Comunidade','Avisos']);
const list=z.object({
    cursor:z.union([z.literal('0'),id]).default('0'),
    limit:z.string().regex(/^(?:[1-9]|[1-4]\d|50)$/).default('20').transform(Number),
    category:category.optional()
}).strict();
const article=z.object({
    categoria:category,
    titulo:z.string().trim().min(3).max(180),
    resumo:z.string().trim().min(3).max(400),
    corpo:z.string().trim().min(3).max(10000),
    destaque:z.boolean(),
    publicar:z.boolean()
}).strict();
const context=req=>({actor:req.usuario,signal:req.signal,requestId:req.res.locals.requestId});
export const newsOperations=[
    {method:'get',path:'/api/news',operationId:'list_public_news'},
    {method:'get',path:'/api/news/{id}',operationId:'get_public_news'},
    {method:'get',path:'/api/admin/news',operationId:'list_admin_news'},
    {method:'post',path:'/api/admin/news',operationId:'create_news'},
    {method:'patch',path:'/api/admin/news/{id}',operationId:'update_news'},
    {method:'delete',path:'/api/admin/news/{id}',operationId:'archive_news'}
];
function validated(schema,input){
    const result=schema.safeParse(input);
    if(!result.success)throw ApiError.validacao('Confira os dados da notícia.');
    return result.data;
}

export function newsRoutes(service,{auth}){
    const router=Router(),admin=[auth,allowRoles('ADMIN')];
    router.use(['/api/news','/api/admin/news'],(req,res,next)=>{res.set('Cache-Control','no-store');next();});
    router.get('/api/news',async(req,res)=>success(res,await service.listPublic(validated(list,req.query),req.signal)));
    router.get('/api/news/:id',async(req,res)=>success(res,await service.getPublic(validated(id,req.params.id),req.signal)));
    router.get('/api/admin/news',...admin,async(req,res)=>success(res,await service.listAdmin(validated(list,req.query),context(req))));
    router.post('/api/admin/news',...admin,body(article,'article'),async(req,res)=>success(res,await service.save(null,req.article,context(req)),201));
    router.patch('/api/admin/news/:id',...admin,body(article,'article'),async(req,res)=>success(res,await service.save(validated(id,req.params.id),req.article,context(req))));
    router.delete('/api/admin/news/:id',...admin,async(req,res)=>success(res,await service.archive(validated(id,req.params.id),context(req))));
    return router;
}
