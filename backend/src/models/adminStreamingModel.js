export function createAdminStreamingModel() {
  const rows = async (c, sql, args) => (await c.execute(sql, args))[0];
  return {
    subscriptions(c, q) {
      const where = [], args = [];
      if (q.cursor) { where.push('a.id_assinatura < ?'); args.push(q.cursor); }
      if (q.status) { where.push('a.status = ?'); args.push(q.status); }
      if (q.userId) { where.push('a.id_usuario = ?'); args.push(q.userId); }
      if (q.planId) { where.push('a.id_plano = ?'); args.push(q.planId); }
      args.push(q.limit + 1);
      return rows(c, `SELECT a.id_assinatura,a.id_usuario,u.nome AS cliente,a.id_plano,p.nome AS plano,a.inicio,a.fim,a.periodicidade,a.tipo_divisao,a.status,a.renovacao_automatica,a.preco_contratado,
        IF(a.status='PENDENTE' AND JSON_UNQUOTE(JSON_EXTRACT(a.contrato_snapshot,'$.administrativeDraft'))='true',1,0) AS proposta_admin
        FROM assinaturas a JOIN usuarios u ON u.id_usuario=a.id_usuario JOIN planos p ON p.id_plano=a.id_plano
        ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY a.id_assinatura DESC LIMIT ?`, args);
    },
    accesses(c, q) {
      const where = [], args = [];
      const status = "CASE WHEN a.status='ATIVO' AND a.data_expiracao<=UTC_TIMESTAMP() THEN 'EXPIRADO' ELSE a.status END";
      if (q.cursor) { where.push('a.id_acesso < ?'); args.push(q.cursor); }
      if (q.status) { where.push(`${status} = ?`); args.push(q.status); }
      if (q.userId) { where.push('a.id_usuario = ?'); args.push(q.userId); }
      if (q.filmId) { where.push('a.id_filme = ?'); args.push(q.filmId); }
      args.push(q.limit + 1);
      return rows(c, `SELECT a.id_acesso,a.id_usuario,u.nome AS cliente,a.id_filme,f.titulo AS filme,a.id_item,i.tipo_streaming,a.data_inicio,a.data_expiracao,${status} AS status FROM acessos_streaming a JOIN usuarios u ON u.id_usuario=a.id_usuario JOIN filmes f ON f.id_filme=a.id_filme JOIN itens_pedido i ON i.id_item=a.id_item ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY a.id_acesso DESC LIMIT ?`, args);
    }
  };
}
