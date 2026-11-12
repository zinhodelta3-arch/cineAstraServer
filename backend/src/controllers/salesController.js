import { success } from '../utils/dto.js';

export function createSalesController(service) {
  const context=(req,res)=>({actor:req.usuario,signal:req.signal,requestId:res.locals.requestId});
  return {
    list:kind=>async(req,res)=>success(res,await service.list(kind,req.salesQuery,context(req,res))),
    createDraft:async(req,res)=>success(res,await service.createDraft(req.input,context(req,res)),201),
    updateDraft:async(req,res)=>success(res,await service.updateDraft(req.params.id,req.input,context(req,res))),
    cancel:async(req,res)=>success(res,await service.cancel(req.params.id,context(req,res))),
    reconcile:async(req,res)=>success(res,await service.reconcile(req.params.id,context(req,res))),
    paymentNotes:async(req,res)=>success(res,await service.paymentNotes(req.params.id,context(req,res))),
    addPaymentNote:async(req,res)=>success(res,await service.addPaymentNote(req.params.id,req.input.note,context(req,res)),201)
  };
}
