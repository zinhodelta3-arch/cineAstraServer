import { z } from 'zod';
import { catalogId } from './catalogValidators.js';
import { ApiError } from '../utils/ApiError.js';

const note=z.string().trim().min(1).max(2000).optional();
const paging={limit:z.string().regex(/^\d{1,3}$/).transform(Number).pipe(z.number().int().min(1).max(100)).default(20),cursor:catalogId.optional(),localId:catalogId.optional()};
const routeFields = {
    distancia_km: z.string().regex(/^\d{1,6}(?:\.\d{1,2})?$/).refine(value => Number(value) > 0),
    tempo_estimado_min: z.number().int().min(1).max(10080)
};
export const supplySchemas={
    request:z.object({localId:catalogId,sessionId:catalogId.optional(),inputId:catalogId.optional(),equipmentId:catalogId.optional(),quantity:z.number().int().min(1).max(2147483647),note}).strict().refine(v=>Boolean(v.inputId)!==Boolean(v.equipmentId)).refine(v=>!v.equipmentId||Boolean(v.sessionId)),
    requestsQuery:z.object({...paging,sessionId:catalogId.optional(),status:z.enum(['PENDENTE','APROVADA','RECUSADA','FINALIZADA']).optional()}).strict(),
    supervisorReview:z.object({decision:z.enum(['APROVADA','RECUSADA'])}).strict(),
    dispatch:z.object({transportId:catalogId}).strict(),
    incident:z.object({type:z.enum(['ACIDENTE','EXTRAVIO','PERDA']),description:z.string().trim().min(1).max(2000)}).strict(),
    shipmentHistory:z.object({limit:paging.limit,cursor:z.string().regex(/^[1-9]\d{0,19}$/).refine(v=>BigInt(v)<=18446744073709551615n).optional()}).strict(),
    shipmentsQuery:z.object({...paging,sessionId:catalogId.optional()}).strict(),stockQuery:z.object({localId:catalogId,sessionId:catalogId.optional()}).strict(),
    sourcesQuery:z.object({...paging,kind:z.enum(['input','equipment']).default('input')}).strict(),
    logisticsRoutesQuery:z.object({limit:paging.limit,cursor:paging.cursor}).strict(),
    inputLink:z.object({sourceId:catalogId,targetId:catalogId}).strict().refine(value => value.sourceId !== value.targetId),
    logisticsRouteCreate:z.object({originId:catalogId,destinationId:catalogId,...routeFields}).strict()
        .refine(value => value.originId !== value.destinationId),
    logisticsRoutePatch:z.object({...routeFields,status:z.enum(['ATIVO','INATIVO'])}).partial().strict()
        .refine(value => Object.keys(value).length > 0)
};
export function supplyParams(req,res,next){if(Object.values(req.params).some(v=>!catalogId.safeParse(v).success))throw ApiError.validacao('ID inválido');next();}
export function supplyQuery(schema){return(req,res,next)=>{const p=schema.safeParse(req.query);if(!p.success)throw ApiError.validacao('Filtro inválido');req.supplyQuery=p.data;next();};}
