import {Router} from 'express';
import {allowRoles} from '../middlewares/authMiddleware.js';
import {validateDashboard} from '../validators/dashboardValidators.js';
export const dashboardOperations=[{method:'get',path:'/api/admin/reports/dashboard',operationId:'admin_dashboard_report'}];
export function dashboardRoutes(controller,{auth}){const r=Router();r.get(dashboardOperations[0].path,(req,res,next)=>{res.set('Cache-Control','no-store');next();},auth,allowRoles('ADMIN'),validateDashboard,controller);return r;}
