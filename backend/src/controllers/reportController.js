import {success} from '../utils/dto.js';
const context=req=>({actor:req.usuario,signal:req.signal,requestId:req.res.locals.requestId});
export function createReportController(service){return {
    destinations:async(req,res)=>success(res,await service.destinations(req.reportQuery,context(req))),
    createDestination:async(req,res)=>success(res,await service.createDestination(req.input,context(req)),201),
    updateDestination:async(req,res)=>success(res,await service.updateDestination(req.params.id,req.input,context(req))),
    destinationHistory:async(req,res)=>success(res,await service.destinationHistory(req.params.id,req.reportQuery,context(req))),
    finance:async(req,res)=>success(res,await service.finance(req.reportQuery,context(req))),
    social:async(req,res)=>success(res,await service.socialAllocation(req.reportQuery,context(req))),
    audit:async(req,res)=>success(res,await service.audit(req.reportQuery,context(req))),
    http:async(req,res)=>success(res,await service.http(req.reportQuery,context(req)))
};}
