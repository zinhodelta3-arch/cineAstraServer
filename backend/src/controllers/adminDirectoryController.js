import {success} from '../utils/dto.js';
const context=req=>({actor:req.usuario,signal:req.signal,requestId:req.res.locals.requestId});
export function createAdminDirectoryController(service){return {
 users:async(req,res)=>success(res,await service.users(req.directoryQuery,context(req))),
 privacy:async(req,res)=>success(res,await service.privacy(req.directoryQuery,context(req)))
};}
