import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/identityValidators.js';
import { orderBody,checkoutBody,orderCancelBody,orderPage,counterQuoteBody,counterSaleBody,counterCustomerQuery } from '../validators/orderValidators.js';
import { paymentKey } from '../validators/paymentValidators.js';
import { ticketIdParam } from '../validators/ticketValidators.js';
export const orderOperations=[
    {method:'get',path:'/api/orders',operationId:'list_own_orders',action:'list'},
    {method:'get',path:'/api/orders/verification',operationId:'verify_purchase_document',action:'verifyPurchaseDocument'},
    {method:'get',path:'/api/orders/{orderId}/purchase-document',operationId:'get_purchase_document',action:'purchaseDocument'},
    {method:'get',path:'/api/orders/{orderId}',operationId:'get_order_status',action:'status'},
    {method:'get',path:'/api/orders/{orderId}/draft',operationId:'get_own_admin_order_draft',action:'draft'},
    {method:'post',path:'/api/orders/quote',operationId:'quote_order',action:'quote'},
    {method:'post',path:'/api/orders/checkout',operationId:'checkout_order',action:'checkout'},
    {method:'post',path:'/api/orders/{orderId}/cancel',operationId:'cancel_order',action:'cancel'}
];
const counterPath='/api/unit/sessions/{sessionId}/counter';
export const counterOrderOperations=[
    {method:'get',path:counterPath,operationId:'counter_catalog',action:'counterCatalog',middleware:()=>[]},
    {method:'get',path:`${counterPath}/customers`,operationId:'counter_customers',action:'counterCustomers',middleware:()=>[counterCustomerQuery]},
    {method:'post',path:`${counterPath}/quote`,operationId:'counter_quote',action:'counterQuote',middleware:limits=>[...limits.checkout,validateBody(counterQuoteBody)]},
    {method:'post',path:`${counterPath}/orders`,operationId:'counter_sale',action:'counterSale',middleware:limits=>[...limits.checkout,paymentKey,validateBody(counterSaleBody)]},
];
export function orderRoutes(controller,{auth,limits}){
    const router=Router();
    const counter=[(req,res,next)=>{res.set('Cache-Control','no-store');next();},auth,allowRoles('COLABORADOR'),ticketIdParam];
    for(const r of counterOrderOperations){
        router[r.method](r.path.replace('{sessionId}',':sessionId'),...counter,...r.middleware(limits),controller[r.action]);
    }
    for(const r of orderOperations){
    const middleware=[(req,res,next)=>{res.set('Cache-Control','no-store');next();},auth,allowRoles('CLIENTE')];
    if(r.action==='checkout'||r.action==='cancel')middleware.push(...limits.checkout,paymentKey);
    if(['status','cancel','draft','purchaseDocument'].includes(r.action))middleware.push(ticketIdParam);
    if(r.action==='list')middleware.push(orderPage);
    else if(r.action==='cancel')middleware.push(validateBody(orderCancelBody));
    else if(r.action==='checkout')middleware.push(validateBody(checkoutBody));
    else if(r.action==='quote')middleware.push(validateBody(orderBody));
    router[r.method](r.path.replace(/\{(\w+)\}/g,':$1'),...middleware,controller[r.action]);
}return router;}
