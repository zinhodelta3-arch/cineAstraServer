import {Router} from 'express';
import {allowRoles} from '../middlewares/authMiddleware.js';
import {validateBody} from '../validators/identityValidators.js';
import {favoriteBody,favoriteParams,favoritePage} from '../validators/streamingFavoriteValidators.js';
export const streamingFavoriteOperations=[
    {method:'get',path:'/api/streaming/profiles/{profileId}/favorites',operationId:'list_profile_favorites',action:'list'},
    {method:'put',path:'/api/streaming/profiles/{profileId}/favorites/{filmId}',operationId:'add_profile_favorite',action:'add'},
    {method:'delete',path:'/api/streaming/profiles/{profileId}/favorites/{filmId}',operationId:'remove_profile_favorite',action:'remove'}
];
export function streamingFavoriteRoutes(controller,{auth,limits}){
    const router=Router();
    for(const r of streamingFavoriteOperations){
        const middleware=[(req,res,next)=>{res.set('Cache-Control','no-store');next();},auth,allowRoles('CLIENTE'),favoriteParams];
        if(r.action==='list')middleware.push(favoritePage);
        else middleware.push(...limits.checkout,validateBody(favoriteBody));
        router[r.method](r.path.replace(/\{(\w+)\}/g,':$1'),...middleware,controller[r.action]);
    }
    return router;
}
