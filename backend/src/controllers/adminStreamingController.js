import { success } from '../utils/dto.js';

export function createAdminStreamingController(service) {
  const context = (req,res) => ({
    actor: req.usuario, signal: req.signal, requestId: res.locals.requestId
  });
  return {
    list: kind => async (req, res) => success(res, await service.list(kind, req.adminStreamingQuery, context(req,res))),
    revoke: async (req,res) => {
      await service.revoke(req.params.accessId, context(req,res));
      res.sendStatus(204);
    }
  };
}
