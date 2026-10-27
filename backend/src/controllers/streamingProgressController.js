import {success} from '../utils/dto.js';
const context=req=>({actor:req.usuario,signal:req.signal,requestId:req.res.locals.requestId});
export function createStreamingProgressController(service){return {
    history:async(req,res)=>success(res,await service.list(req.params.profileId,req.progressPage,false,context(req))),
    continuing:async(req,res)=>success(res,await service.list(req.params.profileId,req.progressPage,true,context(req))),
    get:async(req,res)=>success(res,await service.get(req.params.profileId,req.params.filmId,context(req))),
    save:async(req,res)=>success(res,await service.save(req.params.profileId,req.params.filmId,req.input,context(req))),
    remove:async(req,res)=>{await service.remove(req.params.profileId,req.params.filmId,context(req));res.sendStatus(204);}
};}
