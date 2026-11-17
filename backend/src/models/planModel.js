import {idString} from '../utils/dto.js';

const one=async(c,sql,args=[])=> (await c.execute(sql,args))[0][0]??null;
const rows=async(c,sql,args=[])=> (await c.execute(sql,args))[0];
const projection='id_plano,nome,descricao,valor_mensal,valor_anual,desconto,limite_membros,ativo,acesso_catalogo,id_combo_medio,combo_gratis_mes,custo_beneficios_mensal,custo_beneficios_anual';
const fields={name:'nome',description:'descricao',maxMembers:'limite_membros',catalogAccess:'acesso_catalogo',freeComboId:'id_combo_medio',freeCombosPerMonth:'combo_gratis_mes',active:'ativo'};
export function createPlanModel(){return {
    plan:(c,id,lock=false)=>one(c,`SELECT ${projection} FROM planos WHERE id_plano=?${lock?' FOR UPDATE':''}`,[id]),
    plans:(c,admin,limit,cursor)=>rows(c,`SELECT ${projection} FROM planos WHERE id_plano>?${admin?'':' AND ativo=TRUE AND valor_mensal IS NOT NULL AND valor_anual IS NOT NULL'} ORDER BY id_plano LIMIT ?`,[cursor,limit+1]),
    benefits:(c,id)=>rows(c,'SELECT categoria,desconto_bps FROM plano_beneficios WHERE id_plano=? ORDER BY categoria',[id]),
    combo:(c,id)=>one(c,'SELECT id_combo,ativo FROM combos WHERE id_combo=? AND id_evento IS NULL',[id]),
    async create(c,input){const [r]=await c.execute('INSERT INTO planos(nome,descricao,limite_membros,acesso_catalogo,id_combo_medio,combo_gratis_mes,ativo) VALUES(?,?,?,?,?,?,FALSE)',[input.name,input.description??null,input.maxMembers,input.catalogAccess,input.freeComboId??null,input.freeCombosPerMonth]);return idString(r.insertId);},
    patch(c,id,input){const keys=Object.keys(input),set=keys.map(key=>`${fields[key]}=?`).join(',');return c.execute(`UPDATE planos SET ${set} WHERE id_plano=?`,[...keys.map(key=>input[key]),id]);},
    userSubscriptions:(c,userId,limit,cursor)=>rows(c,`SELECT a.id_assinatura,a.id_plano,p.nome AS nome_plano,a.periodicidade,a.tipo_divisao,
        a.status,a.renovacao_automatica,a.inicio,a.fim,a.suspenso_por_cobranca,a.preco_contratado,a.contrato_snapshot,a.alteracao_programada
        FROM assinaturas a JOIN planos p ON p.id_plano=a.id_plano WHERE a.id_usuario=? AND a.id_assinatura>?
        ORDER BY a.id_assinatura LIMIT ?`,[userId,cursor,limit+1]),
    subscription:(c,id,lock=false)=>one(c,`SELECT id_assinatura,id_usuario,id_plano,periodicidade,tipo_divisao,status,renovacao_automatica,inicio,fim,suspenso_por_cobranca,preco_contratado,contrato_snapshot,limite_membros_contratado,alteracao_programada FROM assinaturas WHERE id_assinatura=?${lock?' FOR UPDATE':''}`,[id]),
    byKey:(c,userId,key)=>one(c,'SELECT id_assinatura,contratacao_hash FROM assinaturas WHERE id_usuario=? AND chave_contratacao=? FOR UPDATE',[userId,key]),
    lockUser:(c,userId)=>one(c,'SELECT id_usuario,tipo_usuario,status FROM usuarios WHERE id_usuario=? FOR UPDATE',[userId]),
    activeForUser:(c,userId)=>one(c,`SELECT a.id_assinatura,a.status,a.contrato_snapshot FROM assinaturas a WHERE a.id_usuario=? AND a.status IN ('PENDENTE','ATIVA')
        AND (a.fim IS NULL OR a.fim>=UTC_DATE() OR a.alteracao_programada IS NOT NULL OR a.renovacao_automatica=TRUE
            OR EXISTS(SELECT 1 FROM assinatura_cobrancas c WHERE c.id_assinatura=a.id_assinatura AND c.status IN ('PENDENTE','ATRASADO')))
        LIMIT 1 FOR UPDATE`,[userId]),
    memberCounts:(c,id)=>one(c,`SELECT (SELECT COUNT(*) FROM assinatura_participantes WHERE id_assinatura=? AND status IN ('ATIVO','SUSPENSO'))+
        (SELECT COUNT(*) FROM convites_plano WHERE id_assinatura=? AND status='PENDENTE')+1 AS total`,[id,id]),
    scheduleChange:(c,id,change)=>c.execute('UPDATE assinaturas SET alteracao_programada=? WHERE id_assinatura=?',[JSON.stringify(change),id]),
    applyScheduledChange:(c,id,change,end)=>c.execute(`UPDATE assinaturas SET id_plano=?,periodicidade=?,preco_contratado=?,
        limite_membros_contratado=?,contrato_snapshot=?,renovacao_automatica=?,fim=?,alteracao_programada=NULL WHERE id_assinatura=?`,
        [change.planId,change.period,change.price,change.maxMembers,JSON.stringify(change.contract),change.autoRenew,end,id]),
    age:(c,userId)=>one(c,'SELECT faixa_etaria FROM verificacoes_idade WHERE id_usuario=? AND expiracao>UTC_TIMESTAMP(3) ORDER BY id_verificacao DESC LIMIT 1',[userId]),
    async subscribe(c,d){const [r]=await c.execute("INSERT INTO assinaturas(id_usuario,id_plano,inicio,periodicidade,tipo_divisao,status,renovacao_automatica,chave_contratacao,contratacao_hash,contrato_snapshot,preco_contratado,limite_membros_contratado) VALUES(?,?,UTC_DATE(),?,?,'PENDENTE',?,?,?,?,?,?)",[d.userId,d.planId,d.period,d.divisionMode,d.autoRenew,d.key,d.hash,JSON.stringify(d.snapshot),d.price,d.maxMembers]);return idString(r.insertId);},
    async createDraft(c,{userId,planId,period}){
        const [result]=await c.execute("INSERT INTO assinaturas(id_usuario,id_plano,inicio,periodicidade,tipo_divisao,status,renovacao_automatica,contrato_snapshot) VALUES(?,?,UTC_DATE(),?,'TITULAR_PAGA','PENDENTE',FALSE,?)",[userId,planId,period,JSON.stringify({administrativeDraft:true})]);
        return idString(result.insertId);
    },
    patchDraft:(c,id,planId,period)=>c.execute('UPDATE assinaturas SET id_plano=?,periodicidade=? WHERE id_assinatura=?',[planId,period,id]),
    stopRenewal:(c,id)=>c.execute('UPDATE assinaturas SET renovacao_automatica=FALSE,alteracao_programada=NULL WHERE id_assinatura=?',[id]),
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
        a.suspenso_por_cobranca,a.status,ap.suspenso_por_cobranca AS membro_suspenso,a.contrato_snapshot
        FROM assinaturas a JOIN planos p ON p.id_plano=a.id_plano
        LEFT JOIN assinatura_participantes ap ON ap.id_assinatura=a.id_assinatura AND ap.id_usuario=? AND ap.status IN ('ATIVO','SUSPENSO')
        WHERE (a.id_usuario=? OR ap.id_usuario IS NOT NULL) AND a.status='ATIVA' AND a.inicio<=UTC_DATE()
        AND (a.fim IS NULL OR a.fim>=DATE_SUB(UTC_DATE(),INTERVAL 7 DAY))
        AND EXISTS(SELECT 1 FROM assinatura_cobrancas ac WHERE ac.id_assinatura=a.id_assinatura
            AND ac.id_usuario=IF(a.tipo_divisao='DIVISAO_IGUAL',?,a.id_usuario) AND ac.status IN ('PAGO','ISENTO'))
        ORDER BY (a.id_usuario=?) DESC,a.id_assinatura DESC LIMIT 1`,[id,id,id,id]),
    settlement:(c,chargeId)=>one(c,`SELECT ac.id_cobranca,ac.id_usuario,ac.data_vencimento,ac.status AS cobranca_status,a.id_assinatura,a.status AS assinatura_status,a.periodicidade,a.alteracao_programada,
        EXISTS(SELECT 1 FROM assinatura_cobrancas rest WHERE rest.id_assinatura=a.id_assinatura AND rest.competencia=ac.competencia
            AND rest.id_cobranca<>ac.id_cobranca AND rest.status IN ('PENDENTE','ATRASADO')) AS outros_pendentes,
        EXISTS(SELECT 1 FROM assinatura_ciclos ciclo WHERE ciclo.id_assinatura=ac.id_assinatura AND ciclo.competencia=ac.competencia) AS renovacao_emitida
        FROM assinatura_cobrancas ac JOIN assinaturas a ON a.id_assinatura=ac.id_assinatura WHERE ac.id_cobranca=? FOR UPDATE`,[chargeId]),
    activate:(c,subscriptionId,confirmedAt,period)=>c.execute(`UPDATE assinaturas SET status='ATIVA',inicio=DATE(?),fim=DATE_SUB(DATE_ADD(DATE(?),INTERVAL 1 ${period==='ANUAL'?'YEAR':'MONTH'}),INTERVAL 1 DAY) WHERE id_assinatura=? AND status='PENDENTE'`,[confirmedAt,confirmedAt,subscriptionId]),
    extend:(c,subscriptionId,due,end)=>c.execute("UPDATE assinaturas SET fim=? WHERE id_assinatura=? AND status='ATIVA' AND fim<?",[end,subscriptionId,due]),
    paidCurrent:(c,subscriptionId)=>one(c,"SELECT id_cobranca FROM assinatura_cobrancas WHERE id_assinatura=? AND status IN ('PAGO','ISENTO') LIMIT 1",[subscriptionId]),
    existingRedemption:(c,subscriptionId,competence)=>one(c,'SELECT id_resgate,status FROM beneficio_resgates WHERE id_assinatura=? AND competencia=?',[subscriptionId,competence]),
    async redeem(c,subscriptionId,userId,comboId,competence){const [r]=await c.execute("INSERT INTO beneficio_resgates(id_assinatura,id_usuario,id_combo,competencia,status) VALUES(?,?,?,?,'SOLICITADO')",[subscriptionId,userId,comboId,competence]);return idString(r.insertId);}
};}
