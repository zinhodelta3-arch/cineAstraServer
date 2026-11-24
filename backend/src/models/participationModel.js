import {idString} from '../utils/dto.js';

const rows=async(c,sql,args=[])=> (await c.execute(sql,args))[0];
const one=async(c,sql,args=[])=> (await rows(c,sql,args))[0]??null;
const deadline=`COALESCE(cp.expira_em,LEAST(DATE_ADD(cp.data_convite,INTERVAL 7 DAY),
  COALESCE(DATE_ADD(a.fim,INTERVAL 1 DAY),DATE_ADD(cp.data_convite,INTERVAL 7 DAY))))`;
export function createParticipationModel(){return {
  subscription:(c,id,lock=false)=>one(c,`SELECT id_assinatura,id_usuario,status,periodicidade,tipo_divisao,tipo_divisao_proximo,tipo_divisao_efetiva_em,preco_contratado,limite_membros_contratado,inicio,fim,alteracao_programada,encerramento_admin_em FROM assinaturas WHERE id_assinatura=?${lock?' FOR UPDATE':''}`,[id]),
  user:(c,id)=>one(c,"SELECT u.id_usuario,u.status,u.tipo_usuario,u.data_nascimento,v.faixa_etaria FROM usuarios u LEFT JOIN verificacoes_idade v ON v.id_verificacao=(SELECT MAX(x.id_verificacao) FROM verificacoes_idade x WHERE x.id_usuario=u.id_usuario AND x.expiracao>UTC_TIMESTAMP(3)) WHERE u.id_usuario=?",[id]),
  userIdByEmail:(c,email)=>one(c,"SELECT id_usuario FROM usuarios WHERE email=? AND tipo_usuario='CLIENTE' AND status='ATIVO'",[email]),
  participants:(c,id)=>rows(c,'SELECT ap.id_usuario,u.nome,ap.status,ap.entrada_em,ap.saida_em,ap.atualizado_em FROM assinatura_participantes ap JOIN usuarios u ON u.id_usuario=ap.id_usuario WHERE ap.id_assinatura=? ORDER BY ap.id_usuario',[id]),
  participant:(c,id,userId)=>one(c,'SELECT id_usuario,status FROM assinatura_participantes WHERE id_assinatura=? AND id_usuario=?',[id,userId]),
  activeCount:(c,id)=>one(c,"SELECT COUNT(*) AS total FROM assinatura_participantes WHERE id_assinatura=? AND status IN ('ATIVO','SUSPENSO')",[id]),
  pendingCount:(c,id)=>one(c,`SELECT COUNT(*) AS total FROM convites_plano cp JOIN assinaturas a USING(id_assinatura)
    WHERE cp.id_assinatura=? AND cp.status='PENDENTE' AND ${deadline}>UTC_TIMESTAMP(3)`,[id]),
  invitation:(c,id,lock=false)=>one(c,`SELECT cp.*,${deadline} AS prazo,${deadline}<=UTC_TIMESTAMP(3) AS expirado
    FROM convites_plano cp JOIN assinaturas a USING(id_assinatura) WHERE cp.id_convite=?${lock?' FOR UPDATE OF cp':''}`,[id]),
  invitationForUser:(c,subscriptionId,userId)=>one(c,'SELECT id_convite,status FROM convites_plano WHERE id_assinatura=? AND id_usuario_convidado=?',[subscriptionId,userId]),
  myInvitations:(c,userId,limit,cursor)=>rows(c,`SELECT cp.*,u.nome AS titular,p.nome AS plano,a.tipo_divisao,${deadline} AS prazo,
      ${deadline}<=UTC_TIMESTAMP(3) AS expirado,a.preco_contratado,a.periodicidade,a.status AS assinatura_status,a.fim,a.encerramento_admin_em,
      ap.status AS participacao, EXISTS (SELECT 1 FROM assinatura_cobrancas ac WHERE ac.id_assinatura=a.id_assinatura AND ac.id_usuario=cp.id_usuario_convidado) AS tem_cobranca
      FROM convites_plano cp JOIN assinaturas a ON a.id_assinatura=cp.id_assinatura
      JOIN usuarios u ON u.id_usuario=a.id_usuario JOIN planos p ON p.id_plano=a.id_plano
      LEFT JOIN assinatura_participantes ap ON ap.id_assinatura=a.id_assinatura AND ap.id_usuario=cp.id_usuario_convidado
      WHERE cp.id_usuario_convidado=? AND cp.id_convite>? ORDER BY cp.id_convite LIMIT ?`,[userId,cursor,limit+1]),
  outgoingInvitations:(c,id)=>rows(c,`SELECT cp.*,u.nome,${deadline} AS prazo FROM convites_plano cp
    JOIN usuarios u ON u.id_usuario=cp.id_usuario_convidado JOIN assinaturas a ON a.id_assinatura=cp.id_assinatura
    WHERE cp.id_assinatura=? AND cp.status='PENDENTE' AND ${deadline}>UTC_TIMESTAMP(3) ORDER BY cp.id_convite`,[id]),
  async invite(c,subscriptionId,userId,end){const [r]=await c.execute(`INSERT INTO convites_plano(id_assinatura,id_usuario_convidado,status,expira_em)
    VALUES(?,?,'PENDENTE',LEAST(DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 7 DAY),DATE_ADD(?,INTERVAL 1 DAY)))`,[subscriptionId,userId,end]);return idString(r.insertId);},
  resetInvitation:(c,id,end)=>c.execute(`UPDATE convites_plano SET status='PENDENTE',data_convite=UTC_TIMESTAMP(3),data_resposta=NULL,
    expira_em=LEAST(DATE_ADD(UTC_TIMESTAMP(3),INTERVAL 7 DAY),DATE_ADD(?,INTERVAL 1 DAY))
    WHERE id_convite=? AND status IN ('ACEITO','RECUSADO','EXPIRADO')`,[end,id]),
  dueInvitations:(c,limit)=>rows(c,`SELECT cp.id_convite,cp.id_assinatura FROM convites_plano cp JOIN assinaturas a USING (id_assinatura)
    WHERE cp.status='PENDENTE' AND ${deadline}<=UTC_TIMESTAMP(3) ORDER BY cp.id_convite LIMIT ?`,[limit]),
  decideInvitation:(c,id,status)=>c.execute('UPDATE convites_plano SET status=?,data_resposta=UTC_TIMESTAMP(3) WHERE id_convite=? AND status=\'PENDENTE\'',[status,id]),
  upsertParticipant:(c,subscriptionId,userId)=>c.execute("INSERT INTO assinatura_participantes(id_assinatura,id_usuario,status) VALUES(?,?,'ATIVO') ON DUPLICATE KEY UPDATE status='ATIVO',entrada_em=UTC_TIMESTAMP(3),saida_em=NULL,atualizado_em=UTC_TIMESTAMP(3)",[subscriptionId,userId]),
  setParticipant:(c,subscriptionId,userId,status)=>c.execute('UPDATE assinatura_participantes SET status=?,saida_em=IF(?=\'SAIU\',UTC_TIMESTAMP(3),saida_em),atualizado_em=UTC_TIMESTAMP(3) WHERE id_assinatura=? AND id_usuario=?',[status,status,subscriptionId,userId]),
  event:(c,subscriptionId,userId,actorId,event)=>c.execute('INSERT INTO assinatura_participante_eventos(id_assinatura,id_usuario,id_ator,evento) VALUES(?,?,?,?)',[subscriptionId,userId,actorId,event]),
  events:(c,id,limit,cursor,userId=null)=>rows(c,`SELECT id_evento,id_usuario,id_ator,evento,criado_em FROM assinatura_participante_eventos WHERE id_assinatura=? AND id_evento>?${userId?' AND id_usuario=?':''} ORDER BY id_evento LIMIT ?`,userId?[id,cursor,userId,limit+1]:[id,cursor,limit+1]),
  pendingProposal:(c,id)=>one(c,"SELECT id_proposta FROM assinatura_rateio_propostas WHERE id_assinatura=? AND status='PENDENTE' LIMIT 1",[id]),
  proposal:(c,id)=>one(c,'SELECT id_proposta,id_assinatura,id_proponente,tipo_divisao,competencia_efetiva,status,criada_em,decidida_em FROM assinatura_rateio_propostas WHERE id_proposta=?',[id]),
  async createProposal(c,subscriptionId,ownerId,mode,effective){const [r]=await c.execute("INSERT INTO assinatura_rateio_propostas(id_assinatura,id_proponente,tipo_divisao,competencia_efetiva,status) VALUES(?,?,?,?,'PENDENTE')",[subscriptionId,ownerId,mode,effective]);return idString(r.insertId);},
  addConsent:(c,proposalId,userId,accepted)=>c.execute('INSERT INTO assinatura_rateio_consensos(id_proposta,id_usuario,status,decidido_em) VALUES(?,?,?,IF(?=\'ACEITO\',UTC_TIMESTAMP(3),NULL))',[proposalId,userId,accepted?'ACEITO':'PENDENTE',accepted?'ACEITO':'PENDENTE']),
  consent:(c,proposalId,userId)=>one(c,'SELECT status FROM assinatura_rateio_consensos WHERE id_proposta=? AND id_usuario=?',[proposalId,userId]),
  vote:(c,proposalId,userId,status)=>c.execute("UPDATE assinatura_rateio_consensos SET status=?,decidido_em=UTC_TIMESTAMP(3) WHERE id_proposta=? AND id_usuario=? AND status='PENDENTE'",[status,proposalId,userId]),
  pendingVotes:(c,proposalId)=>one(c,"SELECT COUNT(*) AS total FROM assinatura_rateio_consensos WHERE id_proposta=? AND status='PENDENTE'",[proposalId]),
  closeProposal:(c,id,status)=>c.execute("UPDATE assinatura_rateio_propostas SET status=?,decidida_em=UTC_TIMESTAMP(3) WHERE id_proposta=? AND status='PENDENTE'",[status,id]),
  scheduleMode:(c,subscriptionId,mode,effective)=>c.execute('UPDATE assinaturas SET tipo_divisao_proximo=?,tipo_divisao_efetiva_em=? WHERE id_assinatura=?',[mode,effective,subscriptionId]),
  charges:(c,subscriptionId,competence)=>rows(c,'SELECT id_cobranca,id_usuario,valor_devido,valor_multa_aplicada,juros_mora,correcao_ipca,ipca_periodo_final,status,data_vencimento,data_pagamento FROM assinatura_cobrancas WHERE id_assinatura=? AND competencia=? ORDER BY id_usuario',[subscriptionId,competence])
};}
