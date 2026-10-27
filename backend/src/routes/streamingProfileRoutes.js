import {Router} from 'express';
import {allowRoles} from '../middlewares/authMiddleware.js';
import {validateBody} from '../validators/identityValidators.js';
import {streamingProfileId,streamingProfileSchemas} from '../validators/streamingProfileValidators.js';
export const streamingProfileOperations=[
    {method:'get',path:'/api/streaming/profiles',operationId:'list_streaming_profiles',action:'list'},
    {method:'post',path:'/api/streaming/profiles',operationId:'create_streaming_profile',action:'create'},
    {method:'get',path:'/api/streaming/profiles/{id}',operationId:'get_streaming_profile',action:'get'},
    {method:'patch',path:'/api/streaming/profiles/{id}',operationId:'update_streaming_profile',action:'patch'},
    {method:'delete',path:'/api/streaming/profiles/{id}',operationId:'delete_streaming_profile',action:'remove'},
    {method:'post',path:'/api/streaming/profiles/{id}/select',operationId:'select_streaming_profile',action:'select'}
];
export function streamingProfileRoutes(controller,{auth,limits}){
    const router=Router();
    for(const r of streamingProfileOperations){
        const middleware=[(req,res,next)=>{res.set('Cache-Control','no-store');next();},auth,allowRoles('CLIENTE')];
        if(r.path.includes('{id}'))middleware.push(streamingProfileId);
        if(r.method!=='get')middleware.push(...limits.checkout);
        if(streamingProfileSchemas[r.action])middleware.push(validateBody(streamingProfileSchemas[r.action]));
        router[r.method](r.path.replace('{id}',':id'),...middleware,controller[r.action]);
    }
    return router;
}
