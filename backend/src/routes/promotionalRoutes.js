import {Router} from 'express';
import {allowRoles} from '../middlewares/authMiddleware.js';
import {promotionalValidation} from '../validators/promotionalValidators.js';
export const promotionalOperations=['partners','experiences','banners'].flatMap(kind=>[
 ...[false,true].flatMap(admin=>['list','get'].map(action=>({kind,admin,action,method:'get',path:`/api/${admin?'admin/':''}${kind}${action==='get'?'/{id}':''}`,operationId:`${admin?'admin_':''}${action}_${kind}`}))),
 ...['create','patch'].map(action=>({kind,admin:true,action,method:action==='create'?'post':'patch',path:`/api/admin/${kind}${action==='patch'?'/{id}':''}`,operationId:`${action}_${kind}`}))
]);
export function promotionalRoutes(controller,{auth}){const router=Router();for(const r of promotionalOperations)router[r.method](r.path.replace('{id}',':id'),(req,res,next)=>{res.set('Cache-Control','no-store');next();},...(r.admin?[auth,allowRoles('ADMIN')]:[]),promotionalValidation(r),controller(r));return router;}
