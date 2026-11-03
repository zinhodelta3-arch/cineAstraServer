import { success } from '../utils/dto.js';

export function createSalesController(service) {
  return kind => async (req, res) => success(res, await service.list(kind, req.salesQuery, {
    actor: req.usuario, signal: req.signal, requestId: res.locals.requestId
  }));
}
