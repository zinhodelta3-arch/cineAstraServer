import {Router} from 'express';
import {allowRoles} from '../middlewares/authMiddleware.js';
import {supportCreate,supportEdit,supportMessage,supportAssign,supportId,supportPage,supportHistoryPage,supportQueuePage} from '../validators/supportValidators.js';

export const supportOperations=[
    {method:'post',path:'/api/support',operationId:'create_support_request'},
    {method:'get',path:'/api/support',operationId:'list_own_support'},
    {method:'get',path:'/api/support/{id}',operationId:'get_support_request'},
    {method:'patch',path:'/api/support/{id}',operationId:'edit_own_support_request'},
    {method:'delete',path:'/api/support/{id}',operationId:'cancel_own_support_request'},
    {method:'get',path:'/api/support/{id}/messages',operationId:'support_message_history'},
    {method:'post',path:'/api/support/{id}/messages',operationId:'append_support_message'},
    {method:'post',path:'/api/support/{id}/close',operationId:'close_support_request'},
    {method:'get',path:'/api/admin/support',operationId:'admin_support_queue'},
    {method:'post',path:'/api/admin/support/{id}/assign',operationId:'assign_support_request'},
    {method:'post',path:'/api/admin/support/{id}/live/start',operationId:'start_support_live'},
    {method:'post',path:'/api/admin/support/{id}/live/end',operationId:'end_support_live'},
    {method:'post',path:'/api/admin/support/{id}/resolve',operationId:'resolve_support_request'}
];
export function supportRoutes(controller,{auth,limits}){const r=Router(),noStore=(req,res,next)=>{res.set('Cache-Control','no-store');next();},roles=['CLIENTE','SUPERVISOR','COLABORADOR','FORNECEDOR'],owner=[noStore,auth,allowRoles(...roles)],shared=[noStore,auth,allowRoles(...roles,'ADMIN')],supervisor=[noStore,auth,allowRoles('SUPERVISOR')],admin=[noStore,auth,allowRoles('ADMIN')];
    r.post('/api/support',...owner,...limits.checkout,supportCreate,controller.create);
    r.get('/api/support',...owner,supportPage,controller.ownList);
    r.get('/api/support/:id',...shared,supportId,controller.get);
    r.patch('/api/support/:id',...supervisor,supportId,supportEdit,controller.edit);
    r.delete('/api/support/:id',...supervisor,supportId,controller.cancel);
    r.get('/api/support/:id/messages',...shared,supportId,supportHistoryPage,controller.messages);
    r.post('/api/support/:id/messages',...shared,...limits.checkout,supportId,supportMessage,controller.message);
    r.post('/api/support/:id/close',...owner,supportId,controller.close);
    r.get('/api/admin/support',...admin,supportQueuePage,controller.adminQueue);
    r.post('/api/admin/support/:id/assign',...admin,supportId,supportAssign,controller.assign);
    r.post('/api/admin/support/:id/live/start',...admin,supportId,controller.startLive);
    r.post('/api/admin/support/:id/live/end',...admin,supportId,controller.endLive);
    r.post('/api/admin/support/:id/resolve',...admin,supportId,controller.resolve);
    return r;
}
