import { success } from '../utils/dto.js';
const context=req=>({actor:req.usuario,signal:req.signal,requestId:req.res.locals.requestId});
export function createOrderController(service,checkout,contracts,counter,purchaseDocuments){return {
    counterCatalog:async(req,res)=>success(res,await counter.catalog(req.params.sessionId,context(req))),
    counterCustomers:async(req,res)=>success(res,await counter.customers(req.params.sessionId,req.customerQuery,context(req))),
    counterQuote:async(req,res)=>success(res,await counter.quote(req.params.sessionId,req.input,context(req))),
    counterSale:async(req,res)=>success(res,await counter.sell(req.params.sessionId,req.input,req.paymentKey,context(req)),201),
    list:async(req,res)=>success(res,await service.list(req.orderPage,context(req))),
    draft:async(req,res)=>success(res,await service.draft(req.params.orderId,context(req))),
    status:async(req,res)=>success(res,await service.status(req.params.orderId,context(req))),
    purchaseDocument:async(req,res)=>success(res,await purchaseDocuments.document(req.params.orderId,context(req))),
    verifyPurchaseDocument:async(req,res)=>success(res,await purchaseDocuments.verify(req.query.reference,context(req))),
    quote:async(req,res)=>{const actorContext=context(req);const quote=await service.quote(req.input,actorContext);return success(res,contracts?{...quote,contract:await contracts.preview(req.input,quote,actorContext)}:quote);},
    checkout:async(req,res)=>success(res,await checkout.checkout(req.input,req.paymentKey,context(req)),201),
    cancel:async(req,res)=>success(res,await checkout.cancel(req.params.orderId,req.paymentKey,context(req)))
};}
