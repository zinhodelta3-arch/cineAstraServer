import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/identityValidators.js';
import { venueSchemas, venueQuery, venueParams } from '../validators/venueValidators.js';
import { catalogReference } from '../utils/catalogSlug.js';
import { ApiError } from '../utils/ApiError.js';
import { roomScene } from '../validators/roomScene.js';

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
export const roomLayoutOperations=['admin','unit'].flatMap(area=>[
    {method:'get',suffix:'seat-map',action:'layout',operationId:`${area}_get_room_seat_map`},
    {method:'patch',suffix:'seat-map',action:'moveSeats',schema:'seatPositions',operationId:`${area}_move_room_seats`},
    {method:'post',suffix:'seats/batch',action:'batchSeats',schema:'seatBatch',operationId:`${area}_create_seats_batch`}
].map(route=>({...route,area,path:`/api/${area}/locations/{localId}/rooms/{roomId}/${route.suffix}`})));
export const roomSceneOperations=[
    {method:'get',path:'/api/locations/{localId}/rooms/{roomId}/scene',operationId:'get_public_room_scene'},
    {method:'patch',path:'/api/admin/locations/{localId}/rooms/{roomId}/scene',operationId:'admin_publish_room_scene'},
    {method:'patch',path:'/api/unit/locations/{localId}/rooms/{roomId}/scene',operationId:'unit_publish_room_scene'}
];
export function venueRoutes(controller, { auth }) {
    const router = Router();
    const unitAccess = [(req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, auth, (req,res,next)=>allowRoles(...(req.method==='GET'?['SUPERVISOR','COLABORADOR']:['SUPERVISOR']))(req,res,next), venueParams];
    router.get('/api/locations/:localId/rooms/:roomId/scene', unitAccess[0], venueParams, controller.publicRoomScene);
    router.patch('/api/admin/locations/:localId/rooms/:roomId/scene', unitAccess[0], auth, allowRoles('ADMIN'), venueParams, validateBody(roomScene), controller.publishRoomScene(false));
    router.patch('/api/unit/locations/:localId/rooms/:roomId/scene', ...unitAccess, validateBody(roomScene), controller.publishRoomScene(true));
    for(const route of roomLayoutOperations){
        const unit=route.area==='unit';
        const middleware=unit?[...unitAccess]:[unitAccess[0],auth,allowRoles('ADMIN'),venueParams];
        if(route.schema)middleware.push(validateBody(venueSchemas[route.schema]));
        router[route.method](route.path.replace(/\{(\w+)\}/g,':$1'),...middleware,controller[route.action](unit));
    }
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
        middleware.push(r.operationId === 'get_local' ? (req, res, next) => {
            if (!catalogReference(req.params.localId)) throw ApiError.validacao('Link do cinema inválido');
            next();
        } : venueParams);
        if (r.action === 'list') {
            const schema = r.kind === 'local' ? (r.admin ? 'adminLocals' : 'publicLocals')
                : r.kind === 'seat' ? (r.admin ? 'adminSeats' : 'seats')
                    : (r.admin ? 'adminRooms' : 'list');
            middleware.push(venueQuery(venueSchemas[schema]));
        }
        if (r.action === 'save') middleware.push(validateBody(venueSchemas[r.kind + (r.method === 'patch' ? 'Patch' : '')]));
        const handler = r.action === 'list' ? controller.list(r.kind, r.admin) : r.action === 'get' ? controller.get(r.kind, r.admin) : r.action === 'save' ? controller.save(r.kind) : controller.archive(r.kind);
        router[r.method](r.path.replace(/\{(\w+)\}/g, ':$1'), ...middleware, handler);
    }
    return router;
}
