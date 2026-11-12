import { Router } from 'express';
import { allowRoles } from '../middlewares/authMiddleware.js';
import { salesPage,salesId,salesDraft,salesDraftCreate,salesPaymentNote } from '../validators/salesValidators.js';
import { validateBody } from '../validators/identityValidators.js';

export const salesOperations = [
  { method: 'get', path: '/api/admin/sales/orders', operationId: 'list_admin_sales_orders' },
  { method: 'get', path: '/api/admin/sales/payments', operationId: 'list_admin_sales_payments' },
  { method:'post',path:'/api/admin/sales/orders',operationId:'create_admin_order_draft' },
  { method:'patch',path:'/api/admin/sales/orders/{id}',operationId:'update_admin_order_draft' },
  { method:'post',path:'/api/admin/sales/orders/{id}/cancel',operationId:'cancel_admin_order' },
  { method:'post',path:'/api/admin/sales/payments/{id}/reconcile',operationId:'reconcile_admin_payment' },
  { method:'get',path:'/api/admin/sales/payments/{id}/notes',operationId:'list_admin_payment_notes' },
  { method:'post',path:'/api/admin/sales/payments/{id}/notes',operationId:'add_admin_payment_note' }
];

export function salesRoutes(controller, { auth, limits }) {
  const router = Router();
  const admin=[(req,res,next)=>{res.set('Cache-Control','no-store');next();},auth,allowRoles('ADMIN')];
  const writes=[...admin,...limits.checkout];
  for (const kind of ['orders', 'payments']) router.get(`/api/admin/sales/${kind}`,...admin,salesPage(kind),controller.list(kind));
  router.post('/api/admin/sales/orders',...writes,validateBody(salesDraftCreate),controller.createDraft);
  router.patch('/api/admin/sales/orders/:id',...writes,salesId,validateBody(salesDraft),controller.updateDraft);
  router.post('/api/admin/sales/orders/:id/cancel',...writes,salesId,controller.cancel);
  router.post('/api/admin/sales/payments/:id/reconcile',...writes,salesId,controller.reconcile);
  router.get('/api/admin/sales/payments/:id/notes',...admin,salesId,controller.paymentNotes);
  router.post('/api/admin/sales/payments/:id/notes',...writes,salesId,validateBody(salesPaymentNote),controller.addPaymentNote);
  return router;
}
