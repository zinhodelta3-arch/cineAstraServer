import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { salesPage } from '../validators/salesValidators.js';

export const salesOperations = [
  { method: 'get', path: '/api/admin/sales/orders', operationId: 'list_admin_sales_orders' },
  { method: 'get', path: '/api/admin/sales/payments', operationId: 'list_admin_sales_payments' }
];

export function salesRoutes(controller, { auth }) {
  const router = Router();
  for (const kind of ['orders', 'payments']) router.get(`/api/admin/sales/${kind}`,
    (req, res, next) => { res.set('Cache-Control', 'no-store'); next(); },
    auth, allowRoles('ADMIN'), salesPage(kind), controller(kind));
  return router;
}
