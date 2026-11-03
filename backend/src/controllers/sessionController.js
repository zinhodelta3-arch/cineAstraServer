import { success } from '../utils/dto.js';
const context = req => ({ actor: req.usuario, signal: req.signal, requestId: req.res.locals.requestId });
export function createSessionController(service) {
    return {
        filmAvailability: async (req, res) => success(res, await service.filmAvailability(req.params.filmId)),
        availableDays: async (req, res) => success(res, await service.availableDays(req.params.filmId, req.query.localId)),
        list: admin => async (req, res) => success(res, await service.list(req.sessionQuery, admin)),
        seats: async (req,res) => success(res,await service.seats(req.params.id)),
        get: admin => async (req, res) => success(res, await service.get(req.params.id, admin)),
        unitList: async (req, res) => success(res, await service.unitList(req.sessionQuery, context(req))),
        unitGet: async (req, res) => success(res, await service.unitGet(req.params.id, context(req))),
        unitCreate: async (req, res) => success(res, await service.create(req.input, context(req), true), 201),
        unitPatch: async (req, res) => success(res, await service.patch(req.params.id, req.input, context(req), true)),
        unitCancel: async (req, res) => { await service.cancel(req.params.id, context(req), true); res.sendStatus(204); },
        async create(req, res) { const data = await service.create(req.input, context(req)); res.location(`/api/admin/sessions/${data.id_sessao}`); success(res, data, 201); },
        async patch(req, res) { success(res, await service.patch(req.params.id, req.input, context(req))); },
        async cancel(req, res) { await service.cancel(req.params.id, context(req)); res.sendStatus(204); }
    };
}
