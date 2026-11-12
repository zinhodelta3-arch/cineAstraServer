const rows=async(c,sql,args)=>(await c.execute(sql,args))[0];
const one=async(c,sql,args)=>(await rows(c,sql,args))[0]??null;
const scope={ALL:'',ORDERS:' AND p.id_pedido IS NOT NULL',SUBSCRIPTIONS:' AND p.id_cobranca IS NOT NULL'};
const where=(scopeName)=>{if(!Object.hasOwn(scope,scopeName))throw new TypeError('Escopo inválido');return scope[scopeName];};
const fields='instituicao AS institution,categoria AS category,descricao AS description,finalidade AS purpose,recurso AS resource,CAST(valor AS CHAR) AS amount,referencia_contabil AS accountingReference,revisao AS revision';
const values=input=>[input.institution,input.category,input.description,input.purpose,input.resource,input.amount,input.accountingReference];
export function createReportModel(){return {
    destinations:(c,q)=>rows(c,`SELECT id_destinacao AS id,${fields} FROM destinacoes_sociais
        ${q.cursor?'WHERE id_destinacao<?':''} ORDER BY id_destinacao DESC LIMIT ?`,[...(q.cursor?[q.cursor]:[]),q.limit+1]),
    destination:(c,id,lock=false)=>one(c,`SELECT revisao FROM destinacoes_sociais WHERE id_destinacao=?${lock?' FOR UPDATE':''}`,[id]),
    async createDestination(c,input){
        const [result]=await c.execute('INSERT INTO destinacoes_sociais(instituicao,categoria,descricao,finalidade,recurso,valor,referencia_contabil) VALUES (?,?,?,?,?,?,?)',values(input));
        return String(result.insertId);
    },
    updateDestination:(c,id,input)=>c.execute('UPDATE destinacoes_sociais SET instituicao=?,categoria=?,descricao=?,finalidade=?,recurso=?,valor=?,referencia_contabil=?,revisao=revisao+1 WHERE id_destinacao=?',[...values(input),id]),
    recordDestination:(c,id,revision,adminId,input)=>c.execute('INSERT INTO destinacoes_sociais_historico(id_destinacao,revisao,id_admin,dados) VALUES (?,?,?,?)',[id,revision,adminId,JSON.stringify(input)]),
    destinationHistory:(c,id,q)=>rows(c,`SELECT revisao AS id,id_admin AS actorId,dados,registrado_em
        FROM destinacoes_sociais_historico WHERE id_destinacao=?${q.cursor?' AND revisao<?':''} ORDER BY revisao DESC LIMIT ?`,[id,...(q.cursor?[q.cursor]:[]),q.limit+1]),
    payments:(c,q,start,end)=>one(c,`SELECT COUNT(*) AS captures,COUNT(DISTINCT p.id_pedido) AS orders,COUNT(DISTINCT p.id_cobranca) AS charges,COALESCE(SUM(p.valor),0) AS gross FROM pagamentos p WHERE p.data_pagamento>=? AND p.data_pagamento<? AND p.status IN ('APROVADO','PARCIALMENTE_ESTORNADO','ESTORNADO')${where(q.scope)}`,[start,end]),
    refunds:(c,q,start,end)=>one(c,`SELECT COUNT(*) AS refunds,COALESCE(SUM(r.valor_confirmado),0) AS refunded FROM reembolso_solicitacoes r JOIN pagamentos p ON p.id_pagamento=r.id_pagamento WHERE r.respondido_em>=? AND r.respondido_em<? AND r.status='CONFIRMADA' AND r.valor_confirmado IS NOT NULL${where(q.scope)}`,[start,end]),
    costs:(c,start,end)=>one(c,`SELECT COUNT(DISTINCT pp.id_pedido) AS snapshot_orders,
      COALESCE(SUM(CASE WHEN j.cost IS NOT NULL AND j.quantity>0 THEN j.cost*j.quantity ELSE 0 END),0) AS known_cost,
      COALESCE(SUM(CASE WHEN j.cost IS NULL OR j.quantity IS NULL OR j.quantity<=0 THEN 1 ELSE 0 END),0) AS missing_cost_lines,
      COALESCE(SUM(CASE WHEN LOWER(j.below_margin) IN ('true','1') THEN 1 ELSE 0 END),0) AS margin_alert_lines,
      COALESCE(SUM(CASE WHEN LOWER(j.projected_below_margin) IN ('true','1') THEN 1 ELSE 0 END),0) AS projected_margin_alert_lines
      FROM (SELECT DISTINCT p.id_pedido FROM pagamentos p WHERE p.id_pedido IS NOT NULL AND p.data_pagamento>=? AND p.data_pagamento<? AND p.status IN ('APROVADO','PARCIALMENTE_ESTORNADO','ESTORNADO')) paid
      JOIN pedido_precificacao pp ON pp.id_pedido=paid.id_pedido LEFT JOIN JSON_TABLE(pp.snapshot,'$.lines[*]' COLUMNS(
        cost DECIMAL(10,2) PATH '$.cost' NULL ON EMPTY,
        quantity INT PATH '$.quantity' NULL ON EMPTY,
        below_margin VARCHAR(5) PATH '$.belowMargin' NULL ON EMPTY,
        projected_below_margin VARCHAR(5) PATH '$.projectedBelowMargin' NULL ON EMPTY
      )) j ON TRUE`,[start,end]),
    audit:(c,q,start,end)=>rows(c,`SELECT id_auditoria,id_usuario,aggregate_id,event_type,occurred_at,request_id FROM auditoria_eventos WHERE occurred_at>=? AND occurred_at<?${q.cursor?' AND id_auditoria<?':''}${q.actorId?' AND id_usuario=?':''}${q.eventType?' AND event_type=?':''} ORDER BY id_auditoria DESC LIMIT ?`,[start,end,...(q.cursor?[q.cursor]:[]),...(q.actorId?[q.actorId]:[]),...(q.eventType?[q.eventType]:[]),q.limit+1]),
    http:(c,q,start,end)=>rows(c,`SELECT id_log,id_usuario,rota,metodo,status_code,tempo_resposta_ms,data_hora FROM logs WHERE data_hora>=? AND data_hora<?${q.cursor?' AND id_log<?':''}${q.actorId?' AND id_usuario=?':''}${q.status?' AND status_code=?':''} ORDER BY id_log DESC LIMIT ?`,[start,end,...(q.cursor?[q.cursor]:[]),...(q.actorId?[q.actorId]:[]),...(q.status?[q.status]:[]),q.limit+1])
};}
