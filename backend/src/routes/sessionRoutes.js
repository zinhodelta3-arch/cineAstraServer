import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/identityValidators.js';
import { sessionSchemas, sessionQuery, sessionParams } from '../validators/sessionValidators.js';
import { catalogId } from '../validators/catalogValidators.js';
import { ApiError } from '../utils/ApiError.js';

export const sessionOperations = [
    { method: 'get', path: '/api/sessions/{id}/seats', operationId: 'session_seat_availability', action: 'seats', admin: false },
    { method: 'get', path: '/api/sessions', operationId: 'list_sessions', action: 'list', admin: false },
    { method: 'get', path: '/api/sessions/{id}', operationId: 'get_session', action: 'get', admin: false },
    { method: 'get', path: '/api/admin/sessions', operationId: 'admin_list_sessions', action: 'list', admin: true },
    { method: 'get', path: '/api/admin/sessions/{id}', operationId: 'admin_get_session', action: 'get', admin: true },
    { method: 'post', path: '/api/admin/sessions', operationId: 'create_session', action: 'create', admin: true },
    { method: 'patch', path: '/api/admin/sessions/{id}', operationId: 'update_session', action: 'patch', admin: true },
    { method: 'delete', path: '/api/admin/sessions/{id}', operationId: 'cancel_session', action: 'cancel', admin: true },
    { method: 'post', path: '/api/admin/sessions/{id}/archive', operationId: 'archive_session', action: 'archive', admin: true }
];
export const unitSessionOperations = [
    { method:'get', path:'/api/unit/sessions', action:'unitList', operationId:'unit_list_sessions', query:'adminQuery' },
    { method:'get', path:'/api/unit/sessions/{id}', action:'unitGet', operationId:'unit_get_session' },
    { method:'post', path:'/api/unit/sessions', action:'unitCreate', operationId:'unit_create_session', body:'unitCreate' },
    { method:'patch', path:'/api/unit/sessions/{id}', action:'unitPatch', operationId:'unit_update_session', body:'patch' },
    { method:'delete', path:'/api/unit/sessions/{id}', action:'unitCancel', operationId:'unit_cancel_session' },
    { method:'post', path:'/api/unit/sessions/{id}/archive', action:'unitArchive', operationId:'unit_archive_session' },
    { method:'get', path:'/api/unit/film-offers', action:'unitFilmOffers', operationId:'unit_list_film_offers', query:'offerQuery' },
    { method:'post', path:'/api/unit/film-offers', action:'addUnitFilmOffer', operationId:'unit_post_film_offer', body:'offerCreate' },
    { method:'patch', path:'/api/unit/film-offers/{id}', action:'editUnitFilmOffer', operationId:'unit_patch_film_offer', body:'offerPatch' },
    { method:'delete', path:'/api/unit/film-offers/{id}', action:'removeUnitFilmOffer', operationId:'unit_delete_film_offer' }
];
export function sessionRoutes(controller, { auth }) {
    const router = Router();
    const unitAccess = [(req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, auth, (req,res,next)=>allowRoles(...(req.method==='GET'?['SUPERVISOR','COLABORADOR']:['SUPERVISOR']))(req,res,next), sessionParams];
    for (const r of unitSessionOperations) {
        const middleware = [...unitAccess];
        if (r.query) middleware.push(sessionQuery(sessionSchemas[r.query]));
        if (r.body) middleware.push(validateBody(sessionSchemas[r.body]));
        router[r.method](r.path.replace('{id}', ':id'), ...middleware, controller[r.action]);
    }
    router.get('/api/films/:filmId/availability', (req, res, next) => {
        if (!catalogId.safeParse(req.params.filmId).success || Object.keys(req.query).length) throw ApiError.validacao('Filtros inválidos');
        res.set('Cache-Control', 'no-store'); next();
    }, controller.filmAvailability);
    router.get('/api/films/:filmId/available-days', (req, res, next) => {
        if (!catalogId.safeParse(req.params.filmId).success || !catalogId.safeParse(req.query.localId).success || Object.keys(req.query).length !== 1) throw ApiError.validacao('Filtros inválidos');
        res.set('Cache-Control', 'no-store'); next();
    }, controller.availableDays);
    for (const r of sessionOperations) {
        const middleware = [(req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }];
        if (r.admin) middleware.push(auth, allowRoles('ADMIN'));
        middleware.push(sessionParams);
        if (r.action === 'list') middleware.push(sessionQuery(sessionSchemas[r.admin ? 'adminQuery' : 'query']));
        if (r.action === 'create' || r.action === 'patch') middleware.push(validateBody(sessionSchemas[r.action]));
        const handler = r.action === 'list' ? controller.list(r.admin) : r.action === 'get' ? controller.get(r.admin) : controller[r.action];
        router[r.method](r.path.replace(/\{(\w+)\}/g, ':$1'), ...middleware, handler);
    }
    return router;
}
