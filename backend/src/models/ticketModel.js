import {idString} from '../utils/dto.js';

const one=async(c,sql,args=[])=> (await c.execute(sql,args))[0][0]??null;
const rows=async(c,sql,args=[])=> (await c.execute(sql,args))[0];
const itemProjection=`ip.id_item,ip.id_pedido,ip.id_insumo,ip.id_combo,ip.id_sessao,ip.id_sessao_retirada,ip.id_filme,ip.tipo_ingresso,ip.quantidade,
    s.data,s.horario_inicio,s.horario_fim,s.status AS sessao_status`;
const itemJoin=' FROM itens_pedido ip LEFT JOIN sessoes s ON s.id_sessao=COALESCE(ip.id_sessao,ip.id_sessao_retirada)';
const ticketProjection=`t.id_ticket,t.id_item,t.codigo,t.tipo,t.status,t.unidade,t.expira_em,t.data_geracao,t.data_utilizacao,t.saida_em,t.meia_comprovacao,
    (SELECT tp.tipo FROM ticket_passagens tp WHERE tp.id_ticket=t.id_ticket ORDER BY tp.id_passagem DESC LIMIT 1) AS ultima_passagem,
    ip.id_pedido,ip.id_sessao,ip.tipo_ingresso,p.id_usuario,p.status AS pedido_status,s.data,s.horario_inicio,s.horario_fim,s.status AS sessao_status,
    COALESCE(ip.id_sessao,t.id_sessao_retirada) AS sessao_vinculada,COALESCE(sa.id_local,co.id_local,i.id_local) AS id_local`;
const ticketJoin=` FROM tickets t JOIN itens_pedido ip ON ip.id_item=t.id_item JOIN pedidos p ON p.id_pedido=ip.id_pedido
    LEFT JOIN sessoes s ON s.id_sessao=COALESCE(ip.id_sessao,t.id_sessao_retirada)
    LEFT JOIN salas sa ON sa.id_sala=s.id_sala LEFT JOIN combos co ON co.id_combo=ip.id_combo LEFT JOIN insumos i ON i.id_insumo=ip.id_insumo`;
const buyerName="COALESCE(CASE WHEN u.tipo_usuario='CLIENTE' THEN u.nome END, pp.nome_cliente)";
const sessionOrders=`(
    SELECT id_pedido FROM itens_pedido WHERE id_sessao=?
    UNION SELECT id_pedido FROM itens_pedido WHERE id_sessao_retirada=?
    UNION SELECT id_pedido FROM pedidos_presenciais WHERE id_sessao=?
)`;
const orderScope=id=>[id,id,id];
const ends=`TIMESTAMP(DATE_ADD(s.data, INTERVAL (s.horario_fim<s.horario_inicio) DAY),s.horario_fim)`;
const presenceStatus=`CASE
    WHEN x.tipo<>'INGRESSO_SESSAO' THEN NULL
    WHEN x.ultima_passagem='SAIDA' OR (x.ultima_passagem IS NULL AND x.saida_em IS NOT NULL) THEN 'SAIU'
    WHEN x.ultima_passagem='ENTRADA' OR x.data_utilizacao IS NOT NULL THEN 'PRESENTE'
    WHEN x.status='CANCELADO' OR s.status IN ('CANCELADA','INTERROMPIDA') THEN 'SEM_REGISTRO'
    WHEN s.status='ENCERRADA' OR (s.status='EM_CARTAZ' AND ${ends}<=UTC_TIMESTAMP(3)) THEN 'AUSENTE'
    WHEN ${ends}<=UTC_TIMESTAMP(3) THEN 'SEM_REGISTRO' ELSE 'AGUARDANDO' END`;

