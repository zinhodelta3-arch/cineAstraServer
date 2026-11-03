export function createSalesModel() {
  const rows = async (c, sql, args) => (await c.execute(sql, args))[0];
  return {
    orders(c, q) {
      const where = [], args = [];
      if (q.cursor) { where.push('o.id_pedido < ?'); args.push(q.cursor); }
      if (q.status) { where.push('o.status = ?'); args.push(q.status); }
      if (q.userId) { where.push('o.id_usuario = ?'); args.push(q.userId); }
      args.push(q.limit + 1);
      return rows(c, `SELECT o.id_pedido,o.id_usuario,u.nome AS cliente,o.status,o.valor_total,o.data_pedido FROM pedidos o JOIN usuarios u ON u.id_usuario=o.id_usuario ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY o.id_pedido DESC LIMIT ?`, args);
    },
    payments(c, q) {
      const where = [], args = [];
      if (q.cursor) { where.push('p.id_pagamento < ?'); args.push(q.cursor); }
      if (q.status) { where.push('p.status = ?'); args.push(q.status); }
      if (q.userId) { where.push('m.id_usuario = ?'); args.push(q.userId); }
      if (q.orderId) { where.push('p.id_pedido = ?'); args.push(q.orderId); }
      args.push(q.limit + 1);
      return rows(c, `SELECT p.id_pagamento,p.id_pedido,p.id_cobranca,m.id_usuario,u.nome AS cliente,m.tipo AS metodo,p.valor,p.status,p.data_pagamento,i.criado_em FROM pagamentos p JOIN metodos_pagamento m ON m.id_metodo=p.id_metodo JOIN usuarios u ON u.id_usuario=m.id_usuario LEFT JOIN pagamento_intencoes i ON i.id_intencao=p.id_intencao ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY p.id_pagamento DESC LIMIT ?`, args);
    }
  };
}
