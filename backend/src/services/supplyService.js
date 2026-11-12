import { ApiError } from '../utils/ApiError.js';
import { unitReadLocation } from './unitReadScope.js';
import { idString } from '../utils/dto.js';

const found = row => { if (!row) throw ApiError.naoEncontrado(); return row; };
const conflict = message => new ApiError(message,409,null,'SUPPLY_CONFLICT');
const same = (a,b) => idString(a) === idString(b);
const itemKind = r => r.id_insumo ? 'input' : 'equipment';
const itemId = r => r.id_insumo ?? r.id_equipamento;
const requestDto = r => ({id_solicitacao:idString(r.id_solicitacao),id_usuario:idString(r.id_usuario),id_local:idString(r.id_local),id_sessao:r.id_sessao===null?null:idString(r.id_sessao),id_insumo:r.id_insumo===null?null:idString(r.id_insumo),id_equipamento:r.id_equipamento===null?null:idString(r.id_equipamento),quantidade:r.quantidade,status:r.status,observacao:r.observacao??null,data_solicitacao:r.data_solicitacao,
    nome_item:r.nome_item??null,distancia_km:r.distancia_km??null,tempo_estimado_min:r.tempo_estimado_min??null,
    estoque_origem:r.estoque_origem??null,status_supervisao:r.status_supervisao??null,
    id_supervisor_decisao:r.id_supervisor_decisao==null?null:idString(r.id_supervisor_decisao),data_decisao_supervisao:r.data_decisao_supervisao??null});
const forwarded = request => request.status_supervisao == null || request.status_supervisao === 'APROVADA';
const logisticsRouteDto = row => ({
    id_rota:idString(row.id_rota),
    id_local_origem:idString(row.id_local_origem),
    id_local_destino:idString(row.id_local_destino),
    nome_origem:row.nome_origem,
    nome_destino:row.nome_destino,
    distancia_km:row.distancia_km,
    tempo_estimado_min:row.tempo_estimado_min,
    status:row.status
});
const shipmentDto = r => ({id_logistica:idString(r.id_logistica),id_fornecedor:idString(r.id_fornecedor),id_local_origem:r.id_local_origem==null?null:idString(r.id_local_origem),id_local_destino:idString(r.id_local_destino),id_solicitacao:r.id_solicitacao==null?null:idString(r.id_solicitacao),id_insumo_origem:r.id_insumo_origem==null?null:idString(r.id_insumo_origem),id_equipamento_origem:r.id_equipamento_origem==null?null:idString(r.id_equipamento_origem),id_insumo_destino:r.id_insumo_destino==null?null:idString(r.id_insumo_destino),quantidade:r.quantidade,status:r.status,data_envio:r.data_envio??null,data_prevista:r.data_prevista??null,data_recebimento:r.data_recebimento??null,data_devolucao:r.data_devolucao??null,id_usuario_recebimento:r.id_usuario_recebimento==null?null:idString(r.id_usuario_recebimento),id_usuario_devolucao:r.id_usuario_devolucao==null?null:idString(r.id_usuario_devolucao),observacao:r.observacao??null,
    id_transporte:r.id_transporte==null?null:idString(r.id_transporte),nome_transporte:r.nome_transporte??null,
    devolucao_disponivel:Number(r.devolucao_disponivel)===1});
