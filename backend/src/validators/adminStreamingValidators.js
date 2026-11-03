import { z } from 'zod';
import { ApiError } from '../utils/ApiError.js';

const small = z.string().regex(/^[1-9]\d{0,9}$/).refine(value => BigInt(value) <= 4294967295n);
const big = z.string().regex(/^[1-9]\d{0,19}$/).refine(value => BigInt(value) <= 18446744073709551615n);
const base = { limit: z.string().regex(/^[1-9]\d{0,2}$/).transform(Number).pipe(z.number().max(100)).default(20), userId: small.optional() };
const subscriptions = z.object({ ...base, cursor: small.optional(), planId: small.optional(), status: z.enum(['ATIVA', 'CANCELADA', 'EXPIRADA', 'PENDENTE']).optional() }).strict();
const accesses = z.object({ ...base, cursor: big.optional(), filmId: small.optional(), status: z.enum(['ATIVO', 'EXPIRADO', 'REVOGADO']).optional() }).strict();

export function adminStreamingPage(kind) {
  return (req, res, next) => {
    const parsed = (kind === 'subscriptions' ? subscriptions : accesses).safeParse(req.query);
    if (!parsed.success) throw ApiError.validacao('Filtros ou paginação inválidos');
    req.adminStreamingQuery = parsed.data;
    next();
  };
}
