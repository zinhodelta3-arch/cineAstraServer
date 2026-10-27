import {success} from '../utils/dto.js';
const context=req=>({actor:req.usuario,signal:req.signal,requestId:req.res.locals.requestId});
export function createStreamingProfileController(service){return {
    list:async(req,res)=>success(res,await service.list(context(req))),
    get:async(req,res)=>success(res,await service.get(req.params.id,context(req))),
    create:async(req,res)=>{const data=await service.create(req.input,context(req));res.location(`/api/streaming/profiles/${data.id}`);return success(res,data,201);},
    patch:async(req,res)=>success(res,await service.patch(req.params.id,req.input,context(req))),
    remove:async(req,res)=>{await service.remove(req.params.id,context(req));res.sendStatus(204);},
    select:async(req,res)=>success(res,await service.select(req.params.id,context(req)))
};}
