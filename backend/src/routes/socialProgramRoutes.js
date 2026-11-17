import { Router } from 'express';
import { z } from 'zod';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { ApiError } from '../utils/ApiError.js';
import { success } from '../utils/dto.js';

const id = z.string().regex(/^[1-9]\d{0,19}$/).refine(value => BigInt(value) <= 18446744073709551615n);
const proofUrl = z.url({ protocol: /^https$/ }).max(2048).refine(value => {
    const url = new URL(value);
    return !url.username && !url.password;
}).nullable();
const publish = z.object({
    month: z.string().regex(/^20\d{2}-(0[1-9]|1[0-2])$/), destinationId: id, proofUrl: proofUrl.optional()
}).strict();
const proof = z.object({ proofUrl }).strict();
const paging = z.object({ limit: z.coerce.number().int().min(1).max(100).default(20), cursor: id.optional() }).strict();
const input = (schema, body) => {
    const result = schema.safeParse(body);
    if (!result.success) throw ApiError.validacao('Confira os dados da iniciativa.');
    return result.data;
};
export const socialProgramOperations = [
    { method: 'get', path: '/api/social-destinations', operationId: 'list_public_social_initiatives' },
    { method: 'get', path: '/api/admin/reports/social-initiatives', operationId: 'list_admin_social_initiatives' },
    { method: 'post', path: '/api/admin/reports/social-initiatives', operationId: 'publish_social_initiative' },
    { method: 'patch', path: '/api/admin/reports/social-initiatives/{id}', operationId: 'update_social_initiative_proof' },
];

export function socialProgramRoutes(service, { auth }) {
    const router = Router();
    const context = req => ({ actor: req.usuario, signal: req.signal, requestId: req.res.locals.requestId });
    const noStore = (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); };
    router.get('/api/social-destinations', noStore, async (req, res) => success(res, await service.list(input(paging, req.query))));
    router.get('/api/admin/reports/social-initiatives', noStore, auth, allowRoles('ADMIN'), async (req, res) =>
        success(res, await service.list(input(paging, req.query), true)));
    router.post('/api/admin/reports/social-initiatives', noStore, auth, allowRoles('ADMIN'), async (req, res) =>
        success(res, await service.publish(input(publish, req.body), context(req)), 201));
    router.patch('/api/admin/reports/social-initiatives/:id', noStore, auth, allowRoles('ADMIN'), async (req, res) =>
        success(res, await service.proof(input(id, req.params.id), input(proof, req.body).proofUrl, context(req))));
    return router;
}
