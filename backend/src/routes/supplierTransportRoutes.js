import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/identityValidators.js';
import { supplierTransportSchemas,supplierTransportQuery,supplierTransportParams } from '../validators/supplierTransportValidators.js';

export function supplierTransportRoutes(controller,{auth}) {
    const router=Router(),base='/api/suppliers/me/transports';
    router.use(base,(req,res,next)=>{res.set('Cache-Control','no-store');next();},auth,allowRoles('FORNECEDOR'));
    router.get(base,supplierTransportQuery,controller.list);
    router.post(base,validateBody(supplierTransportSchemas.create),controller.create);
    router.get(`${base}/:id`,supplierTransportParams,controller.get);
    router.patch(`${base}/:id`,supplierTransportParams,validateBody(supplierTransportSchemas.patch),controller.patch);
    router.delete(`${base}/:id`,supplierTransportParams,controller.archive);
    return router;
}
