import {Router} from 'express';
import {snackParams,snackQuery} from '../validators/snackCatalogValidators.js';
export const snackCatalogOperations=[
    {method:'get',path:'/api/locations/{localId}/snacks',operationId:'list_public_snacks',action:'list'},
    {method:'get',path:'/api/locations/{localId}/snacks/{id}',operationId:'get_public_snack',action:'get'}
];
export function snackCatalogRoutes(controller){
    const router=Router();
    for(const r of snackCatalogOperations){
        const middleware=[(req,res,next)=>{res.set('Cache-Control','no-store');next();},snackParams];
        if(r.action==='list')middleware.push(snackQuery);
        router.get(r.path.replace(/\{(\w+)\}/g,':$1'),...middleware,controller[r.action]);
    }
    return router;
}
