import {Router} from 'express';
import {allowRoles} from '../middlewares/authMiddleware.js';
import {query,financialQuery,auditQuery,httpQuery,destinationId,destinationPage,destinationCreate,destinationUpdate} from '../validators/reportValidators.js';
import {validateBody} from '../validators/identityValidators.js';
import {ApiError} from '../utils/ApiError.js';
export const reportOperations=[
    {method:'get',path:'/api/admin/reports/finance',operationId:'admin_financial_report',action:'finance'},
    {method:'get',path:'/api/admin/reports/social-allocation',operationId:'admin_social_allocation',action:'social'},
    {method:'get',path:'/api/admin/audit-logs',operationId:'admin_audit_log',action:'audit'},
    {method:'get',path:'/api/admin/http-logs',operationId:'admin_http_log',action:'http'},
    {method:'get',path:'/api/admin/reports/social-destinations',operationId:'list_social_destinations',action:'destinations'},
    {method:'post',path:'/api/admin/reports/social-destinations',operationId:'create_social_destination',action:'createDestination'},
    {method:'patch',path:'/api/admin/reports/social-destinations/{id}',operationId:'update_social_destination',action:'updateDestination'},
    {method:'get',path:'/api/admin/reports/social-destinations/{id}/history',operationId:'list_social_destination_history',action:'destinationHistory'}
];
function validateId(req,res,next){
    if(!destinationId.safeParse(req.params.id).success)throw ApiError.validacao('Destinação inválida.');
    next();
}
export function reportRoutes(controller,{auth,limits}){
    const r=Router();
    const admin=[(req,res,next)=>{res.set('Cache-Control','no-store');next();},auth,allowRoles('ADMIN')];
    const queries={finance:financialQuery,social:financialQuery,audit:auditQuery,http:httpQuery,destinations:destinationPage,destinationHistory:destinationPage};
    for(const {method,path,action} of reportOperations){
        const handlers=[...admin];
        if(path.includes('{id}'))handlers.push(validateId);
        if(method==='get')handlers.push(query(queries[action],'reportQuery'));
        else handlers.push(...limits.checkout,validateBody(action==='createDestination'?destinationCreate:destinationUpdate));
        r[method](path.replace('{id}',':id'),...handlers,controller[action]);
    }
    return r;
}
