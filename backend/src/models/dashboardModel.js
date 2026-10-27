const rows=async(c,sql,args)=>(await c.execute(sql,args))[0];
// One first capture per order prevents payment retries/duplicate captures from multiplying tickets.
const sales=` FROM itens_pedido i JOIN (SELECT id_pedido,MIN(data_pagamento) AS first_paid FROM pagamentos WHERE id_pedido IS NOT NULL AND status IN ('APROVADO','PARCIALMENTE_ESTORNADO','ESTORNADO') GROUP BY id_pedido) p ON p.id_pedido=i.id_pedido JOIN sessoes s ON s.id_sessao=i.id_sessao JOIN salas sa ON sa.id_sala=s.id_sala JOIN filmes f ON f.id_filme=s.id_filme WHERE p.first_paid>=? AND p.first_paid<?`;
const local=q=>q.localId?' AND sa.id_local=?':'';
const args=(q,start,end)=>[start,end,...(q.localId?[q.localId]:[])];
const sessions=q=>` FROM sessoes s JOIN salas sa ON sa.id_sala=s.id_sala LEFT JOIN (SELECT id_sessao,COUNT(*) AS sold FROM assento_ocupacoes WHERE estado='CONFIRMADA' GROUP BY id_sessao) o ON o.id_sessao=s.id_sessao WHERE s.data>=? AND s.data<? AND s.status<>'CANCELADA'${local(q)}`;
const totals=`COUNT(*) AS session_count,COALESCE(SUM(s.status='ENCERRADA'),0) AS completed_sessions,COALESCE(SUM(sa.capacidade),0) AS capacity,COALESCE(SUM(o.sold),0) AS occupied`;
export function createDashboardModel(){return {
 daily:(c,q,start,end)=>rows(c,`SELECT DATE_FORMAT(p.first_paid,'%Y-%m-%d') AS day,SUM(i.quantidade) AS tickets,SUM(i.subtotal) AS revenue${sales}${local(q)} GROUP BY DATE_FORMAT(p.first_paid,'%Y-%m-%d') ORDER BY day`,args(q,start,end)),
 types:(c,q,start,end)=>rows(c,`SELECT COALESCE(i.tipo_ingresso,'UNKNOWN') AS type,SUM(i.quantidade) AS tickets${sales}${local(q)} GROUP BY i.tipo_ingresso`,args(q,start,end)),
 movies:(c,q,start,end)=>rows(c,`SELECT f.id_filme AS id,f.titulo AS title,SUM(i.quantidade) AS tickets,SUM(i.subtotal) AS revenue${sales}${local(q)} GROUP BY f.id_filme,f.titulo ORDER BY tickets DESC,f.id_filme LIMIT 10`,args(q,start,end)),
 occupancy:async(c,q,start,end)=>(await rows(c,`SELECT ${totals}${sessions(q)}`,args(q,start,end)))[0],
 rooms:(c,q,start,end)=>rows(c,`SELECT sa.id_sala AS id,sa.id_local AS local_id,sa.nome AS name,${totals}${sessions(q)} GROUP BY sa.id_sala,sa.id_local,sa.nome ORDER BY sa.id_sala LIMIT 101`,args(q,start,end))
};}
