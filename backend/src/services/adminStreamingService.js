import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';
import { instant } from './identityService.js';

const date = value => value == null ? null : new Date(instant(value)).toISOString();
const day = value => value == null ? null : value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);

export function createAdminStreamingService({ model, identity }) {
  async function list(kind, q, context) {
    return identity.transaction(async c => {
      if ((await identity.activeActor(c, context)).tipo_usuario !== 'ADMIN') throw ApiError.acessoNegado();
      const rows = await model[kind](c, q), page = rows.slice(0, q.limit);
      const items = page.map(row => kind === 'subscriptions' ? {
        id: idString(row.id_assinatura), userId: idString(row.id_usuario), customer: row.cliente,
        planId: idString(row.id_plano), plan: row.plano, startsOn: row.proposta_admin ? null : day(row.inicio), endsOn: day(row.fim),
        period: row.periodicidade, divisionMode: row.tipo_divisao, status: row.status,
        autoRenew: Boolean(row.renovacao_automatica), contractPrice: row.preco_contratado == null ? null : String(row.preco_contratado),
        administrativeDraft: Boolean(row.proposta_admin)
      } : {
        id: idString(row.id_acesso), userId: idString(row.id_usuario), customer: row.cliente,
        filmId: idString(row.id_filme), film: row.filme, itemId: idString(row.id_item),
        mode: row.tipo_streaming, startsAt: date(row.data_inicio), expiresAt: date(row.data_expiracao), status: row.status
      });
      return { items, pagination: { limit: q.limit, nextCursor: rows.length > q.limit ? idString(page.at(-1)[kind === 'subscriptions' ? 'id_assinatura' : 'id_acesso']) : null } };
    }, context);
  }
  return { list };
}
