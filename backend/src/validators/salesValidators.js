import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';

const id = z.string().regex(/^[1-9]\d{0,19}$/).refine(value => BigInt(value) <= 18446744073709551615n);
const userId = z.string().regex(/^[1-9]\d{0,9}$/).refine(value => BigInt(value) <= 4294967295n);
const base = { limit: z.string().regex(/^[1-9]\d{0,2}$/).transform(Number).pipe(z.number().max(100)).default(20), cursor: id.optional(), userId: userId.optional() };
const orderQuery = z.object({ ...base, status: z.enum(['EM_ANDAMENTO', 'AGUARDANDO_PAGAMENTO', 'PAGO', 'CANCELADO', 'FINALIZADO']).optional() }).strict();
const paymentQuery = z.object({ ...base, status: z.enum(['PENDENTE', 'APROVADO', 'RECUSADO', 'PARCIALMENTE_ESTORNADO', 'ESTORNADO']).optional(), orderId: id.optional() }).strict();

export function salesPage(kind) {
  return (req, res, next) => {
    const result = (kind === 'orders' ? orderQuery : paymentQuery).safeParse(req.query);
    if (!result.success) throw ApiError.validacao('Filtros ou paginação inválidos');
    req.salesQuery = result.data;
    next();
  };
}
