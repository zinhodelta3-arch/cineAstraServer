const namePattern = value => `%${value.replace(/[!%_]/g, char => `!${char}`)}%`;

const archiveTables = {
  orders: ['pedidos','id_pedido'],
  payments: ['pagamentos','id_pagamento'],
  refunds: ['reembolso_solicitacoes','id_reembolso'],
};

export function createSalesModel() {
  const rows = async (c, sql, args) => (await c.execute(sql, args))[0];
  const one = async (c, sql, args) => (await rows(c,sql,args))[0]??null;
  return {
    customer:(c,id)=>one(c,"SELECT id_usuario FROM usuarios WHERE id_usuario=? AND tipo_usuario='CLIENTE' AND status='ATIVO' FOR UPDATE",[id]),
    async createDraft(c,userId,draft){
      const [result]=await c.execute("INSERT INTO pedidos(id_usuario,status,proposta_admin) VALUES(?,'EM_ANDAMENTO',?)",[userId,JSON.stringify(draft)]);
      return String(result.insertId);
    },
    order:(c,id)=>one(c,'SELECT id_pedido,id_usuario,status,proposta_admin,valor_total,checkout_expira_em,arquivado_admin_em FROM pedidos WHERE id_pedido=? FOR UPDATE',[id]),
    archivedRecord(c,kind,id){
      const [table,key]=archiveTables[kind];
      return one(c,`SELECT status,arquivado_admin_em FROM ${table} WHERE ${key}=? FOR UPDATE`,[id]);
    },
    archive(c,kind,id){
      const [table,key]=archiveTables[kind];
      return c.execute(`UPDATE ${table} SET arquivado_admin_em=UTC_TIMESTAMP(3) WHERE ${key}=? AND arquivado_admin_em IS NULL`,[id]);
    },
    simulatedPixByKey:(c,owner,key)=>one(c,`SELECT i.id_pedido,p.id_pagamento,p.status,p.valor
      FROM pagamento_intencoes i JOIN pagamentos p ON p.id_intencao=i.id_intencao
      WHERE i.id_usuario=? AND i.chave_idempotencia=? AND i.provider='simulado' FOR UPDATE`,[owner,key]),
    unsettledIntent:(c,orderId)=>one(c,`SELECT id_intencao FROM pagamento_intencoes WHERE id_pedido=?
      AND estado IN ('PREPARADA','ENVIADA') LIMIT 1 FOR UPDATE`,[orderId]),
    blockingPayment:(c,orderId)=>one(c,`SELECT id_pagamento FROM pagamentos WHERE id_pedido=?
      AND status<>'RECUSADO' LIMIT 1 FOR UPDATE`,[orderId]),
    updateDraft:(c,id,draft)=>c.execute('UPDATE pedidos SET proposta_admin=? WHERE id_pedido=?',[JSON.stringify(draft),id]),
    cancelDraft:(c,id,adminId,reason)=>c.execute("UPDATE pedidos SET status='CANCELADO',cancelado_por_admin=?,motivo_cancelamento_admin=? WHERE id_pedido=?",[adminId,reason,id]),
    payment:(c,id)=>one(c,'SELECT id_pagamento FROM pagamentos WHERE id_pagamento=? FOR UPDATE',[id]),
    paymentNotes:(c,id)=>rows(c,'SELECT id_nota,id_admin,nota,criado_em FROM pagamento_notas_admin WHERE id_pagamento=? ORDER BY id_nota DESC LIMIT 20',[id]),
    addPaymentNote:(c,id,adminId,note)=>c.execute('INSERT INTO pagamento_notas_admin(id_pagamento,id_admin,nota) VALUES(?,?,?)',[id,adminId,note]),
    orders(c, q) {
      const where = [], args = [];
      if (q.cursor) { where.push('o.id_pedido < ?'); args.push(q.cursor); }
      if (q.orderId) { where.push('o.id_pedido = ?'); args.push(q.orderId); }
      if (q.visibility) where.push(q.visibility==='archived'?'o.arquivado_admin_em IS NOT NULL':'o.arquivado_admin_em IS NULL');
      if (q.status) { where.push('o.status = ?'); args.push(q.status); }
      if (q.userId) { where.push('o.id_usuario = ?'); args.push(q.userId); }
      if (q.customerName) { where.push("u.nome LIKE ? ESCAPE '!'"); args.push(namePattern(q.customerName)); }
      args.push(q.limit + 1);
      return rows(c, `SELECT o.id_pedido,o.id_usuario,u.nome AS cliente,o.status,o.valor_total,o.data_pedido,o.proposta_admin,o.checkout_expira_em,
        o.cancelado_por_admin,o.motivo_cancelamento_admin,o.arquivado_admin_em FROM pedidos o JOIN usuarios u ON u.id_usuario=o.id_usuario
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY o.id_pedido DESC LIMIT ?`, args);
    },
    payments(c, q) {
      const where = [], args = [];
      if (q.cursor) { where.push('p.id_pagamento < ?'); args.push(q.cursor); }
      if (q.status) { where.push('p.status = ?'); args.push(q.status); }
      if (q.userId) { where.push('m.id_usuario = ?'); args.push(q.userId); }
      if (q.customerName) { where.push("u.nome LIKE ? ESCAPE '!'"); args.push(namePattern(q.customerName)); }
      if (q.orderId) { where.push('p.id_pedido = ?'); args.push(q.orderId); }
      if (q.visibility) where.push(q.visibility==='archived'?'p.arquivado_admin_em IS NOT NULL':'p.arquivado_admin_em IS NULL');
      args.push(q.limit + 1);
      return rows(c, `SELECT p.id_pagamento,p.id_pedido,p.id_cobranca,m.id_usuario,u.nome AS cliente,m.tipo AS metodo,p.valor,p.status,p.data_pagamento,i.criado_em,i.provider,p.arquivado_admin_em FROM pagamentos p JOIN metodos_pagamento m ON m.id_metodo=p.id_metodo JOIN usuarios u ON u.id_usuario=m.id_usuario LEFT JOIN pagamento_intencoes i ON i.id_intencao=p.id_intencao ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY p.id_pagamento DESC LIMIT ?`, args);
    }
  };
}
