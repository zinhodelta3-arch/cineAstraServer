import {success} from '../utils/dto.js';
export function createPromotionalController(service){return r=>async(req,res)=>{
 const ctx={actor:req.usuario,signal:req.signal,requestId:res.locals.requestId},p=req.promo;
 const data=r.action==='list'?await service.list(r.kind,p.query,r.admin,ctx):r.action==='get'?await service.get(r.kind,p.id,r.admin,ctx):r.action==='create'?await service.create(r.kind,p.input,ctx):await service.patch(r.kind,p.id,p.input,ctx);
 return success(res,data,r.action==='create'?201:200);
};}
