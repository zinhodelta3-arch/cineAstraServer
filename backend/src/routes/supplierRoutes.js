import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/identityValidators.js';
import { supplierParams, supplierQuery, supplierSchemas } from '../validators/supplierValidators.js';

export const supplierOperations = [
    { method:'get', path:'/api/admin/supplier-companies',operationId:'list_supplier_companies',action:'companies',admin:true },
    { method:'post', path:'/api/admin/supplier-companies',operationId:'create_supplier_company',action:'companyCreate',admin:true },
    { method:'patch', path:'/api/admin/supplier-companies/{id}',operationId:'update_supplier_company',action:'companyPatch',admin:true },
    { method: 'get', path: '/api/admin/suppliers', operationId: 'list_suppliers', action: 'list', admin: true },
    { method: 'post', path: '/api/admin/suppliers', operationId: 'create_supplier', action: 'create', admin: true },
    { method: 'get', path: '/api/admin/suppliers/{id}', operationId: 'get_supplier', action: 'get', admin: true },
    { method: 'patch', path: '/api/admin/suppliers/{id}', operationId: 'update_supplier', action: 'patch', admin: true },
    { method: 'delete', path: '/api/admin/suppliers/{id}', operationId: 'archive_supplier', action: 'archive', admin: true },
    { method: 'get', path: '/api/suppliers/me', operationId: 'my_supplier', action: 'me', admin: false }
];
export function supplierRoutes(controller, { auth }) {
    const router = Router();
    for (const r of supplierOperations) {
        const middleware = [(req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, auth, allowRoles(r.admin ? 'ADMIN' : 'FORNECEDOR')];
        if (r.path.includes('{id}')) middleware.push(supplierParams);
        if (r.action === 'list' || r.action==='companies') middleware.push(supplierQuery(supplierSchemas[r.action==='list'?'query':'companyQuery']));
        if (['create','patch','companyCreate','companyPatch'].includes(r.action)) middleware.push(validateBody(supplierSchemas[r.action]));
        router[r.method](r.path.replace(/\{(\w+)\}/g, ':$1'), ...middleware, controller[r.action]);
    }
    return router;
}
