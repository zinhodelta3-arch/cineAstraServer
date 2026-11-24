import {createHash} from 'node:crypto';
import {ApiError} from '../utils/ApiError.js';
import {createAgePolicy} from './agePolicyService.js';
import {idString} from '../utils/dto.js';
import {cents,money} from './pricingMath.js';
import {chargeTotal,cycleEnd,dueAfterCycle} from './subscriptionBillingMath.js';

const conflict=message=>new ApiError(message,409,null,'PLAN_CONFLICT');
const found=row=>{if(!row)throw ApiError.naoEncontrado();return row;};
const snapshot=value=>typeof value==='string'?JSON.parse(value):value;
const seats={INDIVIDUAL:1,DUPLA:2,FAMILIA:4};
const prices=(row,capacity)=>({
    monthlyPrice:row.valor_mensal==null?null:money(cents(row.valor_mensal)+1000n*BigInt(capacity-1)),
    annualPrice:row.valor_anual==null?null:money(cents(row.valor_anual)+10000n*BigInt(capacity-1))
});
const planOptions=row=>Object.entries(seats).map(([modality,maxMembers])=>({modality,maxMembers,...prices(row,maxMembers)}));
const categoryName=name=>name==='Família'?'Essencial':name;
function contractFor(row,benefits,input){
    const modality=input.modality??'INDIVIDUAL',maxMembers=seats[modality];
    if(!maxMembers)throw conflict('Modalidade indisponível.');
    const details={...planDto(row,benefits),...prices(row,maxMembers),modality,maxMembers};
    return {details,price:input.period==='ANUAL'?details.annualPrice:details.monthlyPrice};
}
const scheduledView=row=>{
    const next=snapshot(row.alteracao_programada);
    return next?{planId:next.planId,planName:categoryName(next.contract.name),modality:next.contract.modality??null,period:next.period,price:next.price,effectiveOn:next.effectiveOn}:null;
};
const subscriptionStatus=row=>{
    if(row.status==='ATIVA'&&row.encerramento_admin_em&&row.encerramento_admin_em<new Date().toISOString().slice(0,10))return 'CANCELADA';
    if(row.status==='ATIVA'&&row.fim&&!row.renovacao_automatica&&!row.alteracao_programada&&
        Date.parse(`${row.fim}T00:00:00Z`)<Date.parse(`${new Date().toISOString().slice(0,10)}T00:00:00Z`)-7*86400000)return 'EXPIRADA';
    return row.status;
};
const isDraft=row=>row?.status==='PENDENTE'&&snapshot(row.contrato_snapshot)?.administrativeDraft===true;
const planDto=(row,benefits,admin=false)=>({id:idString(row.id_plano),name:categoryName(row.nome),description:row.descricao??null,monthlyPrice:row.valor_mensal??null,annualPrice:row.valor_anual??null,maxMembers:row.limite_membros,catalogAccess:Boolean(row.acesso_catalogo),freeComboId:row.id_combo_medio?idString(row.id_combo_medio):null,freeCombosPerMonth:row.combo_gratis_mes,discounts:Object.fromEntries(benefits.map(x=>[x.categoria,x.desconto_bps])),active:Boolean(row.ativo),...(admin?{monthlyBenefitCost:row.custo_beneficios_mensal,annualBenefitCost:row.custo_beneficios_anual}:{})});
const subscriptionDto=(row,charge=null)=>({id:idString(row.id_assinatura),planId:idString(row.id_plano),period:row.periodicidade,divisionMode:row.tipo_divisao??'TITULAR_PAGA',status:subscriptionStatus(row),autoRenew:Boolean(row.renovacao_automatica),startsOn:isDraft(row)?null:row.inicio,endsOn:row.fim,contractPrice:row.preco_contratado,contract:isDraft(row)?null:snapshot(row.contrato_snapshot),planName:categoryName(snapshot(row.contrato_snapshot)?.name??row.nome_plano??null),modality:snapshot(row.contrato_snapshot)?.modality??null,maxMembers:row.limite_membros_contratado??snapshot(row.contrato_snapshot)?.maxMembers??null,endingOn:row.encerramento_admin_em??null,adminProposal:snapshot(row.proposta_admin)??null,suspended:Boolean(row.suspenso_por_cobranca),...(isDraft(row)?{administrativeDraft:true}:{}),...(charge?{chargeId:idString(charge.id_cobranca),chargeStatus:charge.status,paymentPath:'/api/payments',...(charge.data_vencimento?{chargeDue:charge.data_vencimento,chargeAmount:charge.status==='ISENTO'?'0.00':chargeTotal(charge),paymentId:charge.id_pagamento?idString(charge.id_pagamento):null,paymentStatus:charge.pagamento_status??null}:{})}:{})});
const page=(rows,limit,key,map)=>({items:rows.slice(0,limit).map(map),pagination:{limit,nextCursor:rows.length>limit?idString(rows[limit-1][key]):null}});
const positivePrice=(price,cost)=>price!=null&&cost!=null&&cents(price)>0n&&cents(price)*8000n>=cents(cost)*10000n;
export function createPlanService({model,identity,billing,contracts,notifications,agePolicy=createAgePolicy()}){
    async function admin(c,context){const a=await identity.activeActor(c,context);if(a.tipo_usuario!=='ADMIN')throw ApiError.acessoNegado();return a;}
    async function client(c,context){const a=await identity.activeActor(c,context);if(a.tipo_usuario!=='CLIENTE')throw ApiError.acessoNegado();return a;}
    async function view(c,row,isAdmin=false){return {...planDto(row,await model.benefits(c,row.id_plano),isAdmin),modalities:planOptions(row)};}
    async function validatePlan(c,row){
        if(!positivePrice(row.valor_mensal,row.custo_beneficios_mensal)||!positivePrice(row.valor_anual,row.custo_beneficios_anual))throw conflict('Preço publicado ou custo de benefício inválido');
        if(!Number.isInteger(row.limite_membros)||row.limite_membros<1||row.limite_membros>100)throw conflict('Limite de membros inválido');
        if(row.combo_gratis_mes>1||Boolean(row.combo_gratis_mes)!==Boolean(row.id_combo_medio))throw conflict('Configure um combo mensal elegível');
        if(row.id_combo_medio&&!((await model.combo(c,row.id_combo_medio))?.ativo))throw conflict('Combo do plano indisponível');
    }
    async function availablePlan(c,id){
        const plan=found(await model.plan(c,id,true));
        if(!plan.ativo)throw conflict('Plano indisponível');
        await validatePlan(c,plan);
        return plan;
    }
    async function adminCreateSubscription(input,context){return identity.transaction(async c=>{
        await admin(c,context);
        const user=found(await model.lockUser(c,input.userId));
        if(user.tipo_usuario!=='CLIENTE'||user.status!=='ATIVO')throw conflict('Selecione um cliente ativo.');
        if(await model.activeForUser(c,input.userId))throw conflict('Cliente já possui assinatura ativa ou pendente.');
        await availablePlan(c,input.planId);
        const id=await model.createDraft(c,{...input,modality:input.modality??'INDIVIDUAL'});
        await identity.audit(c,'SUBSCRIPTION.ADMIN_DRAFT_CREATED',id,context);
        return subscriptionDto(found(await model.subscription(c,id)));
    },context);}
    async function adminEditSubscription(id,input,context){return identity.transaction(async c=>{
        await admin(c,context);
        const initial=found(await model.subscription(c,id));
        await model.lockUser(c,initial.id_usuario);
        const row=found(await model.subscription(c,id,true));
        if(input.action==='updateDraft'){
            if(!isDraft(row))throw conflict('A proposta já foi aceita ou deixou de estar pendente.');
            await availablePlan(c,input.planId);
            await model.patchDraft(c,id,input.planId,input.period,input.modality??'INDIVIDUAL');
            await identity.audit(c,'SUBSCRIPTION.ADMIN_DRAFT_UPDATED',id,context);
        }else if(input.action==='proposeChange'){
            if(row.status!=='ATIVA'||row.encerramento_admin_em||!row.fim||row.fim<new Date().toISOString().slice(0,10))throw conflict('O contrato atual precisa estar no ciclo pago.');
            const plan=await availablePlan(c,input.planId);
            const modality=input.modality??'INDIVIDUAL';
            const currentModality=snapshot(row.contrato_snapshot)?.modality;
            if(idString(row.id_plano)===input.planId&&row.periodicidade===input.period&&currentModality===modality)throw conflict('Escolha outro plano, período ou modalidade.');
            if(Number((await model.memberCounts(c,id)).total)>seats[modality])throw conflict('A modalidade não comporta participantes e convites atuais.');
            await model.proposeChange(c,id,{planId:input.planId,planName:categoryName(plan.nome),period:input.period,modality});
            await identity.audit(c,'SUBSCRIPTION.ADMIN_CHANGE_PROPOSED',id,context);
            if(notifications)await notifications.emit(c,{recipientId:idString(row.id_usuario),type:'SUBSCRIPTION_CHANGE_PROPOSED',
                title:'Proposta de troca de assinatura',message:'Confira os benefícios e o preço no perfil antes de decidir.',dedupeKey:`subscription-change:${id}:${Date.now()}`,target:{kind:'subscription',id:idString(id)}});
        }else{
            if(!['PENDENTE','ATIVA'].includes(row.status)||isDraft(row))throw conflict('A assinatura não admite alteração da renovação.');
            if(row.encerramento_admin_em)throw conflict('A assinatura tem encerramento programado.');
            const enable=input.action==='enableRenewal';
            if(enable&&snapshot(row.contrato_snapshot)?.renewalConsent!==true)throw conflict('A retomada da renovação precisa ser escolhida pelo titular.');
            if(Boolean(row.renovacao_automatica)!==enable){
                await model.setRenewal(c,id,enable);
                await identity.audit(c,enable?'SUBSCRIPTION.ADMIN_RENEWAL_ENABLED':'SUBSCRIPTION.ADMIN_RENEWAL_DISABLED',id,context);
            }
        }
        return subscriptionDto(found(await model.subscription(c,id,true)));
    },context);}
    async function adminEndSubscription(id,context){return identity.transaction(async c=>{
        await admin(c,context);
        const initial=found(await model.subscription(c,id));
        await model.lockUser(c,initial.id_usuario);
        const row=found(await model.subscription(c,id,true));
        if(row.encerramento_admin_em||['CANCELADA','EXPIRADA'].includes(row.status))return;
        const end=row.status==='ATIVA'?row.fim:null;
        if(row.status==='ATIVA'&&!end)throw conflict('A assinatura ativa não tem fim de ciclo cadastrado.');
        await model.lockOpenCharges(c,id,end);
        if(await model.dispatchInProgress(c,id,end))throw conflict('Concilie o pagamento em processamento antes de encerrar.');
        await model.cancelOpenCharges(c,id,end);
        await model.endByAdmin(c,id,end);
        await identity.audit(c,'SUBSCRIPTION.ADMIN_ENDED',id,context);
        if(notifications){
            const members=await model.activeParticipants(c,id);
            const message=end?`O encerramento foi registrado. Os benefícios do ciclo pago vão até ${end.split('-').reverse().join('/')}.`:
                'A administração encerrou a assinatura pendente. Você pode consultar o histórico no perfil.';
            for(const userId of [row.id_usuario,...members.map(member=>member.id_usuario)]){
                await notifications.emit(c,{recipientId:idString(userId),type:'SUBSCRIPTION_ADMIN_END',title:'Encerramento da assinatura',
                    message,dedupeKey:`subscription-end:${id}:${userId}`,target:{kind:'subscription',id:idString(id)}});
            }
        }
    },context);}
    async function plans({limit=50,cursor='0'},context,isAdmin=false){return identity.transaction(async c=>{
        if(isAdmin)await admin(c,context);
        const rows=await model.plans(c,isAdmin,limit,cursor);
        const items=[];for(const row of rows.slice(0,limit))items.push(await view(c,row,isAdmin));
        return {items,pagination:{limit,nextCursor:rows.length>limit?idString(rows[limit-1].id_plano):null}};
    },context);}
    async function get(id,context,isAdmin=false){return identity.transaction(async c=>{
        if(isAdmin)await admin(c,context);
        const row=found(await model.plan(c,id));if(!isAdmin&&(!row.ativo||row.valor_mensal==null||row.valor_anual==null))throw ApiError.naoEncontrado();
        return view(c,row,isAdmin);
    },context);}
    async function create(input,context){return identity.transaction(async c=>{
        await admin(c,context);
        const id=await model.create(c,input);
        await identity.audit(c,'PLAN.CREATED',id,context);
        return view(c,found(await model.plan(c,id)),true);
    },context);}
    async function patch(id,input,context){return identity.transaction(async c=>{
        await admin(c,context);
        found(await model.plan(c,id,true));
        const {discounts,...fields}=input;
        if(Object.keys(fields).length)await model.patch(c,id,fields);
        if(discounts)await model.setBenefits(c,id,discounts);
        const row=found(await model.plan(c,id,true));
        if(row.ativo)await validatePlan(c,row);
        await identity.audit(c,'PLAN.UPDATED',id,context);
        return view(c,row,true);
    },context);}
    async function archive(id,context){return identity.transaction(async c=>{
        await admin(c,context);found(await model.plan(c,id,true));
        await model.patch(c,id,{active:false});
        await identity.audit(c,'PLAN.ARCHIVED',id,context);
    },context);}
    async function summary(input,context){return identity.transaction(async c=>{
        await client(c,context);
        const plan=found(await model.plan(c,input.planId,true));
        if(!plan.ativo)throw conflict('Plano indisponível');
        await validatePlan(c,plan);
        const {details,price}=contractFor(plan,await model.benefits(c,plan.id_plano),input);
        return contracts.planContract(c,input,details,price);
    },context);}
    async function subscribe(input,key,context){return identity.transaction(async c=>{
        const user=await client(c,context),hash=createHash('sha256').update(JSON.stringify(input)).digest('hex');
        await model.lockUser(c,user.id_usuario);
        const prior=await model.byKey(c,user.id_usuario,key);
        if(prior){if(prior.contratacao_hash!==hash)throw conflict('Chave de contratação reutilizada');const row=found(await model.subscription(c,prior.id_assinatura));return subscriptionDto(row,await model.firstCharge(c,row.id_assinatura));}
        agePolicy.requireIndependent(user,await model.age(c,user.id_usuario));
        const existing=await model.activeForUser(c,user.id_usuario);
        if(existing&&!isDraft(existing))throw conflict('Titular já possui assinatura ativa ou pendente');
        const plan=found(await model.plan(c,input.planId,true));
        if(!plan.ativo)throw conflict('Plano indisponível');
        await validatePlan(c,plan);
        const {details:contract,price}=contractFor(plan,await model.benefits(c,plan.id_plano),input);
        if(contract.maxMembers===1&&input.divisionMode==='DIVISAO_IGUAL')throw conflict('Escolha o pagamento pelo titular na modalidade Individual.');
        const legal=contracts?await contracts.planContract(c,input,contract,price):null;
        if(contracts&&(!input.acceptance?.accepted||input.acceptance.offerHash!==legal.offerHash))throw conflict('Aceite da oferta atual necessário');
        const subscription={userId:user.id_usuario,planId:input.planId,period:input.period,divisionMode:input.divisionMode??'TITULAR_PAGA',autoRenew:input.autoRenew,key,hash,snapshot:{...contract,renewalConsent:input.autoRenew,...(legal&&{legal})},price,maxMembers:contract.maxMembers};
        const id=existing?idString(existing.id_assinatura):await model.subscribe(c,subscription);
        if(existing)await model.acceptDraft(c,id,subscription);
        await model.initialCharge(c,id,user.id_usuario,price);
        await identity.audit(c,'SUBSCRIPTION.CONTRACTED',id,context);
        return subscriptionDto(found(await model.subscription(c,id)),await model.firstCharge(c,id));
    },context);}
    async function mySubscriptions({limit=50,cursor='0'},context){return identity.transaction(async c=>{
        const user=await client(c,context),rows=await model.userSubscriptions(c,user.id_usuario,limit,cursor);
        return page(rows,limit,'id_assinatura',row=>({...subscriptionDto(row),scheduledChange:scheduledView(row)}));
    },context);}
    async function ownSubscription(id,context){return identity.transaction(async c=>{
        const user=await client(c,context),row=found(await model.subscription(c,id));
        const owner=idString(row.id_usuario)===idString(user.id_usuario);
        const participant=owner?null:await model.participation(c,id,user.id_usuario);
        if(!owner&&!participant)throw ApiError.naoEncontrado();
        const charge=await model.latestCharge(c,id,user.id_usuario);
        if(!owner&&!charge&&participant.status==='SAIU')throw ApiError.naoEncontrado();
        const details=subscriptionDto(row,charge);
        return owner?{...details,scheduledChange:scheduledView(row)}:{...details,adminProposal:null};
    },context);}
    async function current(context){return identity.transaction(async c=>{
        const user=await client(c,context),row=await model.currentForUser(c,user.id_usuario);
        return {subscription:row?{planName:categoryName(snapshot(row.contrato_snapshot)?.name??row.nome_plano),period:row.periodicidade,
            status:row.suspenso_por_cobranca||Number(row.membro_suspenso)===1?'SUSPENSA':row.status,endsOn:row.fim}:null};
    },context);}
    async function schedule(id,input,context){return identity.transaction(async c=>{
        const user=await client(c,context),row=found(await model.subscription(c,id,true));
        if(idString(row.id_usuario)!==idString(user.id_usuario))throw ApiError.naoEncontrado();
        if(row.status!=='ATIVA'||row.encerramento_admin_em||!row.fim||row.fim<new Date().toISOString().slice(0,10))throw conflict('A mudança precisa ser agendada antes do fim do ciclo.');
        if((row.tipo_divisao??'TITULAR_PAGA')!==input.divisionMode)throw conflict('Mantenha a regra de pagamento da assinatura atual.');
        const plan=await availablePlan(c,input.planId);
        const {details:contract,price}=contractFor(plan,await model.benefits(c,plan.id_plano),input);
        const prior=snapshot(row.contrato_snapshot);
        if(idString(row.id_plano)===input.planId&&row.periodicidade===input.period&&prior?.modality===contract.modality&&Boolean(row.renovacao_automatica)===input.autoRenew)throw conflict('Escolha outro plano, período ou modalidade.');
        if(Number((await model.memberCounts(c,id)).total)>contract.maxMembers)throw conflict('A modalidade não comporta os membros e convites atuais.');
        const legal=await contracts.planContract(c,input,contract,price);
        if(!input.acceptance?.accepted||input.acceptance.offerHash!==legal.offerHash)throw conflict('Aceite a oferta atual antes de agendar.');
        const next={effectiveOn:dueAfterCycle(row.fim),planId:input.planId,period:input.period,price,maxMembers:contract.maxMembers,autoRenew:input.autoRenew,contract:{...contract,renewalConsent:input.autoRenew,legal}};
        await model.scheduleChange(c,id,next);
        await identity.audit(c,'SUBSCRIPTION.CHANGE_SCHEDULED',id,context);
        return {...subscriptionDto(row),scheduledChange:scheduledView({alteracao_programada:next})};
    },context);}
    async function canSettle(c,chargeId){const row=await model.settlement(c,chargeId);return Boolean(row&&(['PENDENTE','ATIVA'].includes(row.assinatura_status)||row.assinatura_status==='CANCELADA'&&Number(row.renovacao_emitida)===1&&row.cobranca_status==='ATRASADO')&&['PENDENTE','ATRASADO'].includes(row.cobranca_status));}
    async function activate(c,chargeId,confirmedAt){const row=found(await model.settlement(c,chargeId));
        if(row.cobranca_status!=='PAGO'||!['PENDENTE','ATIVA'].includes(row.assinatura_status)&&!(row.assinatura_status==='CANCELADA'&&Number(row.renovacao_emitida)===1))throw conflict('Cobrança sem direito');
        if(row.assinatura_status==='PENDENTE')await model.activate(c,row.id_assinatura,confirmedAt,row.periodicidade);
        else if(row.assinatura_status==='ATIVA'&&row.data_vencimento){
            const change=snapshot(row.alteracao_programada);
            if(change?.effectiveOn===row.data_vencimento){
                if(Number(row.outros_pendentes)===0){
                    await model.applyScheduledChange(c,row.id_assinatura,change,cycleEnd(row.data_vencimento,change.period));
                    await identity.audit(c,'SUBSCRIPTION.CHANGE_APPLIED',row.id_assinatura,{});
                }
            }else if(!row.encerramento_admin_em){
                await model.extend(c,row.id_assinatura,row.data_vencimento,cycleEnd(row.data_vencimento,row.periodicidade));
                const benefits=snapshot(row.beneficios_snapshot);
                if(benefits&&Number(row.outros_pendentes)===0)await model.applyRenewedBenefits(c,row.id_assinatura,row.data_vencimento,benefits);
            }
        }
        if(billing)await billing.onPaid(c,row);
    }
    async function redeem(id,context){return identity.transaction(async c=>{
        const user=await client(c,context),row=found(await model.subscription(c,id,true));
        if(idString(row.id_usuario)!==idString(user.id_usuario))throw ApiError.naoEncontrado();
        const now=new Date().toISOString().slice(0,10),competence=`${now.slice(0,7)}-01`,contract=snapshot(row.contrato_snapshot);
        const graceEnd=row.encerramento_admin_em??(row.fim?new Date(Date.parse(`${row.fim}T00:00:00Z`)+7*86400000).toISOString().slice(0,10):null);
        if(row.status!=='ATIVA'||row.suspenso_por_cobranca||!row.inicio||!graceEnd||row.inicio>now||graceEnd<now||!await model.paidCurrent(c,id)||!contract?.freeComboId||contract.freeCombosPerMonth!==1)throw conflict('Benefício indisponível');
        if(!((await model.combo(c,contract.freeComboId))?.ativo))throw conflict('Combo contratado indisponível');
        if(await model.existingRedemption(c,id,competence))throw conflict('Combo mensal já solicitado');
        const redemptionId=await model.redeem(c,id,user.id_usuario,contract.freeComboId,competence);
        await identity.audit(c,'SUBSCRIPTION.COMBO_REQUESTED',redemptionId,context);
        return {id:redemptionId,subscriptionId:idString(id),comboId:contract.freeComboId,competence,status:'SOLICITADO'};
    },context);}
    return {plans,get,create,patch,archive,adminCreateSubscription,adminEditSubscription,adminEndSubscription,summary,subscribe,mySubscriptions,ownSubscription,current,schedule,canSettle,activate,redeem};
}
