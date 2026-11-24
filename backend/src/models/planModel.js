import {idString} from '../utils/dto.js';

const one=async(c,sql,args=[])=> (await c.execute(sql,args))[0][0]??null;
const rows=async(c,sql,args=[])=> (await c.execute(sql,args))[0];
const projection='id_plano,nome,descricao,valor_mensal,valor_anual,desconto,limite_membros,ativo,acesso_catalogo,id_combo_medio,combo_gratis_mes,custo_beneficios_mensal,custo_beneficios_anual';
const fields={name:'nome',description:'descricao',maxMembers:'limite_membros',catalogAccess:'acesso_catalogo',freeComboId:'id_combo_medio',freeCombosPerMonth:'combo_gratis_mes',active:'ativo'};
export function createPlanModel(){return {
    plan:(c,id,lock=false)=>one(c,`SELECT ${projection} FROM planos WHERE id_plano=?${lock?' FOR UPDATE':''}`,[id]),
    plans:(c,admin,limit,cursor)=>rows(c,`SELECT ${projection} FROM planos WHERE id_plano>?${admin?'':' AND ativo=TRUE AND valor_mensal IS NOT NULL AND valor_anual IS NOT NULL'} ORDER BY id_plano LIMIT ?`,[cursor,limit+1]),
    benefits:(c,id)=>rows(c,'SELECT categoria,desconto_bps FROM plano_beneficios WHERE id_plano=? ORDER BY categoria',[id]),
    async setBenefits(c,id,discounts){
        for(const [category,bps] of Object.entries(discounts)){
            await c.execute('INSERT INTO plano_beneficios (id_plano,categoria,desconto_bps) VALUES (?,?,?) ON DUPLICATE KEY UPDATE desconto_bps=?',[id,category,bps,bps]);
        }
    },
    combo:(c,id)=>one(c,'SELECT id_combo,ativo FROM combos WHERE id_combo=? AND id_evento IS NULL',[id]),
    async create(c,input){const [r]=await c.execute('INSERT INTO planos(nome,descricao,limite_membros,acesso_catalogo,id_combo_medio,combo_gratis_mes,ativo) VALUES(?,?,?,?,?,?,FALSE)',[input.name,input.description??null,input.maxMembers,input.catalogAccess,input.freeComboId??null,input.freeCombosPerMonth]);return idString(r.insertId);},
    patch(c,id,input){const keys=Object.keys(input),set=keys.map(key=>`${fields[key]}=?`).join(',');return c.execute(`UPDATE planos SET ${set} WHERE id_plano=?`,[...keys.map(key=>input[key]),id]);},
    userSubscriptions:(c,userId,limit,cursor)=>rows(c,`SELECT a.id_assinatura,a.id_plano,p.nome AS nome_plano,a.periodicidade,a.tipo_divisao,
        a.status,a.renovacao_automatica,a.inicio,a.fim,a.suspenso_por_cobranca,a.preco_contratado,a.contrato_snapshot,a.alteracao_programada,
        a.limite_membros_contratado,a.encerramento_admin_em,a.proposta_admin
        FROM assinaturas a JOIN planos p ON p.id_plano=a.id_plano WHERE a.id_usuario=? AND a.id_assinatura>?
        ORDER BY a.id_assinatura LIMIT ?`,[userId,cursor,limit+1]),
    subscription:(c,id,lock=false)=>one(c,`SELECT id_assinatura,id_usuario,id_plano,periodicidade,tipo_divisao,status,renovacao_automatica,inicio,fim,suspenso_por_cobranca,preco_contratado,contrato_snapshot,limite_membros_contratado,alteracao_programada,encerramento_admin_em,proposta_admin FROM assinaturas WHERE id_assinatura=?${lock?' FOR UPDATE':''}`,[id]),
    byKey:(c,userId,key)=>one(c,'SELECT id_assinatura,contratacao_hash FROM assinaturas WHERE id_usuario=? AND chave_contratacao=? FOR UPDATE',[userId,key]),
    lockUser:(c,userId)=>one(c,'SELECT id_usuario,tipo_usuario,status FROM usuarios WHERE id_usuario=? FOR UPDATE',[userId]),
    activeForUser:(c,userId)=>one(c,`SELECT a.id_assinatura,a.status,a.contrato_snapshot FROM assinaturas a WHERE a.id_usuario=? AND a.status IN ('PENDENTE','ATIVA')
        AND (a.fim IS NULL OR a.fim>=UTC_DATE() OR a.alteracao_programada IS NOT NULL OR a.renovacao_automatica=TRUE
            OR EXISTS(SELECT 1 FROM assinatura_cobrancas c WHERE c.id_assinatura=a.id_assinatura AND c.status IN ('PENDENTE','ATRASADO')))
        LIMIT 1 FOR UPDATE`,[userId]),
    memberCounts:(c,id)=>one(c,`SELECT (SELECT COUNT(*) FROM assinatura_participantes WHERE id_assinatura=? AND status IN ('ATIVO','SUSPENSO'))+
        (SELECT COUNT(*) FROM convites_plano cp JOIN assinaturas a USING (id_assinatura)
         WHERE cp.id_assinatura=? AND cp.status='PENDENTE' AND COALESCE(cp.expira_em,LEAST(DATE_ADD(cp.data_convite,INTERVAL 7 DAY),
         COALESCE(DATE_ADD(a.fim,INTERVAL 1 DAY),DATE_ADD(cp.data_convite,INTERVAL 7 DAY))))>UTC_TIMESTAMP(3))+1 AS total`,[id,id]),
    participation:(c,id,userId)=>one(c,'SELECT status FROM assinatura_participantes WHERE id_assinatura=? AND id_usuario=?',[id,userId]),
    scheduleChange:(c,id,change)=>c.execute('UPDATE assinaturas SET alteracao_programada=?,proposta_admin=NULL WHERE id_assinatura=?',[JSON.stringify(change),id]),
    proposeChange:(c,id,proposal)=>c.execute('UPDATE assinaturas SET proposta_admin=? WHERE id_assinatura=?',[JSON.stringify(proposal),id]),
    applyScheduledChange:(c,id,change,end)=>c.execute(`UPDATE assinaturas SET id_plano=?,periodicidade=?,preco_contratado=?,
        limite_membros_contratado=?,contrato_snapshot=?,renovacao_automatica=?,fim=?,alteracao_programada=NULL WHERE id_assinatura=?`,
        [change.planId,change.period,change.price,change.maxMembers,JSON.stringify({...change.contract,benefitsSince:change.effectiveOn}),change.autoRenew,end,id]),
    age:(c,userId)=>one(c,'SELECT faixa_etaria FROM verificacoes_idade WHERE id_usuario=? AND expiracao>UTC_TIMESTAMP(3) ORDER BY id_verificacao DESC LIMIT 1',[userId]),
    async subscribe(c,d){const [r]=await c.execute("INSERT INTO assinaturas(id_usuario,id_plano,inicio,periodicidade,tipo_divisao,status,renovacao_automatica,chave_contratacao,contratacao_hash,contrato_snapshot,preco_contratado,limite_membros_contratado) VALUES(?,?,UTC_DATE(),?,?,'PENDENTE',?,?,?,?,?,?)",[d.userId,d.planId,d.period,d.divisionMode,d.autoRenew,d.key,d.hash,JSON.stringify(d.snapshot),d.price,d.maxMembers]);return idString(r.insertId);},
    async createDraft(c,{userId,planId,period,modality}){
        const [result]=await c.execute("INSERT INTO assinaturas(id_usuario,id_plano,inicio,periodicidade,tipo_divisao,status,renovacao_automatica,contrato_snapshot) VALUES(?,?,UTC_DATE(),?,'TITULAR_PAGA','PENDENTE',FALSE,?)",[userId,planId,period,JSON.stringify({administrativeDraft:true,modality})]);
        return idString(result.insertId);
    },
    patchDraft:(c,id,planId,period,modality)=>c.execute("UPDATE assinaturas SET id_plano=?,periodicidade=?,contrato_snapshot=JSON_SET(contrato_snapshot,'$.modality',?) WHERE id_assinatura=?",[planId,period,modality,id]),
    setRenewal:(c,id,enabled)=>c.execute(`UPDATE assinaturas SET renovacao_automatica=?,
        alteracao_programada=IF(alteracao_programada IS NOT NULL AND ?=FALSE,
        JSON_SET(alteracao_programada,'$.autoRenew',CAST('false' AS JSON)),alteracao_programada) WHERE id_assinatura=?`,[enabled,enabled,id]),
    activeParticipants:(c,id)=>rows(c,"SELECT id_usuario FROM assinatura_participantes WHERE id_assinatura=? AND status IN ('ATIVO','SUSPENSO') ORDER BY id_usuario",[id]),
    lockOpenCharges:(c,id,end)=>rows(c,`SELECT id_cobranca FROM assinatura_cobrancas
        WHERE id_assinatura=? AND status IN ('PENDENTE','ATRASADO') AND (? IS NULL OR data_vencimento>?)
        ORDER BY id_cobranca FOR UPDATE`,[id,end,end]),
    dispatchInProgress:(c,id,end)=>one(c,`SELECT pi.id_intencao FROM pagamento_intencoes pi
        JOIN assinatura_cobrancas ac ON ac.id_cobranca=pi.id_cobranca
        WHERE ac.id_assinatura=? AND ac.status IN ('PENDENTE','ATRASADO') AND (? IS NULL OR ac.data_vencimento>?)
        AND pi.estado='ENVIADA' LIMIT 1 FOR UPDATE OF pi`,[id,end,end]),
    cancelOpenCharges:(c,id,end)=>c.execute(`UPDATE assinatura_cobrancas SET status='CANCELADO'
        WHERE id_assinatura=? AND status IN ('PENDENTE','ATRASADO') AND (? IS NULL OR data_vencimento>?)`,[id,end,end]),
    endByAdmin:async(c,id,end)=>{
        await c.execute(`UPDATE assinaturas SET status=IF(? IS NULL OR ?<UTC_DATE(),'CANCELADA',status),
            encerramento_admin_em=?,renovacao_automatica=FALSE,alteracao_programada=NULL,proposta_admin=NULL,
            tipo_divisao_proximo=NULL,tipo_divisao_efetiva_em=NULL WHERE id_assinatura=?`,[end,end,end,id]);
        await c.execute("UPDATE convites_plano SET status='EXPIRADO',data_resposta=UTC_TIMESTAMP(3) WHERE id_assinatura=? AND status='PENDENTE'",[id]);
        await c.execute("UPDATE assinatura_rateio_propostas SET status='CANCELADA',decidida_em=UTC_TIMESTAMP(3) WHERE id_assinatura=? AND status='PENDENTE'",[id]);
    },
    async acceptDraft(c,id,d){
        await c.execute(`UPDATE assinaturas SET id_plano=?,periodicidade=?,tipo_divisao=?,renovacao_automatica=?,
            chave_contratacao=?,contratacao_hash=?,contrato_snapshot=?,preco_contratado=?,limite_membros_contratado=?,inicio=UTC_DATE()
            WHERE id_assinatura=?`,[d.planId,d.period,d.divisionMode,d.autoRenew,d.key,d.hash,JSON.stringify(d.snapshot),d.price,d.maxMembers,id]);
    },
    async initialCharge(c,subscriptionId,userId,price){const [r]=await c.execute("INSERT INTO assinatura_cobrancas(id_assinatura,id_usuario,competencia,valor_devido,status,data_vencimento) VALUES(?,?,DATE_FORMAT(UTC_DATE(),'%Y-%m-01'),?,'PENDENTE',UTC_DATE())",[subscriptionId,userId,price]);return idString(r.insertId);},
    firstCharge:(c,subscriptionId)=>one(c,'SELECT id_cobranca,status,valor_devido FROM assinatura_cobrancas WHERE id_assinatura=? ORDER BY id_cobranca LIMIT 1',[subscriptionId]),
    latestCharge:(c,id,owner)=>one(c,`SELECT ac.id_cobranca,ac.status,ac.data_vencimento,ac.valor_devido,
        ac.valor_multa_aplicada,ac.juros_mora,ac.correcao_ipca,p.id_pagamento,p.status AS pagamento_status
        FROM assinatura_cobrancas ac LEFT JOIN pagamentos p ON p.id_pagamento=(
            SELECT p2.id_pagamento FROM pagamentos p2 WHERE p2.id_cobranca=ac.id_cobranca
            ORDER BY p2.id_pagamento DESC LIMIT 1)
        WHERE ac.id_assinatura=? AND ac.id_usuario=? ORDER BY (ac.status IN ('PENDENTE','ATRASADO')) DESC,ac.id_cobranca DESC LIMIT 1`,[id,owner]),
    currentForUser:(c,id)=>one(c,`SELECT a.id_assinatura,a.id_plano,p.nome AS nome_plano,a.periodicidade,a.fim,
        a.suspenso_por_cobranca,a.status,(ap.suspenso_por_cobranca OR ap.status='SUSPENSO') AS membro_suspenso,a.contrato_snapshot
        FROM assinaturas a JOIN planos p ON p.id_plano=a.id_plano
        LEFT JOIN assinatura_participantes ap ON ap.id_assinatura=a.id_assinatura AND ap.id_usuario=? AND ap.status IN ('ATIVO','SUSPENSO')
        WHERE (a.id_usuario=? OR ap.id_usuario IS NOT NULL) AND a.status='ATIVA' AND a.inicio<=UTC_DATE()
        AND (a.fim IS NULL OR a.fim>=DATE_SUB(UTC_DATE(),INTERVAL 7 DAY)) AND (a.encerramento_admin_em IS NULL OR a.encerramento_admin_em>=UTC_DATE())
        AND EXISTS(SELECT 1 FROM assinatura_cobrancas ac WHERE ac.id_assinatura=a.id_assinatura
            AND ac.id_usuario=IF(a.tipo_divisao='DIVISAO_IGUAL' AND EXISTS(SELECT 1 FROM assinatura_cobrancas own WHERE own.id_assinatura=a.id_assinatura AND own.id_usuario=?),?,a.id_usuario) AND ac.status IN ('PAGO','ISENTO'))
        ORDER BY (a.id_usuario=?) DESC,a.id_assinatura DESC LIMIT 1`,[id,id,id,id,id]),
    settlement:(c,chargeId)=>one(c,`SELECT ac.id_cobranca,ac.id_usuario,ac.data_vencimento,ac.status AS cobranca_status,a.id_assinatura,a.status AS assinatura_status,a.periodicidade,a.alteracao_programada,a.encerramento_admin_em,
        EXISTS(SELECT 1 FROM assinatura_cobrancas rest WHERE rest.id_assinatura=a.id_assinatura AND rest.competencia=ac.competencia
            AND rest.id_cobranca<>ac.id_cobranca AND rest.status IN ('PENDENTE','ATRASADO')) AS outros_pendentes,
        EXISTS(SELECT 1 FROM assinatura_ciclos ciclo WHERE ciclo.id_assinatura=ac.id_assinatura AND ciclo.competencia=ac.competencia) AS renovacao_emitida,
        (SELECT beneficios_snapshot FROM assinatura_ciclos ciclo WHERE ciclo.id_assinatura=ac.id_assinatura AND ciclo.competencia=ac.competencia) AS beneficios_snapshot
        FROM assinatura_cobrancas ac JOIN assinaturas a ON a.id_assinatura=ac.id_assinatura WHERE ac.id_cobranca=? FOR UPDATE`,[chargeId]),
    activate:(c,subscriptionId,confirmedAt,period)=>c.execute(`UPDATE assinaturas SET status='ATIVA',inicio=DATE(?),fim=DATE_SUB(DATE_ADD(DATE(?),INTERVAL 1 ${period==='ANUAL'?'YEAR':'MONTH'}),INTERVAL 1 DAY) WHERE id_assinatura=? AND status='PENDENTE'`,[confirmedAt,confirmedAt,subscriptionId]),
    extend:(c,subscriptionId,due,end)=>c.execute("UPDATE assinaturas SET fim=? WHERE id_assinatura=? AND status='ATIVA' AND fim<?",[end,subscriptionId,due]),
    applyRenewedBenefits:(c,id,due,benefits)=>c.execute(`UPDATE assinaturas SET contrato_snapshot=JSON_SET(COALESCE(contrato_snapshot,JSON_OBJECT()),
        '$.discounts',CAST(? AS JSON),'$.catalogAccess',CAST(? AS JSON),'$.freeComboId',CAST(? AS JSON),
        '$.freeCombosPerMonth',?,'$.benefitsSince',?)
        WHERE id_assinatura=? AND status='ATIVA' AND
        COALESCE(JSON_UNQUOTE(JSON_EXTRACT(contrato_snapshot,'$.benefitsSince')),'0001-01-01')<?`,
        [JSON.stringify(benefits.discounts),JSON.stringify(benefits.catalogAccess),JSON.stringify(benefits.freeComboId),benefits.freeCombosPerMonth,due,id,due]),
    paidCurrent:(c,subscriptionId)=>one(c,"SELECT id_cobranca FROM assinatura_cobrancas WHERE id_assinatura=? AND status IN ('PAGO','ISENTO') LIMIT 1",[subscriptionId]),
    existingRedemption:(c,subscriptionId,competence)=>one(c,'SELECT id_resgate,status FROM beneficio_resgates WHERE id_assinatura=? AND competencia=?',[subscriptionId,competence]),
    async redeem(c,subscriptionId,userId,comboId,competence){const [r]=await c.execute("INSERT INTO beneficio_resgates(id_assinatura,id_usuario,id_combo,competencia,status) VALUES(?,?,?,?,'SOLICITADO')",[subscriptionId,userId,comboId,competence]);return idString(r.insertId);}
};}
