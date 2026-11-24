import {ApiError} from '../utils/ApiError.js';
import {report} from '../utils/telemetry.js';
import {instant} from './identityService.js';
import {idString} from '../utils/dto.js';
import {cents,money} from './pricingMath.js';

const conflict=(message='O estado do reembolso mudou. Consulte a situação atual e tente novamente.')=>new ApiError(message,409,null,'REFUND_CONFLICT');
const dto=r=>({id:idString(r.id_reembolso),paymentId:idString(r.id_pagamento),reason:r.motivo,status:r.status,requestedAmount:r.valor_solicitado??null,confirmedAmount:r.valor_confirmado??null,withinSevenDays:Boolean(r.dentro_prazo),receivedAt:r.solicitado_em,responseDueAt:r.prazo_resposta_em,respondedAt:r.respondido_em??null,compensation:r.compensacao_status});
const date=value=>value==null?null:new Date(instant(value)).toISOString();
const adminDto=r=>({...dto(r),userId:idString(r.id_usuario),orderId:r.id_pedido==null?null:idString(r.id_pedido),chargeId:r.id_cobranca==null?null:idString(r.id_cobranca),paymentAmount:r.pagamento_valor,paymentStatus:r.pagamento_status,
    archivedAt:date(r.arquivado_admin_em),
    receivedAt:date(r.solicitado_em),responseDueAt:date(r.prazo_resposta_em),respondedAt:date(r.respondido_em)});
