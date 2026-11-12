import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/identityValidators.js';
import { supplyParams,supplyQuery,supplySchemas } from '../validators/supplyValidators.js';

export const supplyOperations=[
    ['get','/api/unit/stock/sources','list_unit_stock_sources','sources'],
    ['get','/api/unit/stock/requests/{id}/alternatives','list_unit_supply_alternatives','alternatives'],
    ['post','/api/unit/stock/requests/{id}/review','review_stock_request','review'],
    ['get','/api/admin/logistics/routes','list_logistics_routes','logisticsRoutes'],
    ['post','/api/admin/logistics/routes','create_logistics_route','createLogisticsRoute'],
    ['patch','/api/admin/logistics/routes/{id}','update_logistics_route','patchLogisticsRoute'],
    ['get','/api/admin/logistics/input-links','list_replenishment_input_links','inputLinks'],
    ['post','/api/admin/logistics/input-links','save_replenishment_input_link','saveInputLink'],
    ['delete','/api/admin/logistics/input-links/{id}','remove_replenishment_input_link','removeInputLink'],
    ['get','/api/stock','get_local_stock','stock'],
    ['get','/api/stock/requests','list_stock_requests','requests'],
    ['post','/api/stock/requests','create_stock_request','createRequest'],
    ['get','/api/stock/requests/{id}','get_stock_request','request'],
    ['post','/api/stock/requests/{id}/approve','approve_stock_request','approve'],
    ['post','/api/stock/requests/{id}/refuse','refuse_stock_request','refuse'],
    ['get','/api/logistics','list_logistics','shipments'],
    ['get','/api/logistics/{id}','get_logistics','shipment'],
    ['post','/api/logistics/{id}/send','send_logistics','send'],
    ['get','/api/logistics/{id}/history','logistics_history','history'],
    ['post','/api/logistics/{id}/incidents','report_logistics_incident','incident'],
    ['post','/api/logistics/{id}/transit','transit_logistics','transit'],
    ['post','/api/logistics/{id}/receive','receive_logistics','receive'],
    ['post','/api/logistics/{id}/return','return_logistics_equipment','returnEquipment'],
    ['post','/api/logistics/{id}/cancel','cancel_logistics','cancel']
].map(([method,path,operationId,action])=>({method,path,operationId,action}));
export function supplyRoutes(controller,{auth}){
    const router=Router();
    for(const r of supplyOperations){
        const roles=r.action==='review'?['SUPERVISOR']:r.path.startsWith('/api/unit/')?['SUPERVISOR','COLABORADOR']
            :r.path.startsWith('/api/admin/')?['ADMIN']:['ADMIN','FORNECEDOR','SUPERVISOR','COLABORADOR'];
        const middle=[(req,res,next)=>{res.set('Cache-Control','no-store');next();},auth,allowRoles(...roles)];
        if(r.path.includes('{id}'))middle.push(supplyParams);
        if(r.action==='requests'||r.action==='shipments'||r.action==='stock')middle.push(supplyQuery(r.action==='requests'?supplySchemas.requestsQuery:r.action==='stock'?supplySchemas.stockQuery:supplySchemas.shipmentsQuery));
        if(r.action==='createRequest')middle.push(validateBody(supplySchemas.request));
        if(r.action==='review')middle.push(validateBody(supplySchemas.supervisorReview));
        if(r.action==='send')middle.push(validateBody(supplySchemas.dispatch));
        if(r.action==='incident')middle.push(validateBody(supplySchemas.incident));
        if(r.action==='history')middle.push(supplyQuery(supplySchemas.shipmentHistory));
        if(r.action==='sources')middle.push(supplyQuery(supplySchemas.sourcesQuery));
        if(r.action==='logisticsRoutes'||r.action==='inputLinks')middle.push(supplyQuery(supplySchemas.logisticsRoutesQuery));
        if(r.action==='saveInputLink')middle.push(validateBody(supplySchemas.inputLink));
        if(r.action==='createLogisticsRoute')middle.push(validateBody(supplySchemas.logisticsRouteCreate));
        if(r.action==='patchLogisticsRoute')middle.push(validateBody(supplySchemas.logisticsRoutePatch));
        router[r.method](r.path.replace('{id}',':id'),...middle,controller[r.action]);
    }
    return router;
}
