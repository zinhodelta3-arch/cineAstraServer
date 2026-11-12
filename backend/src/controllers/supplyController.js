import { success } from '../utils/dto.js';
const context=req=>({actor:req.usuario,signal:req.signal,requestId:req.res.locals.requestId});
export function createSupplyController(service){return {
    inputLinks:async(req,res)=>success(res,await service.inputLinks(req.supplyQuery,context(req))),
    saveInputLink:async(req,res)=>success(res,await service.saveInputLink(req.input,context(req))),
    removeInputLink:async(req,res)=>{await service.removeInputLink(req.params.id,context(req));res.status(204).end();},
    logisticsRoutes:async(req,res)=>success(res,await service.logisticsRoutes(req.supplyQuery,context(req))),
    createLogisticsRoute:async(req,res)=>success(res,await service.createLogisticsRoute(req.input,context(req)),201),
    patchLogisticsRoute:async(req,res)=>success(res,await service.patchLogisticsRoute(req.params.id,req.input,context(req))),
    sources:async(req,res)=>success(res,await service.sources(req.supplyQuery,context(req))),
    stock:async(req,res)=>success(res,await service.stock(req.supplyQuery,context(req))),
    requests:async(req,res)=>success(res,await service.requests(req.supplyQuery,context(req))),
    request:async(req,res)=>success(res,await service.request(req.params.id,context(req))),
    alternatives:async(req,res)=>success(res,await service.alternatives(req.params.id,context(req))),
    createRequest:async(req,res)=>success(res,await service.createRequest(req.input,context(req)),201),
    review:async(req,res)=>success(res,await service.review(req.params.id,req.input.decision,context(req))),
    approve:async(req,res)=>success(res,await service.decide(req.params.id,'APROVADA',context(req))),
    refuse:async(req,res)=>success(res,await service.decide(req.params.id,'RECUSADA',context(req))),
    shipments:async(req,res)=>success(res,await service.shipments(req.supplyQuery,context(req))),
    shipment:async(req,res)=>success(res,await service.shipment(req.params.id,context(req))),
    send:async(req,res)=>success(res,await service.transitionShipment(req.params.id,'send',context(req),req.input)),
    history:async(req,res)=>success(res,await service.history(req.params.id,req.supplyQuery,context(req))),
    incident:async(req,res)=>success(res,await service.reportIncident(req.params.id,req.input,context(req)),201),
    transit:async(req,res)=>success(res,await service.transitionShipment(req.params.id,'transit',context(req))),
    receive:async(req,res)=>success(res,await service.transitionShipment(req.params.id,'receive',context(req))),
    returnEquipment:async(req,res)=>success(res,await service.returnEquipment(req.params.id,context(req))),
    cancel:async(req,res)=>success(res,await service.transitionShipment(req.params.id,'cancel',context(req)))
};}
