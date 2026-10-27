import {success} from '../utils/dto.js';
const context=req=>({actor:req.usuario,signal:req.signal,requestId:req.res.locals.requestId});
export function createStreamingFavoriteController(service){return {
    list:async(req,res)=>success(res,await service.list(req.params.profileId,req.favoritePage,context(req))),
    add:async(req,res)=>{await service.add(req.params.profileId,req.params.filmId,context(req));res.sendStatus(204);},
    remove:async(req,res)=>{await service.remove(req.params.profileId,req.params.filmId,context(req));res.sendStatus(204);}
};}
