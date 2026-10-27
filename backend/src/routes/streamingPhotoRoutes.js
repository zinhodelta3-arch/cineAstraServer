import {Router} from 'express';
import {allowRoles} from '../middlewares/authMiddleware.js';
import {streamingProfileId} from '../validators/streamingProfileValidators.js';
export const streamingPhotoOperations=[{method:'put',action:'upload'},{method:'get',action:'read'},{method:'delete',action:'remove'}].map(r=>({...r,path:'/api/streaming/profiles/{id}/photo',operationId:r.action+'_streaming_profile_photo'}));
export function streamingPhotoRoutes(controller,{auth,limits}){const router=Router();for(const r of streamingPhotoOperations)router[r.method](r.path.replace('{id}',':id'),(req,res,next)=>{res.set('Cache-Control','private, no-store');next();},auth,allowRoles('CLIENTE'),streamingProfileId,...(r.method==='get'?[]:limits.upload),controller[r.action]);return router;}
