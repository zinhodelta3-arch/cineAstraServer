import {Router} from 'express';
import {allowRoles} from '../middlewares/authMiddleware.js';
import {validateBody} from '../validators/identityValidators.js';
import {paymentKey} from '../validators/paymentValidators.js';
import {refundId,subscriptionId,refundSchemas,adminRefundPage} from '../validators/refundValidators.js';
export const refundOperations=[
    {method:'get',path:'/api/admin/refunds',operationId:'list_admin_refunds'},
    {method:'get',path:'/api/admin/refunds/{id}',operationId:'get_admin_refund'},
    {method:'post',path:'/api/payments/{id}/refunds',operationId:'request_refund'},
    {method:'get',path:'/api/refunds/{id}',operationId:'get_refund'},
    {method:'post',path:'/api/refunds/{id}/reconcile',operationId:'reconcile_refund'},
    {method:'post',path:'/api/admin/refunds/{id}/decision',operationId:'decide_refund'},
    {method:'post',path:'/api/subscriptions/{id}/cancel',operationId:'cancel_subscription'}
];
const noStore=(req,res,next)=>{res.set('Cache-Control','no-store');next();};
export function refundRoutes(controller,{auth,limits}){
    const r=Router(),client=[noStore,auth,allowRoles('CLIENTE')],admin=[noStore,auth,allowRoles('ADMIN')];
    r.get('/api/admin/refunds',...admin,adminRefundPage,controller.adminList);
    r.get('/api/admin/refunds/:id',...admin,refundId,controller.adminGet);
    r.post('/api/payments/:id/refunds',...client,...limits.checkout,refundId,paymentKey,validateBody(refundSchemas.request),controller.request);
    r.get('/api/refunds/:id',...client,refundId,controller.get);
    r.post('/api/refunds/:id/reconcile',...client,...limits.checkout,refundId,controller.reconcile);
    r.post('/api/admin/refunds/:id/decision',...admin,refundId,validateBody(refundSchemas.decision),controller.decide);
    r.post('/api/subscriptions/:id/cancel',...client,subscriptionId,controller.cancelPlan);
    return r;
}
