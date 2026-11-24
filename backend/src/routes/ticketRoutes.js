import {Router} from 'express';
import {allowRoles} from '../middlewares/authMiddleware.js';
import {validateBody} from '../validators/identityValidators.js';
import {ticketValidationBody,ticketConsumeBody,ticketIdParam,ticketPage,sessionTicketPage,customerPassageBody,sessionRecordSection} from '../validators/ticketValidators.js';
import {counterCustomerQuery} from '../validators/orderValidators.js';

export const ticketOperations=[
    {method:'get',path:'/api/orders/{orderId}/tickets',operationId:'list_order_tickets'},
    {method:'get',path:'/api/sessions/{sessionId}/tickets',operationId:'list_session_tickets'},
    {method:'get',path:'/api/sessions/{sessionId}/seat-map',operationId:'staff_session_seat_map'},
    {method:'get',path:'/api/sessions/{sessionId}/attendance',operationId:'list_session_attendance'},
    {method:'get',path:'/api/sessions/{sessionId}/attendance/tickets',operationId:'find_attendance_tickets'},
    {method:'post',path:'/api/sessions/{sessionId}/attendance/passages',operationId:'register_customer_passage'},
    {method:'get',path:'/api/sessions/{sessionId}/pending-orders',operationId:'list_session_pending_orders'},
    {method:'get',path:'/api/sessions/{sessionId}/details/{section}',operationId:'list_session_records'},
    {method:'post',path:'/api/tickets/validate',operationId:'validate_ticket'},
    {method:'post',path:'/api/tickets/consume',operationId:'consume_ticket'},
    {method:'post',path:'/api/tickets/exit',operationId:'exit_ticket'},
    {method:'post',path:'/api/tickets/entry',operationId:'reenter_ticket'}
];
const noStore=(req,res,next)=>{res.set('Cache-Control','no-store');next();};
export function ticketRoutes(controller,{auth,limits}){
    const router=Router(),staff=[noStore,auth,allowRoles('ADMIN','SUPERVISOR','COLABORADOR')];
    router.get('/api/orders/:orderId/tickets',noStore,auth,allowRoles('CLIENTE'),ticketIdParam,ticketPage,controller.owner);
    router.get('/api/sessions/:sessionId/tickets',...staff,ticketIdParam,sessionTicketPage,controller.session);
    router.get('/api/sessions/:sessionId/seat-map',...staff,ticketIdParam,controller.seatMap);
    router.get('/api/sessions/:sessionId/attendance',...staff,ticketIdParam,ticketPage,controller.attendance);
    router.get('/api/sessions/:sessionId/attendance/tickets',noStore,auth,allowRoles('SUPERVISOR'),ticketIdParam,counterCustomerQuery,controller.customerTickets);
    router.post('/api/sessions/:sessionId/attendance/passages',noStore,auth,allowRoles('SUPERVISOR'),ticketIdParam,...limits.checkout,validateBody(customerPassageBody),controller.customerPassage);
    router.get('/api/sessions/:sessionId/pending-orders',...staff,ticketIdParam,ticketPage,controller.pendingOrders);
    router.get('/api/sessions/:sessionId/details/:section',...staff,ticketIdParam,sessionRecordSection,ticketPage,controller.records);
    router.post('/api/tickets/validate',...staff,...limits.checkout,validateBody(ticketValidationBody),controller.validate);
    router.post('/api/tickets/consume',...staff,...limits.checkout,validateBody(ticketConsumeBody),controller.consume);
    router.post('/api/tickets/exit',...staff,...limits.checkout,validateBody(ticketValidationBody),controller.exit);
    router.post('/api/tickets/entry',...staff,...limits.checkout,validateBody(ticketConsumeBody),controller.entry);
    return router;
}
