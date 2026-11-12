import { Router } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { validateBody } from '../validators/identityValidators.js';
import { teamSchemas, teamParams, teamQuery } from '../validators/teamValidators.js';

export const teamLookupOperations = [
    { method: 'get', path: '/api/teams/context', operationId: 'get_team_context' },
    { method: 'get', path: '/api/teams/collaborator', operationId: 'find_team_collaborator' },
    { method: 'get', path: '/api/teams/available', operationId: 'list_available_teams' },
    { method: 'get', path: '/api/teams/my-requests', operationId: 'list_my_team_requests' }
];

export const teamOperations = [
    ['get','/api/teams','list_teams','list'],
    ['get','/api/teams/{id}','get_team','get'],
    ['post','/api/teams','create_team','create'],
    ['patch','/api/teams/{id}','update_team','patch'],
    ['delete','/api/teams/{id}','cancel_team','archive'],
    ['get','/api/teams/{id}/members','list_team_members','members'],
    ['patch','/api/teams/{id}/members/{memberId}','update_team_member','changeMember'],
    ['delete','/api/teams/{id}/members/{memberId}','remove_team_member','removeMember'],
    ['get','/api/teams/{id}/entries','list_team_entries','entries'],
    ['post','/api/teams/{id}/entries/requests','request_team_entry','request'],
    ['post','/api/teams/{id}/entries/invitations','invite_team_member','invitation'],
    ['post','/api/teams/{id}/entries/{entryId}/decision','decide_team_entry','decision'],
    ['delete','/api/teams/{id}/entries/{entryId}','cancel_team_entry','cancelEntry']
].map(([method,path,operationId,action]) => ({ method,path,operationId,action }));
export function teamRoutes(controller, { auth }) {
    const router = Router(), access = [auth, allowRoles('ADMIN','SUPERVISOR','COLABORADOR')];
    const [context, collaborator, available, ownRequests] = teamLookupOperations;
    const noStore = (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); };
    router.get(context.path, noStore, auth, allowRoles('SUPERVISOR','COLABORADOR'), controller.context);
    router.get(available.path, noStore, auth, allowRoles('COLABORADOR'), teamQuery(teamSchemas.teamsQuery), controller.available);
    router.get(ownRequests.path, noStore, auth, allowRoles('COLABORADOR'), teamQuery(teamSchemas.entriesQuery), controller.ownRequests);
    router.get(collaborator.path, auth, allowRoles('SUPERVISOR'), (req, res, next) => {
        if (Object.keys(req.query).length !== 1 || typeof req.query.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.query.email) || req.query.email.length > 150) {
            throw ApiError.validacao('Informe um e-mail válido.', [{ field: 'query.email', code: 'INVALID_VALUE' }]);
        }
        res.set('Cache-Control', 'no-store'); next();
    }, controller.collaborator);
    for (const r of teamOperations) {
        const middleware = [(req, res, next) => { res.set('Cache-Control', 'no-store'); next(); }, ...access, teamParams];
        if (['list','members','entries'].includes(r.action)) middleware.push(teamQuery(teamSchemas[r.action === 'list' ? 'teamsQuery' : r.action === 'members' ? 'membersQuery' : 'entriesQuery']));
        const body = { create: 'create', patch: 'patch', changeMember: 'memberPatch', request: 'request', invitation: 'invitation', decision: 'decision' }[r.action];
        if (body) middleware.push(validateBody(teamSchemas[body]));
        router[r.method](r.path.replace(/\{(\w+)\}/g, ':$1'), ...middleware, controller[r.action]);
    }
    return router;
}
