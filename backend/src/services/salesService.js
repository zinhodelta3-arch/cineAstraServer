import { ApiError } from '../utils/ApiError.js';
import { idString } from '../utils/dto.js';
import { instant } from './identityService.js';

const date = value => value == null ? null : new Date(instant(value)).toISOString();
const page = (rows, q, key, map) => {
  const items = rows.slice(0, q.limit);
  return { items: items.map(map), pagination: { limit: q.limit, nextCursor: rows.length > q.limit ? idString(items.at(-1)[key]) : null } };
};

export function createSalesService({ model, identity }) {
  async function list(kind, q, context) {
    return identity.transaction(async c => {
      if ((await identity.activeActor(c, context)).tipo_usuario !== 'ADMIN') throw ApiError.acessoNegado();
      if (kind === 'orders') return page(await model.orders(c, q), q, 'id_pedido', row => ({
        id: idString(row.id_pedido), userId: idString(row.id_usuario), customer: row.cliente,
        status: row.status, total: String(row.valor_total), createdAt: date(row.data_pedido)
      }));
      return page(await model.payments(c, q), q, 'id_pagamento', row => ({
        id: idString(row.id_pagamento), orderId: row.id_pedido == null ? null : idString(row.id_pedido),
        chargeId: row.id_cobranca == null ? null : idString(row.id_cobranca), userId: idString(row.id_usuario),
        customer: row.cliente, method: row.metodo, amount: String(row.valor), status: row.status,
        createdAt: date(row.criado_em ?? row.data_pagamento), paidAt: date(row.data_pagamento)
      }));
    }, context);
  }
  return { list };
}
