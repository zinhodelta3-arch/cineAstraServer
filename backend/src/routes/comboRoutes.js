import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/identityValidators.js';
import { comboParams, comboQuery, comboSchemas, adminComboQuery } from '../validators/comboValidators.js';

export const comboOperations = [
    { method: 'get', path: '/api/admin/combos', operationId: 'list_admin_combos', action: 'adminList', admin: true },
    { method: 'get', path: '/api/combos', operationId: 'list_combos', action: 'list' },
    { method: 'get', path: '/api/combos/{id}', operationId: 'get_combo', action: 'get' },
    { method: 'get', path: '/api/admin/combos/{id}', operationId: 'get_admin_combo', action: 'adminGet', admin: true },
    { method: 'post', path: '/api/admin/combos', operationId: 'create_combo', action: 'create', admin: true },
    { method: 'patch', path: '/api/admin/combos/{id}', operationId: 'update_combo', action: 'patch', admin: true },
    { method: 'put', path: '/api/admin/combos/{id}/items', operationId: 'replace_combo_items', action: 'replace', admin: true },
    { method: 'delete', path: '/api/admin/combos/{id}', operationId: 'archive_combo', action: 'archive', admin: true }
];
export function comboRoutes(controller, { auth }) {
    const router = Router();
    const unitAccess = [(req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, auth, (req,res,next)=>allowRoles(...(req.method==='GET'?['SUPERVISOR','COLABORADOR']:['SUPERVISOR']))(req,res,next)];
    router.get('/api/unit/combos', ...unitAccess, adminComboQuery, controller.unitList);
    router.get('/api/unit/combos/:id', ...unitAccess, comboParams, controller.unitGet);
    router.post('/api/unit/combos', ...unitAccess, validateBody(comboSchemas.create), controller.unitCreate);
    router.patch('/api/unit/combos/:id', ...unitAccess, comboParams, validateBody(comboSchemas.patch), controller.unitPatch);
    router.put('/api/unit/combos/:id/items', ...unitAccess, comboParams, validateBody(comboSchemas.composition), controller.unitReplace);
    router.delete('/api/unit/combos/:id', ...unitAccess, comboParams, controller.unitArchive);
    for (const r of comboOperations) {
        const middleware = [(req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }];
        if (r.admin) middleware.push(auth, allowRoles('ADMIN'));
        if (r.path.includes('{id}')) middleware.push(comboParams);
        if (r.action === 'list') middleware.push(comboQuery);
        if (r.action === 'adminList') middleware.push(adminComboQuery);
        if (['create','patch','replace'].includes(r.action)) middleware.push(validateBody(comboSchemas[r.action === 'replace' ? 'composition' : r.action]));
        router[r.method](r.path.replace('{id}', ':id'), ...middleware, controller[r.action]);
    }
    return router;
}
