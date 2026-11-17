import {idString} from '../utils/dto.js';

export function createRefundModel(database){
    const rows=async(c,sql,args=[])=> (await c.execute(sql,args))[0];
    const one=async(c,sql,args=[])=> (await rows(c,sql,args))[0]??null;
    const paymentSql='SELECT p.id_pagamento,p.id_pedido,p.id_cobranca,p.id_metodo,p.valor,p.status,p.transacao_id,COALESCE(i.id_usuario,o.id_usuario,ac.id_usuario) AS id_usuario,i.provider,i.provider_ref,o.data_pedido,a.inicio AS assinatura_inicio,a.periodicidade,a.status AS assinatura_status FROM pagamentos p LEFT JOIN pagamento_intencoes i ON i.id_intencao=p.id_intencao LEFT JOIN pedidos o ON o.id_pedido=p.id_pedido LEFT JOIN assinatura_cobrancas ac ON ac.id_cobranca=p.id_cobranca LEFT JOIN assinaturas a ON a.id_assinatura=ac.id_assinatura WHERE p.id_pagamento=?';
    const refundSql='SELECT r.id_reembolso,r.id_pagamento,r.id_usuario,r.chave_idempotencia,r.motivo,r.detalhes,r.dentro_prazo,r.termos_versao,r.valor_solicitado,r.valor_confirmado,r.status,r.provider_ref,r.compensacao_status,r.solicitado_em,r.prazo_resposta_em,r.respondido_em,p.valor AS pagamento_valor,p.status AS pagamento_status,p.transacao_id,p.id_pedido,p.id_cobranca,i.provider AS pagamento_provider,i.provider_ref AS pagamento_provider_ref FROM reembolso_solicitacoes r JOIN pagamentos p ON p.id_pagamento=r.id_pagamento LEFT JOIN pagamento_intencoes i ON i.id_intencao=p.id_intencao WHERE r.id_reembolso=?';
    const adminFields='r.id_reembolso,r.id_pagamento,r.id_usuario,r.motivo,r.dentro_prazo,r.valor_solicitado,r.valor_confirmado,r.status,r.compensacao_status,r.solicitado_em,r.prazo_resposta_em,r.respondido_em,p.id_pedido,p.id_cobranca,p.valor AS pagamento_valor,p.status AS pagamento_status';
    const adminFrom=' FROM reembolso_solicitacoes r JOIN pagamentos p ON p.id_pagamento=r.id_pagamento';
    return {
        order:(c,id)=>one(c,'SELECT id_pedido,id_usuario,status FROM pedidos WHERE id_pedido=?',[id]),
        orderPayment:(c,id)=>one(c,`SELECT p.id_pagamento FROM pagamentos p JOIN pagamento_intencoes i ON i.id_intencao=p.id_intencao
            WHERE p.id_pedido=? AND p.status IN ('APROVADO','PARCIALMENTE_ESTORNADO') AND i.provider IS NOT NULL
            ORDER BY p.id_pagamento DESC LIMIT 1`,[id]),
        orderRequests:(c,id,owner,limit,cursor)=>rows(c,`SELECT ${adminFields}${adminFrom}
            WHERE p.id_pedido=? AND r.id_usuario=? AND (? IS NULL OR r.id_reembolso<?)
            ORDER BY r.id_reembolso DESC LIMIT ?`,[id,owner,cursor??null,cursor??null,limit+1]),
        async adminList(c,q){
            const where=[],args=[];
            if(q.cursor){where.push('r.id_reembolso<?');args.push(q.cursor);}
            for(const [key,column] of Object.entries({status:'r.status',reason:'r.motivo',compensation:'r.compensacao_status',userId:'r.id_usuario',paymentId:'r.id_pagamento',orderId:'p.id_pedido',chargeId:'p.id_cobranca'}))if(q[key]){where.push(`${column}=?`);args.push(q[key]);}
            args.push(q.limit+1);
            return rows(c,`SELECT ${adminFields}${adminFrom} ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY r.id_reembolso DESC LIMIT ?`,args);
        },
        adminGet:(c,id)=>one(c,`SELECT ${adminFields},r.detalhes,r.termos_versao,r.decisao_fundamento,r.itens_selecionados${adminFrom} WHERE r.id_reembolso=?`,[id]),
        orderItems:(c,id)=>rows(c,`SELECT ip.id_item,ip.subtotal,ip.quantidade,
            COALESCE(f.titulo,sf.titulo,co.nome,i.nome,'Item da compra') AS nome
            FROM itens_pedido ip LEFT JOIN filmes f ON f.id_filme=ip.id_filme
            LEFT JOIN sessoes s ON s.id_sessao=ip.id_sessao LEFT JOIN filmes sf ON sf.id_filme=s.id_filme
            LEFT JOIN combos co ON co.id_combo=ip.id_combo LEFT JOIN insumos i ON i.id_insumo=ip.id_insumo
            WHERE ip.id_pedido=? ORDER BY ip.id_item`,[id]),
        selectedHistory:(c,paymentId)=>rows(c,"SELECT itens_selecionados FROM reembolso_solicitacoes WHERE id_pagamento=? AND status='CONFIRMADA' AND itens_selecionados IS NOT NULL",[paymentId]),
        recordItems:(c,id,items)=>c.execute('UPDATE reembolso_solicitacoes SET itens_selecionados=? WHERE id_reembolso=?',[JSON.stringify(items),id]),
        async payment(id,c=database,lock=false){if(lock&&!await one(c,'SELECT id_pagamento FROM pagamentos WHERE id_pagamento=? FOR UPDATE',[id]))return null;return one(c,paymentSql,[id]);},
        async refund(id,c=database,lock=false){if(lock&&!await one(c,'SELECT id_reembolso FROM reembolso_solicitacoes WHERE id_reembolso=? FOR UPDATE',[id]))return null;return one(c,refundSql,[id]);},
        byKey:(owner,key,c)=>one(c,'SELECT id_reembolso FROM reembolso_solicitacoes WHERE id_usuario=? AND chave_idempotencia=?',[owner,key]),
        confirmed:(paymentId,c)=>one(c,"SELECT COALESCE(SUM(valor_confirmado),0) AS total FROM reembolso_solicitacoes WHERE id_pagamento=? AND status='CONFIRMADA'",[paymentId]),
        async insert(c,d){const [r]=await c.execute('INSERT INTO reembolso_solicitacoes(id_pagamento,id_usuario,chave_idempotencia,motivo,detalhes,dentro_prazo,termos_versao,valor_solicitado,status,prazo_resposta_em) VALUES(?,?,?,?,?,?,?,?,?,UTC_TIMESTAMP(3)+INTERVAL 5 DAY) ON DUPLICATE KEY UPDATE id_reembolso=LAST_INSERT_ID(id_reembolso)',[d.paymentId,d.owner,d.key,d.reason,d.details,d.within,d.termsVersion,d.amount,d.status]);return {id:idString(r.insertId),created:r.affectedRows===1};},
        sent:(c,id)=>c.execute("UPDATE reembolso_solicitacoes SET status='ENVIADA' WHERE id_reembolso=? AND status='RECEBIDA'",[id]),
        reference:(c,id,ref)=>c.execute('UPDATE reembolso_solicitacoes SET provider_ref=? WHERE id_reembolso=? AND provider_ref IS NULL',[ref,id]),
        decision:(c,id,status,amount,version,basis)=>c.execute('UPDATE reembolso_solicitacoes SET status=?,valor_solicitado=?,termos_versao=?,decisao_fundamento=?,respondido_em=UTC_TIMESTAMP(3) WHERE id_reembolso=? AND status=?',[status,amount,version,basis,id,'EM_ANALISE']),
        failed:(c,id)=>c.execute("UPDATE reembolso_solicitacoes SET status='FALHOU',respondido_em=UTC_TIMESTAMP(3) WHERE id_reembolso=? AND status='ENVIADA'",[id]),
        async confirmedRefund(c,r,amount,total){
            await c.execute("UPDATE reembolso_solicitacoes SET status='CONFIRMADA',valor_confirmado=?,respondido_em=UTC_TIMESTAMP(3),compensacao_status='PENDENTE' WHERE id_reembolso=? AND status='ENVIADA'",[amount,r.id_reembolso]);
            await c.execute('UPDATE pagamentos SET status=? WHERE id_pagamento=?',[total===r.pagamento_valor?'ESTORNADO':'PARCIALMENTE_ESTORNADO',r.id_pagamento]);
        },
        plan:(id,c,lock=false)=>one(c,`SELECT id_assinatura,id_usuario,inicio,status,renovacao_automatica FROM assinaturas WHERE id_assinatura=?${lock?' FOR UPDATE':''}`,[id]),
        latestPlanPayment:(id,owner,c)=>one(c,"SELECT p.id_pagamento FROM pagamentos p JOIN assinatura_cobrancas ac ON ac.id_cobranca=p.id_cobranca WHERE ac.id_assinatura=? AND ac.id_usuario=? AND p.status IN ('APROVADO','PARCIALMENTE_ESTORNADO') ORDER BY p.data_pagamento DESC,p.id_pagamento DESC LIMIT 1",[id,owner]),
        cancelPlan:(c,id)=>c.execute("UPDATE assinaturas SET status='CANCELADA',renovacao_automatica=FALSE,fim=UTC_DATE(),alteracao_programada=NULL WHERE id_assinatura=? AND status IN ('ATIVA','PENDENTE')",[id])
    };
}
