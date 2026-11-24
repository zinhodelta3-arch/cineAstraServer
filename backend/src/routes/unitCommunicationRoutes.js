import { Router } from 'express';
import { z } from 'zod';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { catalogId } from '../validators/catalogValidators.js';
import { validateBody } from '../validators/identityValidators.js';
import { ApiError } from '../utils/ApiError.js';
import { success } from '../utils/dto.js';

export const unitCommunicationOperations = [
    {method:'get',path:'/api/unit/communications/alerts',operationId:'list_unit_communication_alerts',action:'alerts'},
    {method:'get',path:'/api/unit/communications/recipients',operationId:'list_unit_communication_recipients',action:'recipients'},
    {method:'post',path:'/api/unit/communications',operationId:'send_unit_communication',action:'send'}
];

const recipientsQuery=z.object({
    q:z.string().trim().min(1).max(100).optional(),
    cursor:catalogId.optional(),
    limit:z.coerce.number().int().min(1).max(100).default(20)
}).strict();
const messageFields={
    title:z.string().trim().min(1).max(170),
    message:z.string().trim().min(1).max(2000),
    requestId:z.uuid()
};
const sendBody=z.discriminatedUnion('audience',[
    z.object({...messageFields,audience:z.literal('ALL')}).strict(),
    z.object({...messageFields,audience:z.literal('SELECTED'),recipientIds:z.array(catalogId).min(1).max(100)
        .refine(ids=>new Set(ids).size===ids.length)}).strict()
]);

export function unitCommunicationRoutes(service,{auth,limits}) {
    const router=Router();
    for(const route of unitCommunicationOperations) {
        const middleware=[(req,res,next)=>{res.set('Cache-Control','no-store');next();},auth,allowRoles('SUPERVISOR')];
        if(route.action==='send')middleware.push(...limits.checkout,validateBody(sendBody));
        router[route.method](route.path,...middleware,async(req,res)=>{
            const context={actor:req.usuario,signal:req.signal,requestId:res.locals.requestId};
            if(route.action==='send')return success(res,await service.send(req.input,context),201);
            if(route.action==='alerts')return success(res,await service.alerts(context));
            const q=recipientsQuery.safeParse(req.query);
            if(!q.success)throw ApiError.validacao('Filtros de destinatários inválidos.');
            return success(res,await service.recipients(q.data,context));
        });
    }
    return router;
}
