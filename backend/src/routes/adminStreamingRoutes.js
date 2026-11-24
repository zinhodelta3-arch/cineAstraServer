import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { adminAccessId, adminStreamingPage } from '../validators/adminStreamingValidators.js';

export const adminStreamingOperations = [
  { method: 'get', path: '/api/admin/streaming/subscriptions', operationId: 'list_admin_streaming_subscriptions' },
  { method: 'get', path: '/api/admin/streaming/accesses', operationId: 'list_admin_streaming_accesses' },
  { method: 'delete', path: '/api/admin/streaming/accesses/{accessId}', operationId: 'revoke_admin_streaming_access' }
];

export function adminStreamingRoutes(controller, { auth }) {
  const router = Router();
  for (const kind of ['subscriptions', 'accesses']) router.get(`/api/admin/streaming/${kind}`,
    (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); },
    auth, allowRoles('ADMIN'), adminStreamingPage(kind), controller.list(kind));
  router.delete('/api/admin/streaming/accesses/:accessId',auth,allowRoles('ADMIN'),adminAccessId,controller.revoke);
  return router;
}
