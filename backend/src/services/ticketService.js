import {randomBytes} from 'node:crypto';
import {ApiError} from '../utils/ApiError.js';
import {idString,moneyString} from '../utils/dto.js';
import {interval} from './sessionService.js';
import {customerSearchTerm,maskedCustomerEmail} from './attendanceCustomer.js';

const conflict=message=>new ApiError(message,409,null,'TICKET_CONFLICT');
const found=row=>{if(!row)throw ApiError.naoEncontrado();return row;};
function assertAttendanceSession(row,sessionId){
    if(sessionId!==undefined&&(row.tipo!=='INGRESSO_SESSAO'||String(row.sessao_vinculada)!==sessionId)){
        throw conflict('O código não corresponde a um ingresso desta sessão');
    }
}
const instant=value=>value?Date.parse(/[Z+-]\d*:?\d*$/.test(String(value).slice(10))?String(value):`${String(value).replace(' ','T')}Z`):null;
const asSql=ms=>new Date(ms).toISOString().replace('T',' ').replace('Z','').slice(0,23);
const typeOf=item=>item.id_sessao?'INGRESSO_SESSAO':item.id_combo||item.id_insumo?'RETIRADA_INSUMO':'ACESSO_STREAMING';
const effectiveStatus=row=>row.status==='GERADO'&&row.expira_em&&instant(row.expira_em)<=Date.now()?'EXPIRADO':row.status;
const admissionOpen=row=>row.tipo!=='INGRESSO_SESSAO'||!['CANCELADA','INTERROMPIDA','ENCERRADA'].includes(row.sessao_status);
const reentryOpen=row=>row.expira_em?instant(row.expira_em)>Date.now():row.data&&row.horario_inicio&&row.horario_fim?interval(row).end>Date.now():false;
const dto=(row,owner=false)=>({id:idString(row.id_ticket),itemId:idString(row.id_item),type:row.tipo,unit:Number(row.unidade),status:effectiveStatus(row),presence:row.tipo==='INGRESSO_SESSAO'&&row.ultima_passagem?row.ultima_passagem==='ENTRADA'?'DENTRO':'FORA':null,expiresAt:row.expira_em?new Date(instant(row.expira_em)).toISOString():null,usedAt:row.data_utilizacao?new Date(instant(row.data_utilizacao)).toISOString():null,exitedAt:row.saida_em?new Date(instant(row.saida_em)).toISOString():null,...(owner?{code:row.codigo}:{})});
const date=value=>value?new Date(instant(value)).toISOString():null;
const nullableId=value=>value==null?null:idString(value);
const nullableMoney=value=>value==null?null:moneyString(value);
const recordFields={
    orders:['sessionOrders','id_pedido',(row,admin)=>({
        orderId:idString(row.id_pedido),buyerName:row.nome_comprador??null,channel:row.canal??'SITE',
        status:row.status,placedAt:date(row.data_pedido),expiresAt:date(row.checkout_expira_em),
        ...(admin&&{total:moneyString(row.valor_total),buyerId:row.tipo_usuario==='CLIENTE'?nullableId(row.id_usuario):null})
    })],
    staff:['sessionStaff','id_usuario',row=>({personId:idString(row.id_usuario),name:row.nome,role:row.tipo_usuario,sources:row.sources.split(',')})],
    payments:['sessionPayments','id_pagamento',row=>({paymentId:idString(row.id_pagamento),orderId:idString(row.id_pedido),status:row.status,
        amount:moneyString(row.valor),method:row.tipo??null,paidAt:date(row.data_pagamento)})],
    refunds:['sessionRefunds','id_reembolso',row=>({refundId:idString(row.id_reembolso),paymentId:idString(row.id_pagamento),orderId:idString(row.id_pedido),
        status:row.status,requestedAmount:nullableMoney(row.valor_solicitado),confirmedAmount:nullableMoney(row.valor_confirmado),requestedAt:date(row.solicitado_em)})],
    audit:['sessionAudit','id_auditoria',row=>({eventId:idString(row.id_auditoria),type:row.event_type,at:date(row.occurred_at),
        actorId:nullableId(row.id_usuario),actorName:row.nome??null})]
};

