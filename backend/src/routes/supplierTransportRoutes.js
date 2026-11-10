import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/identityValidators.js';
import { supplierTransportSchemas,supplierTransportQuery,supplierTransportParams } from '../validators/supplierTransportValidators.js';

const base='/api/suppliers/me/transports';
export const supplierTransportOperations=[
    ['get',base,'list_supplier_transports','list'],
    ['post',base,'create_supplier_transport','create'],
    ['get',`${base}/{id}`,'get_supplier_transport','get'],
    ['patch',`${base}/{id}`,'update_supplier_transport','patch'],
    ['delete',`${base}/{id}`,'archive_supplier_transport','archive']
].map(([method,path,operationId,action])=>({method,path,operationId,action}));

export function supplierTransportRoutes(controller,{auth}) {
    const router=Router();
    router.use(base,(req,res,next)=>{res.set('Cache-Control','no-store');next();},auth,allowRoles('FORNECEDOR'));
    const middleware={
        list:[supplierTransportQuery],
        create:[validateBody(supplierTransportSchemas.create)],
        get:[supplierTransportParams],
        patch:[supplierTransportParams,validateBody(supplierTransportSchemas.patch)],
        archive:[supplierTransportParams]
    };
    for(const {method,path,action} of supplierTransportOperations) {
        router[method](path.replace('{id}',':id'),...middleware[action],controller[action]);
    }
    return router;
}
