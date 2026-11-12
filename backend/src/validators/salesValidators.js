import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';
import { orderBody } from './orderValidators.js';

const id = z.string().regex(/^[1-9]\d{0,19}$/).refine(value => BigInt(value) <= 18446744073709551615n);
const userId = z.string().regex(/^[1-9]\d{0,9}$/).refine(value => BigInt(value) <= 4294967295n);
const base = { limit: z.string().regex(/^[1-9]\d{0,2}$/).transform(Number).pipe(z.number().max(100)).default(20), cursor: id.optional(), userId: userId.optional() };
const orderQuery = z.object({ ...base, status: z.enum(['EM_ANDAMENTO', 'AGUARDANDO_PAGAMENTO', 'PAGO', 'CANCELADO', 'FINALIZADO']).optional() }).strict();
const paymentQuery = z.object({ ...base, status: z.enum(['PENDENTE', 'APROVADO', 'RECUSADO', 'PARCIALMENTE_ESTORNADO', 'ESTORNADO']).optional(), orderId: id.optional() }).strict();
export const salesDraft = orderBody.omit({ acceptance:true }).refine(draft => draft.lines.reduce((total,line)=>total+line.quantity,0)<=500);
export const salesDraftCreate = z.object({ userId, draft:salesDraft }).strict();
export const salesPaymentNote = z.object({ note:z.string().trim().min(1).max(1000) }).strict();
export function salesId(req,res,next) {
  if(!id.safeParse(req.params.id).success)throw ApiError.validacao('Identificador inválido.');
  next();
}

export function salesPage(kind) {
  return (req, res, next) => {
    const result = (kind === 'orders' ? orderQuery : paymentQuery).safeParse(req.query);
    if (!result.success) throw ApiError.validacao('Filtros ou paginação inválidos');
    req.salesQuery = result.data;
    next();
  };
}
