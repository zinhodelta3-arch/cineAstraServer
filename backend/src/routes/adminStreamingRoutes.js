import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { adminStreamingPage } from '../validators/adminStreamingValidators.js';

export const adminStreamingOperations = [
  { method: 'get', path: '/api/admin/streaming/subscriptions', operationId: 'list_admin_streaming_subscriptions' },
  { method: 'get', path: '/api/admin/streaming/accesses', operationId: 'list_admin_streaming_accesses' }
];

export function adminStreamingRoutes(controller, { auth }) {
  const router = Router();
  for (const kind of ['subscriptions', 'accesses']) router.get(`/api/admin/streaming/${kind}`,
    (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); },
    auth, allowRoles('ADMIN'), adminStreamingPage(kind), controller(kind));
  return router;
}