export function createTicketModel(database){return {
    order:(c,id)=>one(c,'SELECT id_pedido,status FROM pedidos WHERE id_pedido=? FOR UPDATE',[id]),
    approvedPayment:(c,id)=>one(c,"SELECT id_pagamento FROM pagamentos WHERE id_pedido=? AND status='APROVADO' AND id_intencao IS NOT NULL LIMIT 1",[id]),
    orderItems:(c,id)=>rows(c,`SELECT ${itemProjection}${itemJoin} WHERE ip.id_pedido=? ORDER BY ip.id_item`,[id]),
    existingUnit:(c,itemId,type,unit)=>one(c,'SELECT id_ticket FROM tickets WHERE id_item=? AND tipo=? AND unidade=? FOR UPDATE',[itemId,type,unit]),
    async insertUnit(c,{itemId,type,unit,code,sessionId,expiresAt}){const [r]=await c.execute("INSERT INTO tickets(id_item,codigo,tipo,status,unidade,id_sessao_retirada,expira_em) VALUES(?,?,?,'GERADO',?,?,?)",[itemId,code,type,unit,sessionId,expiresAt]);return idString(r.insertId);},
    ownOrder:(c,orderId,userId)=>one(c,'SELECT id_pedido FROM pedidos WHERE id_pedido=? AND id_usuario=?',[orderId,userId]),
    ownerTickets:(c,orderId,limit,cursor)=>rows(c,`SELECT t.id_ticket,t.id_item,t.codigo,t.tipo,t.status,t.unidade,t.expira_em,t.data_utilizacao,t.saida_em,
        (SELECT tp.tipo FROM ticket_passagens tp WHERE tp.id_ticket=t.id_ticket ORDER BY tp.id_passagem DESC LIMIT 1) AS ultima_passagem
        FROM tickets t JOIN itens_pedido ip ON ip.id_item=t.id_item WHERE ip.id_pedido=? AND t.id_ticket>? ORDER BY t.id_ticket LIMIT ?`,[orderId,cursor,limit+1]),
    byCode:(c,code,lock=false)=>one(c,`SELECT ${ticketProjection}${ticketJoin} WHERE t.codigo=?${lock?' FOR UPDATE':''}`,[code]),
    byAttendanceId:(c,sessionId,ticketId)=>one(c,`SELECT ${ticketProjection}${ticketJoin}
        JOIN usuarios u ON u.id_usuario=p.id_usuario AND u.tipo_usuario='CLIENTE'
        WHERE t.id_ticket=? AND ip.id_sessao=? AND t.tipo='INGRESSO_SESSAO' FOR UPDATE`,[ticketId,sessionId]),
    customerAttendanceTickets:(c,sessionId,search,limit,cursor)=>rows(c,`SELECT ${ticketProjection},u.nome,u.email,a.fileira,a.numero
        ${ticketJoin}
        JOIN usuarios u ON u.id_usuario=p.id_usuario AND u.tipo_usuario='CLIENTE'
        LEFT JOIN assentos a ON a.id_assento=ip.id_assento
        WHERE ip.id_sessao=? AND t.tipo='INGRESSO_SESSAO' AND p.status IN ('PAGO','FINALIZADO')
            AND t.id_ticket>? AND ${search.condition} ORDER BY t.id_ticket LIMIT ?`,[sessionId,cursor,search.value,limit+1]),
    sessionLocal:(c,sessionId)=>one(c,'SELECT sa.id_local FROM sessoes s JOIN salas sa ON sa.id_sala=s.id_sala WHERE s.id_sessao=?',[sessionId]),
    sessionSeatMap:(c,sessionId)=>rows(c,`SELECT a.id_assento,a.fileira,a.numero,a.posicao_visual,a.tipo,a.status,
        o.estado,o.expira_em,p.id_pedido,p.status AS pedido_status,${buyerName} AS nome_comprador
        FROM sessoes s JOIN assentos a ON a.id_sala=s.id_sala
        LEFT JOIN assento_ocupacoes o ON o.id_sessao=s.id_sessao AND o.id_assento=a.id_assento
            AND (o.estado='CONFIRMADA' OR (o.estado='RESERVADA' AND o.expira_em>UTC_TIMESTAMP(3)))
        LEFT JOIN pedidos p ON p.id_pedido=o.id_pedido AND p.status<>'CANCELADO'
        LEFT JOIN pedidos_presenciais pp ON pp.id_pedido=p.id_pedido
        LEFT JOIN usuarios u ON u.id_usuario=p.id_usuario
        WHERE s.id_sessao=? ORDER BY a.fileira,a.posicao_mapa,a.id_assento`,[sessionId]),
    staffScope:(c,actorId,role,sessionId,localId)=>one(c,`SELECT 1 AS allowed FROM locais l WHERE l.id_local=? AND (
        (?='SUPERVISOR' AND EXISTS (SELECT 1 FROM supervisor_locais sl WHERE sl.id_supervisor=? AND sl.id_local=l.id_local))
        OR (?='COLABORADOR' AND EXISTS (
            SELECT 1 FROM equipes e JOIN sessoes s ON s.id_sessao=e.id_sessao JOIN salas sa ON sa.id_sala=s.id_sala
            JOIN equipe_membros m ON m.id_equipe=e.id_equipe AND m.id_usuario=? AND m.status='ATIVO'
            WHERE e.status='ATIVA' AND sa.id_local=l.id_local AND (? IS NULL OR e.id_sessao=?)))
        ) LIMIT 1`,[localId,role,actorId,role,actorId,sessionId,sessionId]),
    sessionTickets:(c,sessionId,limit,cursor,presence)=>rows(c,`WITH scoped AS (
        SELECT t.id_ticket,t.id_item,t.tipo,t.status,t.unidade,t.expira_em,t.data_utilizacao,t.saida_em,
               ip.id_pedido,p.status AS pedido_status, ${buyerName} AS nome_comprador, pp.canal,
               a.fileira,a.numero,
               (SELECT tp.tipo FROM ticket_passagens tp WHERE tp.id_ticket=t.id_ticket ORDER BY tp.id_passagem DESC LIMIT 1) AS ultima_passagem
        FROM tickets t JOIN itens_pedido ip ON ip.id_item=t.id_item JOIN pedidos p ON p.id_pedido=ip.id_pedido
        LEFT JOIN pedidos_presenciais pp ON pp.id_pedido=p.id_pedido
        LEFT JOIN usuarios u ON u.id_usuario=p.id_usuario LEFT JOIN assentos a ON a.id_assento=ip.id_assento
        WHERE (ip.id_sessao=? OR (ip.id_sessao IS NULL AND t.id_sessao_retirada=?)) AND t.id_ticket>?
    )
    SELECT * FROM (SELECT x.*, ${presenceStatus} AS registro_presenca FROM scoped x JOIN sessoes s ON s.id_sessao=?) listed
    ${presence ? 'WHERE registro_presenca=?' : ''} ORDER BY id_ticket LIMIT ?`,[sessionId,sessionId,cursor,sessionId,...(presence?[presence]:[]),limit+1]),
    sessionOrders:(c,id,limit,cursor)=>rows(c,`SELECT p.id_pedido,p.status,p.data_pedido,p.checkout_expira_em,p.valor_total,
        p.id_usuario, u.tipo_usuario,${buyerName} AS nome_comprador,pp.canal
        FROM ${sessionOrders} links JOIN pedidos p ON p.id_pedido=links.id_pedido
        LEFT JOIN usuarios u ON u.id_usuario=p.id_usuario LEFT JOIN pedidos_presenciais pp ON pp.id_pedido=p.id_pedido
        WHERE p.id_pedido>? ORDER BY p.id_pedido LIMIT ?`,[...orderScope(id),cursor,limit+1]),
    sessionPayments:(c,id,limit,cursor)=>rows(c,`SELECT pg.id_pagamento,pg.id_pedido,pg.status,pg.data_pagamento,pg.valor, m.tipo
        FROM ${sessionOrders} links JOIN pagamentos pg ON pg.id_pedido=links.id_pedido
        LEFT JOIN metodos_pagamento m ON m.id_metodo=pg.id_metodo WHERE pg.id_pagamento>? ORDER BY pg.id_pagamento LIMIT ?`,
        [...orderScope(id),cursor,limit+1]),
    sessionRefunds:(c,id,limit,cursor)=>rows(c,`SELECT r.id_reembolso,r.id_pagamento,pg.id_pedido,r.status,r.valor_solicitado,r.valor_confirmado,r.solicitado_em
        FROM ${sessionOrders} links JOIN pagamentos pg ON pg.id_pedido=links.id_pedido
        JOIN reembolso_solicitacoes r ON r.id_pagamento=pg.id_pagamento WHERE r.id_reembolso>? ORDER BY r.id_reembolso LIMIT ?`,
        [...orderScope(id),cursor,limit+1]),
    sessionAudit:(c,id,limit,cursor)=>rows(c,`SELECT a.id_auditoria,a.event_type,a.occurred_at,a.id_usuario,u.nome
        FROM auditoria_eventos a LEFT JOIN usuarios u ON u.id_usuario=a.id_usuario
        WHERE a.aggregate_id=? AND a.id_auditoria>? AND a.event_type IN ('SESSION.CREATED','SESSION.CHANGED','SESSION.INTERRUPTED','SESSION.CANCELLED','SESSION.ARCHIVED')
        ORDER BY a.id_auditoria LIMIT ?`,[id,cursor,limit+1]),
    sessionStaff:(c,id,limit,cursor)=>rows(c,`WITH people AS (
        SELECT id_supervisor AS id_usuario,'SUPERVISAO' AS source FROM equipes WHERE id_sessao=?
        UNION ALL SELECT m.id_usuario,'EQUIPE' FROM equipes e JOIN equipe_membros m USING(id_equipe) WHERE e.id_sessao=?
        UNION ALL SELECT id_operador,'BALCAO' FROM pedidos_presenciais WHERE id_sessao=?
        UNION ALL SELECT tp.id_usuario_staff,'PORTARIA' FROM itens_pedido ip JOIN tickets t USING(id_item)
            JOIN ticket_passagens tp USING(id_ticket) WHERE ip.id_sessao=?
        UNION ALL SELECT id_usuario,'PROGRAMACAO' FROM auditoria_eventos WHERE aggregate_id=?
            AND event_type IN ('SESSION.CREATED','SESSION.CHANGED','SESSION.INTERRUPTED','SESSION.CANCELLED','SESSION.ARCHIVED')
        UNION ALL SELECT p.id_usuario,'CLIENTE' FROM ${sessionOrders} links JOIN pedidos p ON p.id_pedido=links.id_pedido
            JOIN usuarios buyer ON buyer.id_usuario=p.id_usuario AND buyer.tipo_usuario='CLIENTE'
    )
    SELECT u.id_usuario,u.nome,u.tipo_usuario,GROUP_CONCAT(DISTINCT people.source ORDER BY people.source) AS sources
    FROM people JOIN usuarios u USING(id_usuario) WHERE u.id_usuario>?
    GROUP BY u.id_usuario,u.nome,u.tipo_usuario ORDER BY u.id_usuario LIMIT ?`,[id,id,id,id,id,...orderScope(id),cursor,limit+1]),
    async consume(c,id,actorId,evidence){const [r]=await c.execute("UPDATE tickets SET status='UTILIZADO',data_utilizacao=UTC_TIMESTAMP(),conferido_por=?,meia_comprovacao=? WHERE id_ticket=? AND status='GERADO' AND (expira_em IS NULL OR expira_em>UTC_TIMESTAMP(3))",[actorId,evidence,id]);return r.affectedRows===1;},
    async exit(c,id,actorId){const [r]=await c.execute("UPDATE tickets SET saida_em=UTC_TIMESTAMP(3),saida_por=? WHERE id_ticket=? AND tipo='INGRESSO_SESSAO' AND status='UTILIZADO'",[actorId,id]);return r.affectedRows===1;},
    lastPassage:(c,id)=>one(c,'SELECT id_passagem,tipo,ocorrido_em FROM ticket_passagens WHERE id_ticket=? ORDER BY id_passagem DESC LIMIT 1',[id]),
    async appendPassage(c,id,type,actorId,evidence=null){const [r]=await c.execute('INSERT INTO ticket_passagens(id_ticket,tipo,ocorrido_em,id_usuario_staff,meia_comprovacao) VALUES(?,?,UTC_TIMESTAMP(3),?,?)',[id,type,actorId,evidence]);return idString(r.insertId);},
    attendanceSummary:(c,sessionId)=>one(c,`SELECT COUNT(*) AS total,
        COALESCE(SUM(x.ultima_passagem IS NOT NULL OR x.data_utilizacao IS NOT NULL OR x.saida_em IS NOT NULL),0) AS entered,
        COALESCE(SUM((${presenceStatus})='PRESENTE'),0) AS inside,
        COALESCE(SUM((${presenceStatus})='SAIU'),0) AS exited,
        COALESCE(SUM(x.status='GERADO' AND UTC_TIMESTAMP(3)>TIMESTAMP(s.data,s.horario_inicio)),0) AS late,
        COALESCE(SUM((${presenceStatus})='AUSENTE'),0) AS absent
        FROM (SELECT t.id_ticket,t.tipo,t.status,t.data_utilizacao,t.saida_em,ip.id_sessao,
            (SELECT tp.tipo FROM ticket_passagens tp WHERE tp.id_ticket=t.id_ticket ORDER BY tp.id_passagem DESC LIMIT 1) AS ultima_passagem
            FROM tickets t JOIN itens_pedido ip ON ip.id_item=t.id_item WHERE ip.id_sessao=? AND t.tipo='INGRESSO_SESSAO') x
        JOIN sessoes s ON s.id_sessao=x.id_sessao`,[sessionId]),
    attendance:(c,sessionId,limit,cursor)=>rows(c,`SELECT tp.id_passagem,tp.id_ticket,tp.tipo,tp.ocorrido_em,tp.id_usuario_staff,u.nome AS customer_name
        FROM ticket_passagens tp JOIN tickets t ON t.id_ticket=tp.id_ticket JOIN itens_pedido ip ON ip.id_item=t.id_item
        JOIN pedidos p ON p.id_pedido=ip.id_pedido LEFT JOIN usuarios u ON u.id_usuario=p.id_usuario AND u.tipo_usuario='CLIENTE'
        WHERE ip.id_sessao=? AND tp.id_passagem>? ORDER BY tp.id_passagem LIMIT ?`,[sessionId,cursor,limit+1]),
    pendingSessionOrders:(c,sessionId,limit,cursor)=>rows(c,`
        SELECT p.id_pedido,p.checkout_expira_em
        FROM pedidos p
        WHERE p.id_pedido>? AND p.status='AGUARDANDO_PAGAMENTO'
            AND p.checkout_expira_em>UTC_TIMESTAMP(3)
            AND (EXISTS (
                SELECT 1 FROM itens_pedido ip WHERE ip.id_pedido=p.id_pedido
                    AND (ip.id_sessao=? OR ip.id_sessao_retirada=?)
            ) OR EXISTS (SELECT 1 FROM pedidos_presenciais pp WHERE pp.id_pedido=p.id_pedido AND pp.id_sessao=?))
        ORDER BY p.id_pedido LIMIT ?`,[cursor,sessionId,sessionId,sessionId,limit+1])
};}