const sevenDays=7*24*60*60*1000;
function withinSeven(value,now=Date.now()){
    if(!value)return false;
    const raw=String(value),iso=raw.length===10?`${raw}T00:00:00Z`:raw.replace(' ','T');
    const parsed=Date.parse(/(?:Z|[+-]\d{2}:?\d{2})$/.test(iso)?iso:`${iso}Z`);
    if(!Number.isFinite(parsed)||parsed>now)return false;
    return now-parsed<=sevenDays+(raw.length===10?24*60*60*1000-1:0);
}
export function createRefundService({model,identity,provider,termsVersion,socialProgram,notifications}){
    const tx=(context,fn)=>identity.transaction(fn,context);
    const gatewayReady=()=>provider?.available!==false&&/^[A-Za-z0-9_-]{2,40}$/.test(provider?.name??'')&&typeof provider.refund==='function'&&typeof provider.consultRefund==='function';
    async function actor(c,context){const a=await identity.activeActor(c,context);if(a.tipo_usuario!=='CLIENTE')throw ApiError.acessoNegado();return a;}
    async function own(c,id,context,lock=false){const a=await actor(c,context),r=await model.refund(id,c,lock);if(!r||idString(r.id_usuario)!==idString(a.id_usuario))throw ApiError.naoEncontrado();return r;}
    const remaining=async(c,p,lock=false)=>cents(String(p.valor??p.pagamento_valor))-cents(String((await model.confirmed(p.id_pagamento,c,lock)).total));
    function notify(c,r,{event,status,title,message}){
        const id=idString(r.id_reembolso);
        return notifications.emit(c,{
            recipientId:idString(r.id_usuario),type:`REFUND_${status}`,dedupeKey:`refund-${event}:${id}`,
            title:`${title} #${id}`,message,
            target:{kind:'refund',id,...(r.id_pedido!=null&&{detailId:idString(r.id_pedido)})},
        });
    }
    const selections=value=>typeof value==='string'?JSON.parse(value):value??[];
    async function refundableItems(c,r,lock=false){
        const allocated=new Map();
        for(const refund of await model.selectedHistory(c,r.id_pagamento,lock)){
            for(const item of selections(refund.itens_selecionados)){
                allocated.set(item.itemId,(allocated.get(item.itemId)??0n)+cents(item.amount));
            }
        }
        return (await model.orderItems(c,r.id_pedido)).flatMap(item=>{
            const id=idString(item.id_item);
            const balance=cents(String(item.subtotal))-(allocated.get(id)??0n);
            return balance>0n?[{id,name:item.nome,quantity:item.quantidade,remainingAmount:money(balance)}]:[];
        });
    }
    async function allocateItems(c,r,ids,amount){
        if(!ids?.length)throw ApiError.validacao('Selecione os itens para o reembolso parcial.');
        const items=new Map((await refundableItems(c,r,true)).map(item=>[item.id,item]));
        let left=cents(amount);
        const selected=[];
        for(const id of ids){
            if(left<=0n||!items.has(id))throw ApiError.validacao('Confira os itens selecionados e o valor de reembolso.');
            const limit=cents(items.get(id).remainingAmount);
            const allocated=left<limit?left:limit;
            selected.push({itemId:id,amount:money(allocated)});
            left-=allocated;
        }
        if(left>0n)throw conflict();
        return selected;
    }
    async function get(id,context){return tx(context,async c=>dto(await own(c,id,context)));}
    async function createRequest(c,paymentId,input,key,owner,context,manualReview=false){
            const p=await model.payment(paymentId,c,true);
            if(!p||!p.id_usuario||idString(p.id_usuario)!==idString(owner))throw ApiError.naoEncontrado();
            const prior=await model.byKey(owner,key,c,true);
            if(prior){
                const r=await model.refund(prior.id_reembolso,c,true);
                if(idString(r.id_pagamento)!==idString(paymentId)||r.motivo!==input.reason||(r.detalhes??null)!==(input.details??null))throw conflict('A solicitação já foi recebida com outros dados.');
                return dto(r);
            }
            if(input.reason==='CANCELAMENTO_PLANO'&&(!p.id_cobranca||p.assinatura_status!=='CANCELADA'))throw conflict();
            if(!['APROVADO','PARCIALMENTE_ESTORNADO'].includes(p.status))throw conflict('O pagamento está indisponível para reembolso.');
            if(await model.activeRequest(c,paymentId))throw conflict('Já existe uma solicitação em andamento para este pagamento.');
            const left=await remaining(c,p,true);if(left<=0n)throw conflict('O pagamento já foi reembolsado integralmente.');
            const eligible=['ARREPENDIMENTO','CANCELAMENTO_PLANO'].includes(input.reason)&&withinSeven(p.id_pedido?p.data_pedido:p.assinatura_inicio);
            const autoDispatch=eligible&&!manualReview&&(!p.id_pedido||provider.name!=='simulado');
            const inserted=await model.insert(c,{paymentId,owner,key,reason:input.reason,details:input.details??null,within:eligible,termsVersion:termsVersion??null,amount:autoDispatch?money(left):null,status:autoDispatch?'RECEBIDA':'EM_ANALISE'});
            const stored=await model.refund(inserted.id,c);
            if(idString(stored.id_pagamento)!==idString(paymentId)||stored.chave_idempotencia!==key||stored.motivo!==input.reason)throw conflict();
            if(inserted.created)await identity.audit(c,'REFUND.REQUESTED',inserted.id,context);
            return dto(stored);
    }
    const request=(paymentId,input,key,context)=>tx(context,async c=>createRequest(c,paymentId,input,key,(await actor(c,context)).id_usuario,context));
    async function reviewStoppedSession(c,paymentId,sessionIds,context){
        const payment=await model.payment(paymentId,c,true);
        if(!payment?.id_usuario||!['APROVADO','PARCIALMENTE_ESTORNADO'].includes(payment.status))return;
        if(await model.activeRequest(c,paymentId)||await remaining(c,payment,true)<=0n)return;
        const key=`session-review:${sessionIds[0]}:${idString(paymentId)}`;
        if(await model.byKey(payment.id_usuario,key,c,true))return;
        const details=`Programação interrompida ou cancelada. Sessões vinculadas: ${sessionIds.join(', ')}. Confira os itens afetados antes de decidir o valor.`;
        return createRequest(c,paymentId,{reason:'OUTRO',details},key,payment.id_usuario,context,true);
    }
    async function orderAccess(c,id,context,admin=false){
        const viewer=await identity.activeActor(c,context);
        if(viewer.tipo_usuario!==(admin?'ADMIN':'CLIENTE'))throw ApiError.acessoNegado();
        const order=await model.order(c,id);
        if(!order||!admin&&idString(order.id_usuario)!==idString(viewer.id_usuario))throw ApiError.naoEncontrado();
        return order;
    }
    async function orderHistory(id,{limit,cursor},context){
        return tx(context,async c=>{
            const order=await orderAccess(c,id,context);
            const rows=await model.orderRequests(c,id,order.id_usuario,limit,cursor);
            const eligible=['PAGO','FINALIZADO'].includes(order.status)&&Boolean(await model.orderPayment(c,id));
            const items=rows.slice(0,limit);
            return {eligible,items:items.map(row=>({...dto(row),details:row.detalhes??null,response:row.resposta_cliente??null,
                receivedAt:date(row.solicitado_em),responseDueAt:date(row.prazo_resposta_em),respondedAt:date(row.respondido_em)})),pagination:{limit,nextCursor:rows.length>limit?idString(items.at(-1).id_reembolso):null}};
        });
    }
    async function requestOrder(id,input,key,context,admin=false){
        return tx(context,async c=>{
            const order=await orderAccess(c,id,context,admin);
            const paymentId=admin?input.paymentId:undefined;
            const prior=await model.byKey(order.id_usuario,key,c);
            if(prior){
                const r=await model.refund(prior.id_reembolso,c);
                if(idString(r.id_pedido)!==id||(paymentId&&idString(r.id_pagamento)!==paymentId)||
                    r.motivo!==input.reason||(r.detalhes??null)!==(input.details??null))throw conflict();
                return dto(r);
            }
            if(!['PAGO','FINALIZADO'].includes(order.status))throw conflict('Só é possível solicitar reembolso de um pedido pago.');
            const payment=await model.orderPayment(c,id,paymentId);
            if(!payment)throw conflict('Este pedido não tem um pagamento disponível para reembolso.');
            return createRequest(c,payment.id_pagamento,input,key,order.id_usuario,context,true);
        });
    }
    async function dispatch(id,context){
        if(!gatewayReady())return;
        const claimed=await tx(context,async c=>{
            const r=await model.refund(id,c,true);
            if(!r||r.status!=='RECEBIDA'||!r.valor_solicitado||r.pagamento_provider!==provider.name)return null;
            const transactionId=r.pagamento_provider_ref??r.transacao_id;
            if(!transactionId)return null;
            await model.sent(c,id);
            await identity.audit(c,'REFUND.DISPATCH_CLAIMED',id,context);
            return {id,transactionId,amount:String(r.valor_solicitado)};
        });
        if(!claimed)return;
        try{
            const result=await provider.refund({idempotencyKey:`refund:${id}`,transactionId:claimed.transactionId,amount:claimed.amount,currency:'BRL',signal:context.signal});
            if(result)await applyResult(id,result,context);
        }catch(error){
            // Resultado incerto: consultar, nunca redisparar refund.
            report('refund_dispatch_uncertain',{requestId:context.requestId,error});
        }
    }
    async function applyResult(id,result,context){
        if(!result||!['PENDING','CONFIRMED','FAILED'].includes(result.status)||result.currency!=='BRL'||typeof result.amount!=='string'||
            !/^(0|[1-9]\d{0,7})\.\d{2}$/.test(result.amount)||typeof result.refundId!=='string'||!/^[A-Za-z0-9._:-]{1,150}$/.test(result.refundId))throw ApiError.validacao('Resposta de estorno inválida');
        return tx(context,async c=>{
            const target=await model.refund(id,c);
            if(!target)throw ApiError.naoEncontrado();
            await model.payment(target.id_pagamento,c,true);
            const r=await model.refund(id,c,true);
            if(!r||r.pagamento_provider!==provider.name||String(r.valor_solicitado)!==result.amount||
                (r.provider_ref&&r.provider_ref!==result.refundId))throw conflict();
            if(r.status==='CONFIRMADA')return dto(r);
            if(r.status!=='ENVIADA')throw conflict();
            if(!r.provider_ref)await model.reference(c,id,result.refundId);
            if(result.status==='CONFIRMED'){
                const total=money(cents(String((await model.confirmed(r.id_pagamento,c,true)).total))+cents(result.amount));
                if(cents(total)>cents(String(r.pagamento_valor)))throw conflict();
                await model.confirmedRefund(c,r,result.amount,total);
                await socialProgram?.refund(c,{refundId:id,paymentId:r.id_pagamento,cumulativeAmount:total});
                await identity.audit(c,'REFUND.CONFIRMED_COMPENSATION_PENDING',id,context);
                await notify(c,r,{event:'confirmed',status:'CONFIRMED',title:'Devolução confirmada',
                    message:`O reembolso de R$ ${result.amount.replace('.',',')} foi confirmado pelo meio de pagamento.`});
            }else if(result.status==='FAILED'){
                await model.failed(c,id);await identity.audit(c,'REFUND.FAILED',id,context);
                await notify(c,r,{event:'failed',status:'FAILED',title:'Devolução não concluída',
                    message:'O meio de pagamento informou que a devolução não foi concluída. Consulte a situação do reembolso.'});
            }
            return dto(await model.refund(id,c));
        });
    }
    async function reconcile(id,context,admin=false){
        const read=c=>admin?adminRefund(c,id,context):own(c,id,context);
        let r=await tx(context,read);
        if(r.status==='RECEBIDA'){
            if(!gatewayReady())throw ApiError.indisponivel();
            await dispatch(id,{actor:context.actor,requestId:context.requestId});
            r=await tx(context,read);
        }
        if(r.status!=='ENVIADA')return dto(r);
        if(!gatewayReady()||r.pagamento_provider!==provider.name)throw ApiError.indisponivel();
        const result=await provider.consultRefund({idempotencyKey:`refund:${id}`,transactionId:r.pagamento_provider_ref??r.transacao_id,refundId:r.provider_ref,amount:String(r.valor_solicitado),currency:'BRL',signal:context.signal});
        if(result)await applyResult(id,result,context);
        return tx(context,async c=>dto(await read(c)));
    }
    async function adminRefund(c,id,context){
        if((await identity.activeActor(c,context)).tipo_usuario!=='ADMIN')throw ApiError.acessoNegado();
        const row=await model.refund(id,c);
        if(!row)throw ApiError.naoEncontrado();
        return row;
    }
    async function decide(id,input,context){
        const result=await tx(context,async c=>{
            const a=await identity.activeActor(c,context);if(a.tipo_usuario!=='ADMIN')throw ApiError.acessoNegado();
            const target=await model.refund(id,c);if(!target)throw ApiError.naoEncontrado();
            const payment=input.decision==='APPROVE'?await model.payment(target.id_pagamento,c,true):null;
            const r=await model.refund(id,c,true);if(!r)throw ApiError.naoEncontrado();if(r.status!=='EM_ANALISE')throw conflict();
            if(!termsVersion)throw ApiError.indisponivel();
            if(input.termsVersion!==termsVersion)throw ApiError.validacao('Versão dos Termos inválida');
            let amount=null,status=input.decision==='CANCEL'?'CANCELADA':'NEGADA';
            if(input.decision==='APPROVE'){
                if(!gatewayReady()||payment?.provider!==provider.name||!(payment.provider_ref??payment.transacao_id)){
                    throw conflict('O meio de pagamento original está indisponível para devolução.');
                }
                if(await model.activeRequest(c,r.id_pagamento,true))throw conflict('Já existe uma devolução em andamento para este pagamento.');
                const left=await remaining(c,payment,true);
                if(cents(input.amount)>left)throw conflict('O valor aprovado excede o saldo disponível para reembolso.');
                if(r.id_pedido&&provider.name==='simulado'&&cents(input.amount)<left){
                    await model.recordItems(c,id,await allocateItems(c,r,input.itemIds,input.amount));
                }
                amount=input.amount;status='RECEBIDA';
            }
            await model.decision(c,id,status,amount,termsVersion,input.basis);
            await identity.audit(c,status==='RECEBIDA'?'REFUND.APPROVED_FOR_DISPATCH':status==='CANCELADA'?'REFUND.CANCELLED':'REFUND.DENIED',id,context);
            const decisionNotice={
                APPROVE:{status:'APPROVED',title:'Solicitação de reembolso aprovada'},
                DENY:{status:'DENIED',title:'Solicitação de reembolso negada'},
                CANCEL:{status:'CANCELLED',title:'Solicitação de reembolso cancelada'},
            }[input.decision];
            await notify(c,r,{...decisionNotice,event:'decision',message:input.response});
            return dto(await model.refund(id,c));
        });
        return result;
    }
    async function cancelPlan(id,context){
        const result=await tx(context,async c=>{
            const a=await actor(c,context),plan=await model.plan(id,c,true);
            if(!plan||idString(plan.id_usuario)!==idString(a.id_usuario))throw ApiError.naoEncontrado();
            if(!['ATIVA','PENDENTE','CANCELADA'].includes(plan.status))throw conflict();
            if(plan.status!=='CANCELADA'){
                await model.cancelPlan(c,id);
                await identity.audit(c,'SUBSCRIPTION.CANCELLED',id,context);
            }
            const paid=await model.latestPlanPayment(id,a.id_usuario,c);
            return {id:idString(id),status:'CANCELADA',paymentId:paid?idString(paid.id_pagamento):null};
        });
        if(!result.paymentId)return {...result,refund:null,refundRequestRequired:false};
        try{
            const refund=await request(result.paymentId,{reason:'CANCELAMENTO_PLANO'},`cancel_plan_${id}`,context);
            return {...result,refund,refundRequestRequired:false};
        }catch{
            // Cancelamento já confirmado; sinalizar solicitação ainda necessária.
            return {...result,refund:null,refundRequestRequired:true};
        }
    }
    async function adminList(q,context){return tx(context,async c=>{
        if((await identity.activeActor(c,context)).tipo_usuario!=='ADMIN')throw ApiError.acessoNegado();
        const rows=await model.adminList(c,q),page=rows.slice(0,q.limit);
        return {items:page.map(adminDto),pagination:{limit:q.limit,nextCursor:rows.length>q.limit?idString(page.at(-1).id_reembolso):null}};
    });}
    async function adminGet(id,context){return tx(context,async c=>{
        if((await identity.activeActor(c,context)).tipo_usuario!=='ADMIN')throw ApiError.acessoNegado();
        const row=await model.adminGet(c,id);if(!row)throw ApiError.naoEncontrado();
        const left=row.status==='EM_ANALISE'?await remaining(c,row):0n;
        return {...adminDto(row),details:row.detalhes??null,response:row.resposta_cliente??null,termsVersion:row.status==='EM_ANALISE'?termsVersion??null:row.termos_versao??null,decisionBasis:row.decisao_fundamento??null,
            remainingAmount:money(left>0n?left:0n),selectedItems:selections(row.itens_selecionados),
            eligibleItems:row.id_pedido&&row.status==='EM_ANALISE'?await refundableItems(c,row):[]};
    });}
    return {adminList,adminGet,request,requestOrder,reviewStoppedSession,orderHistory,get,reconcile,decide,cancelPlan,dispatch,applyResult};
}
