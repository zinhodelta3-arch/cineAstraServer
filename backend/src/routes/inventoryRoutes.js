import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/identityValidators.js';
import { inventoryParams, movementParams, inventoryQuery, inventorySchemas } from '../validators/inventoryValidators.js';

export const inventoryOperations = [
    { method: 'get', path: '/api/inventory/inputs/{id}', operationId: 'get_input_balance', action: 'balance', kind: 'inputs' },
    { method: 'get', path: '/api/inventory/equipment/{id}', operationId: 'get_equipment_balance', action: 'balance', kind: 'equipment' },
    { method: 'get', path: '/api/inventory/movements', operationId: 'list_inventory_movements', action: 'list' },
    { method: 'post', path: '/api/inventory/movements', operationId: 'create_inventory_movement', action: 'move' },
    { method:'patch',path:'/api/admin/inventory/movements/{id}',operationId:'correct_inventory_movement',action:'correct' },
    { method:'delete',path:'/api/admin/inventory/movements/{id}',operationId:'reverse_inventory_movement',action:'reverse' },
    { method: 'get', path: '/api/inventory/alerts', operationId: 'list_inventory_alerts', action: 'alerts' }
];
export function inventoryRoutes(controller,{ auth }) {
    const router = Router();
    const supervisor = [auth, allowRoles('SUPERVISOR')];
    for (const kind of ['inputs','combos']) {
        router.get(`/api/unit/snack-offers/${kind}`, ...supervisor, inventoryQuery(inventorySchemas.offerQuery), controller.offers(kind));
        router.patch(`/api/unit/snack-offers/${kind}/:id`, ...supervisor, inventoryParams, validateBody(inventorySchemas.offer), controller.offer(kind));
    }
    router.get('/api/unit/snack-offers/combos/:id/components', ...supervisor, inventoryParams, controller.components);
    router.patch('/api/unit/snack-offers/inputs/:id/stock', ...supervisor, inventoryParams, validateBody(inventorySchemas.adjustment), controller.adjustment);
    for (const r of inventoryOperations) {
        const admin=r.path.startsWith('/api/admin/');
        const middleware = [(req,res,next) => { res.set('Cache-Control','no-store'); next(); },auth,
            admin?allowRoles('ADMIN'):allowRoles('ADMIN','FORNECEDOR','SUPERVISOR','COLABORADOR')];
        if (r.path.includes('{id}')) middleware.push(admin?movementParams:inventoryParams);
        if (r.action === 'list' || r.action === 'alerts') middleware.push(inventoryQuery(r.action === 'list' ? inventorySchemas.movementsQuery : inventorySchemas.alertsQuery));
        if (r.action === 'move') middleware.push(validateBody(inventorySchemas.movement));
        if(admin) middleware.push(validateBody(inventorySchemas[r.action==='correct'?'correction':'reversal']));
        router[r.method](r.path.replace('{id}',':id'),...middleware,r.action === 'balance' ? controller.balance(r.kind) : controller[r.action]);
    }
    return router;
}
