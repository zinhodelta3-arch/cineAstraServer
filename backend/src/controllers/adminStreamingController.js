import { success } from '../utils/dto.js';

export function createAdminStreamingController(service) {
  return kind => async (req, res) => success(res, await service.list(kind, req.adminStreamingQuery, {
    actor: req.usuario, signal: req.signal, requestId: res.locals.requestId
  }));
}
