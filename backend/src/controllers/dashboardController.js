import {success} from '../utils/dto.js';
export const createDashboardController=service=>async(req,res)=>success(res,await service.get(req.dashboardQuery,{actor:req.usuario,signal:req.signal,requestId:res.locals.requestId}));
