import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/identityValidators.js';
import { venueSchemas, venueQuery, venueParams } from '../validators/venueValidators.js';

const paths = {
    local: ['/api/locations', '/api/locations/{localId}'],
    room: ['/api/locations/{localId}/rooms', '/api/locations/{localId}/rooms/{roomId}'],
    seat: ['/api/locations/{localId}/rooms/{roomId}/seats', '/api/locations/{localId}/rooms/{roomId}/seats/{seatId}']
};
export const venueOperations = Object.entries(paths).flatMap(([kind, [collection, item]]) => [
    ...[false, true].flatMap(admin => [
        { method: 'get', path: admin ? collection.replace('/api/', '/api/admin/') : collection, operationId: `${admin ? 'admin_' : ''}list_${kind}s`, kind, action: 'list', admin },
        { method: 'get', path: admin ? item.replace('/api/', '/api/admin/') : item, operationId: `${admin ? 'admin_' : ''}get_${kind}`, kind, action: 'get', admin }
    ]),
    { method: 'post', path: collection.replace('/api/', '/api/admin/'), operationId: `create_${kind}`, kind, action: 'save', admin: true },
    { method: 'patch', path: item.replace('/api/', '/api/admin/'), operationId: `update_${kind}`, kind, action: 'save', admin: true },
    { method: 'delete', path: item.replace('/api/', '/api/admin/'), operationId: `archive_${kind}`, kind, action: 'archive', admin: true }
]);
export function venueRoutes(controller, { auth }) {
    const router = Router();
    const unitAccess = [(req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, auth, (req,res,next)=>allowRoles(...(req.method==='GET'?['SUPERVISOR','COLABORADOR']:['SUPERVISOR']))(req,res,next), venueParams];
    for (const [kind, collection, item] of [
        ['room', '/api/unit/locations/:localId/rooms', '/api/unit/locations/:localId/rooms/:roomId'],
        ['seat', '/api/unit/locations/:localId/rooms/:roomId/seats', '/api/unit/locations/:localId/rooms/:roomId/seats/:seatId']
    ]) {
        const query = kind === 'room' ? venueSchemas.adminRooms : venueSchemas.adminSeats;
        router.get(collection, ...unitAccess, venueQuery(query), controller.unitList(kind));
        router.get(item, ...unitAccess, controller.unitGet(kind));
        router.post(collection, ...unitAccess, validateBody(venueSchemas[kind]), controller.unitSave(kind));
        router.patch(item, ...unitAccess, validateBody(venueSchemas[`${kind}Patch`]), controller.unitSave(kind));
        router.delete(item, ...unitAccess, controller.unitArchive(kind));
    }
    for (const r of venueOperations) {
        const middleware = [(req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }];
        if (r.admin) middleware.push(auth, allowRoles('ADMIN'));
        middleware.push(venueParams);
        if (r.action === 'list') middleware.push(venueQuery(venueSchemas[r.kind === 'seat' ? r.admin ? 'adminSeats' : 'seats' : r.admin ? r.kind === 'local' ? 'adminLocals' : 'adminRooms' : 'list']));
        if (r.action === 'save') middleware.push(validateBody(venueSchemas[r.kind + (r.method === 'patch' ? 'Patch' : '')]));
        const handler = r.action === 'list' ? controller.list(r.kind, r.admin) : r.action === 'get' ? controller.get(r.kind, r.admin) : r.action === 'save' ? controller.save(r.kind) : controller.archive(r.kind);
        router[r.method](r.path.replace(/\{(\w+)\}/g, ':$1'), ...middleware, handler);
    }
    return router;
}