const page = (rows,q,dto,key) => { const items=rows.slice(0,q.limit);return {items:items.map(dto),pagination:{limit:q.limit,nextCursor:rows.length>q.limit?idString(items.at(-1)[key]):null}}; };
const inputLinkDto = row => ({
    id_vinculo:idString(row.id_vinculo),
    id_insumo_origem:idString(row.id_insumo_origem),
    id_insumo_destino:idString(row.id_insumo_destino),
    nome_insumo_origem:row.nome_insumo_origem,
    nome_insumo_destino:row.nome_insumo_destino,
    id_local_origem:idString(row.id_local_origem),
    id_local_destino:idString(row.id_local_destino),
    nome_local_origem:row.nome_local_origem,
    nome_local_destino:row.nome_local_destino
});
function validateInputTarget(source,target,localId) {
    if(!same(source.id_fornecedor,target.id_fornecedor)||!same(target.id_local,localId)||target.status!=='DISPONIVEL'){
        throw conflict('O insumo vinculado deve estar disponível no destino e pertencer ao mesmo fornecedor. Revise o vínculo no painel de Logística.');
    }
}
export function createSupplyService({model,identity,notifications}) {
    async function actor(c,context) { const a=await identity.activeActor(c,context);return {id:idString(a.id_usuario),role:a.tipo_usuario}; }
    async function staff(c,a,sessionId,localId,allowEnded=false) {
        if(a.role==='ADMIN')return;
        if(!['SUPERVISOR','COLABORADOR'].includes(a.role))throw ApiError.acessoNegado();
        if(a.role==='SUPERVISOR'){
            const location=await model.supervisorLocation(a.id,c);
            if(!location||!same(location.id_local,localId))throw ApiError.acessoNegado();
            if(!sessionId){if(!allowEnded)throw ApiError.acessoNegado();return;}
        }else if(!sessionId)throw ApiError.acessoNegado();
        const session=found(await model.session(sessionId,c));
        if(!same(session.id_local,localId)||!(allowEnded?['AGENDADA','EM_CARTAZ','ENCERRADA']:['AGENDADA','EM_CARTAZ']).includes(session.status)||session.local_status!=='ATIVO'||a.role==='COLABORADOR'&&!await model.member(a.id,sessionId,c))throw ApiError.acessoNegado();
    }
    async function supplier(c,a,id) {
        if(a.role==='ADMIN')return;
        if(a.role!=='FORNECEDOR')throw ApiError.acessoNegado();
        const own=found(await model.supplierByUser(a.id,c));
        if(own.status!=='ATIVO'||!same(own.id_fornecedor,id))throw ApiError.acessoNegado();
    }
    async function grant(c,supplierId,localId) {
        const g=found(await model.grant(supplierId,localId,c));
        if(g.supplier_status!=='ATIVO'||g.user_status!=='ATIVO'||g.tipo_usuario!=='FORNECEDOR'||g.grant_status!=='ATIVO'||g.local_status!=='ATIVO')throw conflict('Fornecedor ou local indisponível');
    }
    async function visibleRequest(c,a,r) {
        if(a.role==='ADMIN')return;
        if(a.role==='FORNECEDOR') {
            if(!forwarded(r))throw ApiError.naoEncontrado();
            const item=found(await model.item(itemKind(r),itemId(r),c));await supplier(c,a,item.id_fornecedor);return;
        }
        await staff(c,a,r.id_sessao,r.id_local,true);
    }
    const tx=(context,work)=>identity.transaction(async c=>work(c,await actor(c,context)),context);
    const adminTx=(context,work)=>tx(context,(c,a)=>{
        if(a.role!=='ADMIN')throw ApiError.acessoNegado();
        return work(c);
    });
    return {
        inputLinks:(q,context)=>adminTx(context,async c=>
            page(await model.inputLinks(q,c),q,inputLinkDto,'id_vinculo')),
        saveInputLink:(input,context)=>adminTx(context,async c=>{
            const source=found(await model.item('input',input.sourceId,c,true));
            const target=found(await model.item('input',input.targetId,c,true));
            if(same(source.id_local,target.id_local))throw conflict('Escolha insumos de unidades diferentes.');
            validateInputTarget(source,target,target.id_local);
            await grant(c,source.id_fornecedor,source.id_local);
            await grant(c,source.id_fornecedor,target.id_local);
            const link=found(await model.saveInputLink(c,input.sourceId,target.id_local,input.targetId));
            await identity.audit(c,'SUPPLY.INPUT_LINK_SAVED',idString(link.id_vinculo),context);
            return inputLinkDto(link);
        }),
        removeInputLink:(id,context)=>adminTx(context,async c=>{
            const [result]=await model.removeInputLink(c,id);
            if(result.affectedRows!==1)throw ApiError.naoEncontrado();
            await identity.audit(c,'SUPPLY.INPUT_LINK_REMOVED',id,context);
        }),
        logisticsRoutes:(q,context)=>adminTx(context,async c=>
            page(await model.logisticsRoutes(q,c),q,logisticsRouteDto,'id_rota')),
        createLogisticsRoute:(input,context)=>adminTx(context,async c=>{
            found(await model.local(input.originId,c));
            found(await model.local(input.destinationId,c));
            let id;
            try {
                id=await model.createLogisticsRoute(c,input);
            } catch(error) {
                if(error.code==='ER_DUP_ENTRY')throw conflict('Já existe uma rota nessa direção. Edite a rota cadastrada.');
                throw error;
            }
            await identity.audit(c,'LOGISTICS.ROUTE_CREATED',id,context);
            return logisticsRouteDto(found(await model.logisticsRoute(id,c)));
        }),
        patchLogisticsRoute:(id,input,context)=>adminTx(context,async c=>{
            found(await model.logisticsRoute(id,c));
            await model.updateLogisticsRoute(c,id,input);
            await identity.audit(c,'LOGISTICS.ROUTE_CHANGED',id,context);
            return logisticsRouteDto(found(await model.logisticsRoute(id,c)));
        }),
        async sources(q,context) { return tx(context,async(c,a)=>{
            const localId=await unitReadLocation(c,{id_usuario:a.id,tipo_usuario:a.role},q.localId);
            const equipment=q.kind==='equipment';
            const key=equipment?'id_equipamento':'id_insumo';
            const rows=equipment?await model.availableEquipment(localId,q,c):await model.availableInputs(localId,q,c);
            return page(rows,q,r=>({[key]:idString(r[key]),nome:r.nome,
                id_local_origem:idString(r.id_local_origem),nome_origem:r.nome_origem,disponivel:r.disponivel}),key);
        }); },
        async stock(q,context) { return tx(context,async(c,a)=>{
            if(a.role==='COLABORADOR')await unitReadLocation(c,{id_usuario:a.id,tipo_usuario:a.role},q.localId);
            else if(a.role!=='ADMIN')await staff(c,a,q.sessionId,q.localId,true);
            const local=found(await model.local(q.localId,c));if(local.status!=='ATIVO')throw conflict('Local indisponível');
            const stock=await model.stock(q.localId,c),incoming=await model.incoming(q.localId,c);
            return {id_local:q.localId,inputs:stock.inputs.map(r=>({id_insumo:idString(r.id),id_fornecedor:idString(r.id_fornecedor),nome:r.nome,quantidade:r.quantidade,disponivel:r.status==='DISPONIVEL'?r.quantidade-r.quantidade_reservada:0,status:r.status==='DISPONIVEL'&&r.quantidade-r.quantidade_reservada>0?'EM_ESTOQUE':'SEM_ESTOQUE'})),equipment:stock.equipment.map(r=>({id_equipamento:idString(r.id),id_fornecedor:idString(r.id_fornecedor),nome:r.nome,quantidade:r.quantidade,status:r.status==='DISPONIVEL'&&r.quantidade>0?'EM_ESTOQUE':'SEM_ESTOQUE'})),a_chegar:incoming.map(r=>({id_logistica:idString(r.id_logistica),id_insumo:r.id_insumo_origem==null?null:idString(r.id_insumo_origem),id_equipamento:r.id_equipamento_origem==null?null:idString(r.id_equipamento_origem),nome:r.nome,quantidade:r.quantidade,status:r.status}))};
        }); },
        async requests(q,context) { return tx(context,async(c,a)=>{if(!['ADMIN','SUPERVISOR','COLABORADOR','FORNECEDOR'].includes(a.role))throw ApiError.acessoNegado();if(a.role==='FORNECEDOR'){const own=found(await model.supplierByUser(a.id,c));if(own.status!=='ATIVO')throw ApiError.acessoNegado();q.supplierId=idString(own.id_fornecedor);}if(a.role==='SUPERVISOR'){const location=await model.supervisorLocation(a.id,c);if(!location||q.localId&&!same(q.localId,location.id_local))throw ApiError.acessoNegado();q.localId=idString(location.id_local);if(q.sessionId)await staff(c,a,q.sessionId,q.localId,true);}if(a.role==='COLABORADOR'){if(!q.sessionId||!q.localId)throw ApiError.validacao('localId e sessionId obrigatórios');await staff(c,a,q.sessionId,q.localId,true);}return page(await model.listRequests(q,c),q,requestDto,'id_solicitacao');}); },
        async request(id,context) { return tx(context,async(c,a)=>{const r=found(await model.request(id,c));await visibleRequest(c,a,r);return requestDto(r);}); },
        alternatives:(id,context)=>tx(context,async(c,a)=>{
            if(!['SUPERVISOR','COLABORADOR'].includes(a.role))throw ApiError.acessoNegado();
            const request=found(await model.request(id,c));
            await staff(c,a,request.id_sessao,request.id_local,true);
            if(request.status!=='RECUSADA'&&(request.status!=='PENDENTE'||request.estoque_origem==='DISPONIVEL')) {
                return {items:[]};
            }
            if(request.id_sessao&&(await model.session(request.id_sessao,c))?.status==='ENCERRADA')return {items:[]};
            const kind=itemKind(request);
            const source=await model.item(kind,itemId(request),c);
            if(!source?.categoria?.trim())return {items:[]};
            const rows=await model.alternativeSources(c,kind,source,request.id_local,request.quantidade);
            return {items:rows.map(row=>({item_id:idString(row.item_id),nome:row.nome,
                id_local_origem:idString(row.id_local_origem),nome_origem:row.nome_origem,fornecedor:row.fornecedor}))};
        }),
        async createRequest(input,context) { return tx(context,async(c,a)=>{
            if(!['ADMIN','SUPERVISOR','COLABORADOR'].includes(a.role))throw ApiError.acessoNegado();
            const local=found(await model.local(input.localId,c));if(local.status!=='ATIVO')throw conflict('Local indisponível');
            await staff(c,a,input.sessionId,input.localId,a.role==='SUPERVISOR'&&!input.sessionId);
            if(input.sessionId){const s=found(await model.session(input.sessionId,c));if(!same(s.id_local,input.localId)||!['AGENDADA','EM_CARTAZ'].includes(s.status))throw conflict('Sessão incompatível');}
            const kind=input.inputId?'input':'equipment', item=found(await model.item(kind,input.inputId??input.equipmentId,c,kind==='equipment'));
            if(item.status!=='DISPONIVEL')throw conflict('Item indisponível');
            if(kind==='equipment'&&(input.quantity!==item.quantidade||await model.equipmentInTransit(input.equipmentId,c))) {
                throw conflict('Equipamento exige transferência integral e livre');
            }
            await grant(c,item.id_fornecedor,item.id_local);await grant(c,item.id_fornecedor,input.localId);
            const id=await model.createRequest(c,{...input,actorId:a.id,statusSupervisao:a.role==='COLABORADOR'?'PENDENTE':null});
            await identity.audit(c,'SUPPLY.REQUESTED',id,context);return requestDto(found(await model.request(id,c)));
        }); },
        async review(id,status,context) { return tx(context,async(c,a)=>{
            if(a.role!=='SUPERVISOR')throw ApiError.acessoNegado();
            const request=found(await model.request(id,c,true));
            await staff(c,a,request.id_sessao,request.id_local,true);
            if(request.status_supervisao!=='PENDENTE'||request.status!=='PENDENTE')throw conflict('Solicitação já decidida ou fora da fila de supervisão');
            if(!['APROVADA','RECUSADA'].includes(status))throw ApiError.validacao('Decisão inválida');
            await model.setSupervisorReview(c,id,status,a.id);
            await notifications?.emit(c,{
                recipientId:idString(request.id_usuario),title:'Decisão sobre reposição',
                message:status==='APROVADA'?`A solicitação #${id} foi aprovada e encaminhada ao fornecedor.`:`A solicitação #${id} foi rejeitada pela supervisão.`,
                type:'SUPPLY_SUPERVISOR_REVIEW',dedupeKey:`supply-supervisor-review:${id}`
            });
            await identity.audit(c,`SUPPLY.SUPERVISION_${status}`,id,context);
            return requestDto(found(await model.request(id,c)));
        }); },
        async decide(id,status,context) { return tx(context,async(c,a)=>{
            if(!['ADMIN','FORNECEDOR'].includes(a.role))throw ApiError.acessoNegado();
            const r=found(await model.request(id,c,true));
            if(!forwarded(r))throw ApiError.naoEncontrado();
            const item=found(await model.item(itemKind(r),itemId(r),c,true));await supplier(c,a,item.id_fornecedor);
            if(r.status!== 'PENDENTE')throw conflict('Solicitação já decidida');
            await grant(c,item.id_fornecedor,item.id_local);await grant(c,item.id_fornecedor,r.id_local);
            if(status==='APROVADA'){
                if(item.status!=='DISPONIVEL'||item.quantidade-(item.quantidade_reservada??0)<r.quantidade)throw conflict('Saldo insuficiente');
                if(itemKind(r)==='equipment'&&(item.quantidade!==r.quantidade||await model.equipmentInTransit(itemId(r),c)))throw conflict('Equipamento exige transferência integral e livre');
                if(await model.shipmentByRequest(id,c))throw conflict('Envio já vinculado');
                const shipmentId=await model.createShipment(c,{supplierId:item.id_fornecedor,originId:item.id_local,destinationId:r.id_local,requestId:id,inputId:r.id_insumo,equipmentId:r.id_equipamento,quantity:r.quantidade});
                await model.shipmentEvent(c,shipmentId,a.id,'STATUS','PENDENTE');
            }
            await model.setRequest(c,id,status);await identity.audit(c,`SUPPLY.${status}`,id,context);return requestDto(found(await model.request(id,c)));
        }); },
        async shipments(q,context) { return tx(context,async(c,a)=>{if(!['ADMIN','FORNECEDOR','SUPERVISOR','COLABORADOR'].includes(a.role))throw ApiError.acessoNegado();if(a.role==='FORNECEDOR'){const own=found(await model.supplierByUser(a.id,c));if(own.status!=='ATIVO')throw ApiError.acessoNegado();q.supplierId=idString(own.id_fornecedor);}if(a.role==='SUPERVISOR'){const location=await model.supervisorLocation(a.id,c);if(!location||q.localId&&!same(q.localId,location.id_local))throw ApiError.acessoNegado();q.localId=idString(location.id_local);if(q.sessionId)await staff(c,a,q.sessionId,q.localId,true);}if(a.role==='COLABORADOR'){if(!q.localId||!q.sessionId)throw ApiError.validacao('localId e sessionId obrigatórios');await staff(c,a,q.sessionId,q.localId,true);}return page(await model.listShipments(q,c),q,shipmentDto,'id_logistica');}); },
        async shipment(id,context) { return tx(context,async(c,a)=>{const r=found(await model.shipment(id,c));await supplierOrStaff(c,a,r);return shipmentDto(r);}); },
        async history(id,q,context) { return tx(context,async(c,a)=>{
            const shipment=found(await model.shipment(id,c));
            await supplierOrStaff(c,a,shipment);
            return page(await model.shipmentEvents(c,id,q),q,event=>({
                ...event,id_evento:idString(event.id_evento),id_usuario:idString(event.id_usuario)
            }),'id_evento');
        }); },
        async reportIncident(id,input,context) { return tx(context,async(c,a)=>{
            const shipment=found(await model.shipment(id,c,true));
            await supplier(c,a,shipment.id_fornecedor);
            if(!['ENVIADO','EM_TRANSITO'].includes(shipment.status))throw conflict('Registre ocorrências em entregas enviadas ou em trânsito.');
            await model.shipmentEvent(c,id,a.id,input.type,shipment.status,input.description);
            await identity.audit(c,'LOGISTICS.INCIDENT_RECORDED',id,context);
            return shipmentDto(found(await model.shipment(id,c)));
        }); },
        async returnEquipment(id,context) { return tx(context,async(c,a)=>{
            const initial=found(await model.shipment(id,c));
            if(a.role==='FORNECEDOR')await supplier(c,a,initial.id_fornecedor);
            const request=found(await model.request(initial.id_solicitacao,c,true));
            if(!initial.id_equipamento_origem)throw conflict('Devolução exige equipamento recebido');
            const equipment=found(await model.item('equipment',initial.id_equipamento_origem,c,true));
            const r=found(await model.shipment(id,c,true));
            if(!r.id_equipamento_origem||r.status!=='RECEBIDO'||request.status!=='FINALIZADA')throw conflict('Devolução exige equipamento recebido');
            const session=found(await model.session(request.id_sessao,c));
            if(session.status!=='ENCERRADA')throw conflict('Sessão ainda não encerrada');
            if(a.role!=='ADMIN'&&a.role!=='FORNECEDOR')await staff(c,a,request.id_sessao,request.id_local,true);
            if(!same(equipment.id_fornecedor,r.id_fornecedor)||!same(equipment.id_local,r.id_local_destino)||equipment.quantidade!==r.quantidade)throw conflict('Equipamento ou local divergente');
            await grant(c,r.id_fornecedor,r.id_local_origem);await grant(c,r.id_fornecedor,r.id_local_destino);
            await model.changeEquipment(c,r.id_equipamento_origem,r.id_local_origem);
            await model.movement(c,{equipmentId:r.id_equipamento_origem,shipmentId:id,actorId:a.id,type:'DEVOLUCAO',quantity:r.quantidade,reason:`DEVOLUCAO:${r.id_local_destino}->${r.id_local_origem}`});
            await model.setReturned(c,id,a.id);
            await model.shipmentEvent(c,id,a.id,'STATUS','DEVOLVIDO');
            await identity.audit(c,'LOGISTICS.RETURNED',id,context);
            return shipmentDto(found(await model.shipment(id,c)));
        }); },
        async transitionShipment(id,action,context,input) { return tx(context,async(c,a)=>{
            const initial=found(await model.shipment(id,c));
            const request=found(await model.request(initial.id_solicitacao,c,true));
            const kind=itemKind(request),source=found(await model.item(kind,itemId(request),c,true));
            const r=found(await model.shipment(id,c,true));
            if(request.status!=='APROVADA'||!same(r.id_solicitacao,request.id_solicitacao))throw conflict('Solicitação incompatível');
            if(!same(source.id_fornecedor,r.id_fornecedor)||!same(source.id_local,r.id_local_origem)||!same(r.id_local_destino,request.id_local)||r.quantidade!==request.quantidade)throw conflict('Origem, destino ou item divergente');
            await grant(c,r.id_fornecedor,r.id_local_origem);await grant(c,r.id_fornecedor,r.id_local_destino);
            if(action==='send'){
                await supplier(c,a,r.id_fornecedor);if(r.status!=='PENDENTE')throw conflict('Envio já iniciado');
                if(!input?.transportId)throw ApiError.validacao('Selecione um transporte cadastrado.');
                const transport=await model.transport(c,input.transportId,r.id_fornecedor);
                if(transport?.status!=='ATIVO')throw conflict('Selecione um transporte ativo do fornecedor.');
                if(await model.transportInUse(c,input.transportId))throw conflict('Transporte ocupado por outra entrega.');
                if(source.status!=='DISPONIVEL'||source.quantidade-(source.quantidade_reservada??0)<r.quantidade)throw conflict('Saldo insuficiente');
                if(kind==='equipment'&&source.quantidade!==r.quantidade)throw conflict('Transferência parcial de equipamento indisponível');
                if(kind==='input'){const changed=await model.changeInput(c,itemId(request),-r.quantidade);if(changed[0].affectedRows!==1)throw conflict('Saldo insuficiente');}
                await model.movement(c,{inputId:r.id_insumo_origem,equipmentId:r.id_equipamento_origem,shipmentId:id,actorId:a.id,type:'SAIDA',quantity:-r.quantidade,reason:`ENVIO:${id}`});
                await model.setShipment(c,id,'ENVIADO',null,input.transportId);
                await notifications?.emit(c,{
                    recipientId:idString(request.id_usuario),
                    title:'Material enviado',
                    message:`O envio #${id} da sua solicitação #${request.id_solicitacao} foi confirmado.`,
                    type:'SUPPLY_SHIPMENT_SENT',
                    dedupeKey:`supply-shipment-sent:${id}`
                });
            }else if(action==='transit'){
                await supplier(c,a,r.id_fornecedor);if(r.status!=='ENVIADO')throw conflict('Estado de envio incompatível');await model.setShipment(c,id,'EM_TRANSITO');
            }else if(action==='receive'){
                if(a.role!=='ADMIN'){if(a.role==='FORNECEDOR')throw ApiError.acessoNegado();await staff(c,a,request.id_sessao,request.id_local,a.role==='SUPERVISOR'&&!request.id_sessao);}
                if(!['ENVIADO','EM_TRANSITO'].includes(r.status))throw conflict('Recebimento exige envio ativo');
                if(kind==='input'){
                    let targetId=itemId(request);
                    if(!same(r.id_local_origem,r.id_local_destino)){
                        const link=await model.inputLink(c,targetId,r.id_local_destino);
                        if(link){
                            targetId=idString(link.id_insumo_destino);
                            const target=found(await model.item('input',targetId,c,true));
                            validateInputTarget(source,target,r.id_local_destino);
                        }else targetId=await model.cloneInput(c,source,r.id_local_destino);
                        await model.setDestinationItem(c,id,targetId);
                    }
                    const changed=await model.changeInput(c,targetId,r.quantidade);if(changed[0].affectedRows!==1)throw conflict('Saldo de destino inválido');
                    await model.movement(c,{inputId:targetId,shipmentId:id,actorId:a.id,type:'ENTRADA',quantity:r.quantidade,reason:`RECEBIMENTO:${id}`});
                }else{
                    if(source.quantidade!==r.quantidade)throw conflict('Quantidade do equipamento alterada');
                    await model.changeEquipment(c,itemId(request),r.id_local_destino);
                    await model.movement(c,{equipmentId:itemId(request),shipmentId:id,actorId:a.id,type:'ENTRADA',quantity:r.quantidade,reason:`TRANSFERENCIA:${r.id_local_origem}->${r.id_local_destino}`});
                }
                await model.setShipment(c,id,'RECEBIDO',a.id);await model.setRequest(c,request.id_solicitacao,'FINALIZADA');
            }else if(action==='cancel'){
                await supplier(c,a,r.id_fornecedor);if(r.status!=='PENDENTE')throw conflict('Somente envio pendente pode ser cancelado');
                await model.setShipment(c,id,'CANCELADO');await model.setRequest(c,request.id_solicitacao,'RECUSADA');
            }
            const shipment=found(await model.shipment(id,c));
            await model.shipmentEvent(c,id,a.id,'STATUS',shipment.status);
            await identity.audit(c,`LOGISTICS.${action.toUpperCase()}`,id,context);return shipmentDto(shipment);
        }); }
    };
    async function supplierOrStaff(c,a,r){if(a.role==='ADMIN')return;if(a.role==='FORNECEDOR')return supplier(c,a,r.id_fornecedor);const req=found(await model.request(r.id_solicitacao,c));return staff(c,a,req.id_sessao,req.id_local,true);}
}
