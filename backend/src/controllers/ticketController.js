import {success} from '../utils/dto.js';
const context=req=>({actor:req.usuario,signal:req.signal,requestId:req.res.locals.requestId});
export function createTicketController(service){return {
    owner:async(req,res)=>success(res,await service.ownerTickets(req.params.orderId,req.ticketPage,context(req))),
    session:async(req,res)=>success(res,await service.sessionTickets(req.params.sessionId,req.ticketPage,context(req))),
    seatMap:async(req,res)=>success(res,await service.seatMap(req.params.sessionId,context(req))),
    attendance:async(req,res)=>success(res,await service.attendance(req.params.sessionId,req.ticketPage,context(req))),
    customerTickets:async(req,res)=>success(res,await service.customerTickets(req.params.sessionId,req.customerQuery,context(req))),
    customerPassage:async(req,res)=>success(res,await service.customerPassage(req.params.sessionId,req.input,context(req))),
    pendingOrders:async(req,res)=>success(res,await service.pendingOrders(req.params.sessionId,req.ticketPage,context(req))),
    records:async(req,res)=>success(res,await service.sessionRecords(req.params.sessionId,req.params.section,req.ticketPage,context(req))),
    validate:async(req,res)=>success(res,await service.validate(req.input.code,context(req),req.input.sessionId)),
    consume:async(req,res)=>success(res,await service.consume(req.input.code,req.input.halfEvidenceType,context(req),req.input.sessionId)),
    exit:async(req,res)=>success(res,await service.exit(req.input.code,context(req),req.input.sessionId)),
    entry:async(req,res)=>success(res,await service.entry(req.input.code,req.input.halfEvidenceType,context(req),req.input.sessionId))
};}
