import { Router } from 'express';
import { z } from 'zod';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { ApiError } from '../utils/ApiError.js';
import { success } from '../utils/dto.js';

const id = z.string().regex(/^[1-9]\d{0,9}$/).refine(value => Number(value) <= 4294967295);
const date = z.iso.date().refine(value => value >= new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }));
const statuses = z.enum(['RECEBIDA', 'EM_ANALISE', 'PROPOSTA_ENVIADA', 'CONCLUIDA', 'CANCELADA']);
const create = z.object({
    experienceId: id, date, guests: z.number().int().min(1).max(100000),
    time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
    details: z.string().trim().min(10).max(4000), preferences: z.string().trim().max(1000).optional()
}).strict();
const message = z.object({ message: z.string().trim().min(1).max(4000) }).strict();
const update = z.object({ status: statuses.optional(), locationId: id.optional(), supervisorId: id.optional() })
    .strict().refine(value => Object.keys(value).length > 0);
const page = z.object({ cursor: id.optional() }).strict();
export const experienceRequestOperations = [
    { method: 'get', path: '/api/experience-requests', operationId: 'list_experience_requests' },
    { method: 'post', path: '/api/experience-requests', operationId: 'create_experience_request' },
    { method: 'get', path: '/api/experience-requests/{id}', operationId: 'get_experience_request' },
    { method: 'patch', path: '/api/experience-requests/{id}', operationId: 'update_experience_request' },
    { method: 'post', path: '/api/experience-requests/{id}/messages', operationId: 'message_experience_request' }
];
const read = (schema, value) => {
    const parsed = schema.safeParse(value);
    if (!parsed.success) throw ApiError.validacao('Confira os dados da solicitação de experiência.');
    return parsed.data;
};

export function experienceRequestRoutes(service, { auth, limits }) {
    const router = Router();
    const privateRoute = (req, res, next) => { res.set('Cache-Control', 'private, no-store'); next(); };
    const access = [privateRoute, auth, allowRoles('CLIENTE', 'ADMIN', 'SUPERVISOR')];
    const context = req => ({ actor: req.usuario, signal: req.signal, requestId: req.res.locals.requestId });
    const root = '/api/experience-requests';
    router.get(root, ...access, async (req, res) => success(res, await service.list(read(page, req.query).cursor, context(req))));
    router.post(root, ...access, allowRoles('CLIENTE'), ...limits.checkout, async (req, res) =>
        success(res, await service.create(read(create, req.body), context(req)), 201));
    router.get(root + '/:id', ...access, async (req, res) =>
        success(res, await service.get(read(id, req.params.id), read(page, req.query).cursor, context(req))));
    router.post(root + '/:id/messages', ...access, ...limits.checkout, async (req, res) =>
        success(res, await service.message(read(id, req.params.id), read(message, req.body).message, context(req)), 201));
    router.patch(root + '/:id', ...access, allowRoles('ADMIN', 'SUPERVISOR'), ...limits.checkout, async (req, res) =>
        success(res, await service.update(read(id, req.params.id), read(update, req.body), context(req))));
    return router;
}