export function createTicketService({model,identity}){
    async function staff(c,context,sessionId,localId){
        const actor=await identity.activeActor(c,context),role=actor.tipo_usuario;
        if(!['ADMIN','SUPERVISOR','COLABORADOR'].includes(role))throw ApiError.acessoNegado();
        if(!localId)throw ApiError.naoEncontrado();
        if(role!=='ADMIN'&&!await model.staffScope(c,actor.id_usuario,role,sessionId??null,localId))throw ApiError.acessoNegado();
        return actor;
    }
    async function issueItems(c,orderId){
        const items=await model.orderItems(c,orderId);
        if(!items.length)return null;
        let count=0;
        const prepared=[];
        for(const item of items){
            const qty=Number(item.quantidade);
            if(!Number.isSafeInteger(qty)||qty<1||qty>100||((count+=qty)>500))return null;
            const type=typeOf(item);
            if(type==='INGRESSO_SESSAO'&&qty!==1)return null;
            let expiresAt=null;
            if(item.id_sessao||item.id_sessao_retirada){
                if(!item.data||!item.horario_inicio||!item.horario_fim||['CANCELADA','INTERROMPIDA'].includes(item.sessao_status))return null;
                const end=interval(item).end;
                const limit=end+(item.id_combo?1800000:0);
                if(limit<=Date.now())return null;
                expiresAt=asSql(limit);
            }
            prepared.push({item,type,qty,expiresAt});
        }
        return prepared;
    }
    async function canIssue(c,orderId){return Boolean(await issueItems(c,orderId));}
    async function issue(c,{orderId}){
        if(!c?.execute)throw new TypeError('Conexão transacional obrigatória');
        orderId=idString(orderId);
        const order=found(await model.order(c,orderId));
        if(!['PAGO','FINALIZADO'].includes(order.status)||!await model.approvedPayment(c,orderId))throw conflict('Pedido sem pagamento aprovado');
        const prepared=await issueItems(c,orderId);
        if(!prepared)throw conflict('Itens ou validade incompatíveis com emissão');
        let created=0;
        for(const {item,type,qty,expiresAt} of prepared){
            for(let unit=1;unit<=qty;unit++){
                if(await model.existingUnit(c,item.id_item,type,unit))continue;
                const code=randomBytes(32).toString('base64url');
                await model.insertUnit(c,{itemId:item.id_item,type,unit,code,sessionId:item.id_combo?item.id_sessao_retirada:null,expiresAt});
                created++;
            }
        }
        return {created};
    }
    async function ownerTickets(orderId,{limit=50,cursor='0'},context){return identity.transaction(async c=>{
        const actor=await identity.activeActor(c,context);
        if(actor.tipo_usuario!=='CLIENTE')throw ApiError.acessoNegado();
        found(await model.ownOrder(c,orderId,actor.id_usuario));
        const rows=await model.ownerTickets(c,orderId,limit,cursor),page=rows.slice(0,limit);
        return {items:page.map(row=>dto(row,true)),pagination:{limit,nextCursor:rows.length>limit?idString(page.at(-1).id_ticket):null}};
    },context);}
    async function sessionTickets(sessionId,{limit=50,cursor='0',presence},context){return identity.transaction(async c=>{
        const location=found(await model.sessionLocal(c,sessionId));
        await staff(c,context,sessionId,location.id_local);
        const rows=await model.sessionTickets(c,sessionId,limit,cursor,presence),page=rows.slice(0,limit);
        return {items:page.map(row=>({...dto(row),orderId:nullableId(row.id_pedido),buyerName:row.nome_comprador??null,
            channel:row.canal??'SITE',seat:row.fileira==null?null:`${row.fileira}${row.numero}`,attendanceStatus:row.registro_presenca??null})),
            pagination:{limit,nextCursor:rows.length>limit?idString(page.at(-1).id_ticket):null}};
    },context);}
    async function validate(code,context,sessionId){return identity.transaction(async c=>{
        const row=found(await model.byCode(c,code));
        await staff(c,context,row.sessao_vinculada,row.id_local);
        assertAttendanceSession(row,sessionId);
        const open=admissionOpen(row)&&['PAGO','FINALIZADO'].includes(row.pedido_status);
        return {...dto(row),valid:open&&effectiveStatus(row)==='GERADO',reentryAllowed:open&&row.tipo==='INGRESSO_SESSAO'&&row.status==='UTILIZADO'&&row.ultima_passagem==='SAIDA'&&reentryOpen(row),halfEvidenceRequired:row.tipo_ingresso==='MEIA'};
    },context);}
    async function consume(code,halfEvidenceType,context,sessionId){return identity.transaction(async c=>{
        const row=found(await model.byCode(c,code,true));
        const actor=await staff(c,context,row.sessao_vinculada,row.id_local);
        assertAttendanceSession(row,sessionId);
        return consumeOn(c,row,actor,halfEvidenceType,context);
    },context);}
    async function consumeOn(c,row,actor,halfEvidenceType,context){
        if(!admissionOpen(row)||!['PAGO','FINALIZADO'].includes(row.pedido_status)||effectiveStatus(row)!=='GERADO'||row.tipo==='ACESSO_STREAMING')throw conflict('Este ingresso não permite entrada agora.');
        if(row.tipo_ingresso==='MEIA'&&!halfEvidenceType)throw ApiError.validacao('Comprovação de meia deve ser conferida na portaria');
        if(row.tipo_ingresso!=='MEIA'&&halfEvidenceType)throw ApiError.validacao('Comprovação não se aplica ao ticket');
        if(!await model.consume(c,row.id_ticket,actor.id_usuario,halfEvidenceType??null))throw conflict('Ticket já consumido ou expirado');
        if(row.tipo==='INGRESSO_SESSAO')await model.appendPassage(c,row.id_ticket,'ENTRADA',actor.id_usuario,halfEvidenceType??null);
        await identity.audit(c,'TICKET.CONSUMED',row.id_ticket,context);
        return {...dto({...row,status:'UTILIZADO',data_utilizacao:new Date().toISOString(),ultima_passagem:row.tipo==='INGRESSO_SESSAO'?'ENTRADA':null}),halfEvidenceChecked:row.tipo_ingresso==='MEIA'};
    }
    async function exit(code,context,sessionId){return identity.transaction(async c=>{
        const row=found(await model.byCode(c,code,true));
        const actor=await staff(c,context,row.sessao_vinculada,row.id_local);
        assertAttendanceSession(row,sessionId);
        return exitOn(c,row,actor,context);
    },context);}
    async function exitOn(c,row,actor,context){
        if(row.tipo!=='INGRESSO_SESSAO'||row.status!=='UTILIZADO')throw conflict('Registre a entrada antes de registrar a saída.');
        const last=await model.lastPassage(c,row.id_ticket);
        if(last?.tipo!=='ENTRADA')throw conflict('Saída exige presença ativa');
        if(!await model.exit(c,row.id_ticket,actor.id_usuario))throw conflict('Saída já registrada');
        await model.appendPassage(c,row.id_ticket,'SAIDA',actor.id_usuario);
        await identity.audit(c,'TICKET.EXITED',row.id_ticket,context);
        return dto({...row,saida_em:new Date().toISOString(),ultima_passagem:'SAIDA'});
    }
    async function entry(code,halfEvidenceType,context,sessionId){return identity.transaction(async c=>{
        const row=found(await model.byCode(c,code,true));
        const actor=await staff(c,context,row.sessao_vinculada,row.id_local);
        assertAttendanceSession(row,sessionId);
        return reenterOn(c,row,actor,halfEvidenceType,context);
    },context);}
    async function reenterOn(c,row,actor,halfEvidenceType,context){
        if(!admissionOpen(row)||row.tipo!=='INGRESSO_SESSAO'||row.status!=='UTILIZADO'||!['PAGO','FINALIZADO'].includes(row.pedido_status)||!reentryOpen(row))throw conflict('Reentrada indisponível');
        const last=await model.lastPassage(c,row.id_ticket);
        if(last?.tipo!=='SAIDA')throw conflict('Reentrada exige saída anterior');
        if(row.tipo_ingresso==='MEIA'&&!halfEvidenceType)throw ApiError.validacao('Comprovação de meia deve ser conferida na portaria');
        if(row.tipo_ingresso!=='MEIA'&&halfEvidenceType)throw ApiError.validacao('Comprovação não se aplica ao ticket');
        await model.appendPassage(c,row.id_ticket,'ENTRADA',actor.id_usuario,halfEvidenceType??null);
        await identity.audit(c,'TICKET.REENTERED',row.id_ticket,context);
        return {...dto({...row,ultima_passagem:'ENTRADA'}),halfEvidenceChecked:row.tipo_ingresso==='MEIA'};
    }
    async function supervisorScope(c,sessionId,context){
        const location=found(await model.sessionLocal(c,sessionId));
        const actor=await staff(c,context,sessionId,location.id_local);
        if(actor.tipo_usuario!=='SUPERVISOR')throw ApiError.acessoNegado();
        return actor;
    }
    async function customerTickets(sessionId,query,context){return identity.transaction(async c=>{
        await supervisorScope(c,sessionId,context);
        const rows=await model.customerAttendanceTickets(c,sessionId,customerSearchTerm(query.q),query.limit,query.cursor??'0');
        const page=rows.slice(0,query.limit);
        return {items:page.map(row=>({...dto(row),name:row.nome,emailHint:maskedCustomerEmail(row.email),
            seat:row.fileira==null?null:`${row.fileira}${row.numero}`,halfEvidenceRequired:row.tipo_ingresso==='MEIA'})),
            pagination:{nextCursor:rows.length>query.limit?idString(page.at(-1).id_ticket):null}};
    },context);}
    async function customerPassage(sessionId,input,context){return identity.transaction(async c=>{
        const actor=await supervisorScope(c,sessionId,context);
        const row=found(await model.byAttendanceId(c,sessionId,input.ticketId));
        if(input.direction==='SAIDA')return exitOn(c,row,actor,context);
        return effectiveStatus(row)==='GERADO'
            ?consumeOn(c,row,actor,input.halfEvidenceType,context)
            :reenterOn(c,row,actor,input.halfEvidenceType,context);
    },context);}
    async function attendance(sessionId,{limit=50,cursor='0'},context){return identity.transaction(async c=>{
        const location=found(await model.sessionLocal(c,sessionId));
        const actor=await staff(c,context,sessionId,location.id_local);
        const summary=await model.attendanceSummary(c,sessionId);
        const rows=await model.attendance(c,sessionId,limit,cursor),page=rows.slice(0,limit);
        return {summary:{total:Number(summary.total),entered:Number(summary.entered),inside:Number(summary.inside),exited:Number(summary.exited),late:Number(summary.late),absent:Number(summary.absent??0)},items:page.map(row=>({id:idString(row.id_passagem),ticketId:idString(row.id_ticket),type:row.tipo,at:new Date(instant(row.ocorrido_em)).toISOString(),staffId:row.id_usuario_staff?idString(row.id_usuario_staff):null,
            ...(actor.tipo_usuario==='SUPERVISOR'&&row.customer_name&&{customerName:row.customer_name})})),pagination:{limit,nextCursor:rows.length>limit?idString(page.at(-1).id_passagem):null}};
    },context);}
    async function pendingOrders(sessionId,{limit=50,cursor='0'},context){return identity.transaction(async c=>{
        const location=found(await model.sessionLocal(c,sessionId));
        await staff(c,context,sessionId,location.id_local);
        const rows=await model.pendingSessionOrders(c,sessionId,limit,cursor);
        const page=rows.slice(0,limit);
        return {
            items:page.map(row=>({orderId:idString(row.id_pedido),expiresAt:new Date(instant(row.checkout_expira_em)).toISOString()})),
            pagination:{limit,nextCursor:rows.length>limit?idString(page.at(-1).id_pedido):null},
        };
    },context);}
    async function sessionRecords(sessionId,section,{limit=50,cursor='0'},context){return identity.transaction(async c=>{
        const location=found(await model.sessionLocal(c,sessionId));
        const actor=await staff(c,context,sessionId,location.id_local);
        const admin=actor.tipo_usuario==='ADMIN';
        if(section!=='orders'&&!admin)throw ApiError.acessoNegado();
        const [method,key,project]=recordFields[section];
        const rows=await model[method](c,sessionId,limit,cursor),page=rows.slice(0,limit);
        return {items:page.map(row=>project(row,admin)),pagination:{limit,nextCursor:rows.length>limit?idString(page.at(-1)[key]):null}};
    },context);}
    async function seatMap(sessionId,context){
        return identity.transaction(async c=>{
            const session=found(await model.sessionLocal(c,sessionId));
            await staff(c,context,sessionId,session.id_local);
            const rows=await model.sessionSeatMap(c,sessionId);
            return {sessionId,seats:rows.map(row=>({
                seatId:idString(row.id_assento),row:row.fileira,number:row.numero,position:row.posicao_visual??row.numero,type:row.tipo,
                availability:row.status!=='ATIVA'?'INDISPONIVEL':row.estado==='CONFIRMADA'?'VENDIDO':row.estado==='RESERVADA'?'RESERVADO':'DISPONIVEL',
                orderId:nullableId(row.id_pedido),customerName:row.nome_comprador??null,
                orderStatus:row.pedido_status??null,reservedUntil:row.id_pedido!=null&&row.estado==='RESERVADA'?date(row.expira_em):null
            }))};
        },context);
    }
    return {canIssue,issue,ownerTickets,sessionTickets,validate,consume,exit,entry,attendance,pendingOrders,customerTickets,customerPassage,sessionRecords,seatMap};
}
