import {Router} from 'express';
import {allowRoles} from '../middlewares/authMiddleware.js';
import {adminDirectoryQuery} from '../validators/adminDirectoryValidators.js';
export const adminDirectoryOperations=[
 {method:'get',path:'/api/admin/users',operationId:'list_admin_users',action:'users'},
 {method:'get',path:'/api/admin/privacy-requests',operationId:'list_admin_privacy_requests',action:'privacy'}
];
export function adminDirectoryRoutes(controller,{auth}){
 const router=Router();
 for(const r of adminDirectoryOperations)router.get(r.path,(req,res,next)=>{res.set('Cache-Control','no-store');next();},auth,allowRoles('ADMIN'),adminDirectoryQuery(r.action),controller[r.action]);
 return router;
}
