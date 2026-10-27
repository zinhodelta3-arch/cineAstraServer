import {Router} from 'express';
import {allowRoles} from '../middlewares/authMiddleware.js';
import {validateBody} from '../validators/identityValidators.js';
import {progressBody,progressEmpty,progressPage,progressParams} from '../validators/streamingProgressValidators.js';
export const streamingProgressOperations=[
    {method:'get',path:'/api/streaming/profiles/{profileId}/history',operationId:'list_profile_history',action:'history'},
    {method:'get',path:'/api/streaming/profiles/{profileId}/continue-watching',operationId:'list_profile_continue_watching',action:'continuing'},
    {method:'get',path:'/api/streaming/profiles/{profileId}/progress/{filmId}',operationId:'get_profile_progress',action:'get'},
    {method:'put',path:'/api/streaming/profiles/{profileId}/progress/{filmId}',operationId:'save_profile_progress',action:'save'},
    {method:'delete',path:'/api/streaming/profiles/{profileId}/progress/{filmId}',operationId:'remove_profile_progress',action:'remove'}
];
export function streamingProgressRoutes(controller,{auth,limits}){
    const router=Router();
    for(const r of streamingProgressOperations){
        const middleware=[(req,res,next)=>{res.set('Cache-Control','no-store');next();},auth,allowRoles('CLIENTE'),progressParams];
        if(['history','continuing'].includes(r.action))middleware.push(progressPage);
        if(r.method!=='get')middleware.push(...limits.streamingProgress,validateBody(r.action==='save'?progressBody:progressEmpty));
        router[r.method](r.path.replace(/\{(\w+)\}/g,':$1'),...middleware,controller[r.action]);
    }
    return router;
}
