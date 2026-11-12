import { readFile,writeFile } from 'node:fs/promises';
import { supplyOperations } from '../src/routes/supplyRoutes.js';

const file=new URL('../src/docs/openapi.json',import.meta.url),spec=JSON.parse(await readFile(file,'utf8'));
spec.tags=[...spec.tags.filter(x=>x.name!=='Suprimentos'),{name:'Suprimentos',description:'Solicitações, envio, trânsito e recebimento de materiais.'}];
const id={type:'string',pattern:'^[1-9][0-9]{0,9}$'};
const object=(properties,required=Object.keys(properties))=>({type:'object',additionalProperties:false,properties,...(required.length?{required}:{})});
const ref=name=>({$ref:`#/components/schemas/${name}`});
const response=data=>({description:'Sucesso',content:{'application/json':{schema:object({success:{type:'boolean',enum:[true]},data,requestId:{type:'string',format:'uuid'}})}}});
const nullableId={...id,nullable:true};
const statusReq={type:'string',enum:['PENDENTE','APROVADA','RECUSADA','FINALIZADA']};
const statusShip={type:'string',enum:['PENDENTE','ENVIADO','EM_TRANSITO','RECEBIDO','CANCELADO','DEVOLVIDO']};
const distance={type:'string',pattern:'^[0-9]{1,6}(?:\\.[0-9]{1,2})?$'};
const duration={type:'integer',minimum:1,maximum:10080};
const routeStatus={type:'string',enum:['ATIVO','INATIVO']};
const routeMetrics={distancia_km:distance,tempo_estimado_min:duration};
spec.components.schemas.LogisticsRoute=object({id_rota:id,id_local_origem:id,id_local_destino:id,nome_origem:{type:'string'},nome_destino:{type:'string'},...routeMetrics,status:routeStatus});
spec.components.schemas.ReplenishmentInputLink=object({id_vinculo:id,id_insumo_origem:id,id_insumo_destino:id,id_local_origem:id,id_local_destino:id,
    nome_insumo_origem:{type:'string'},nome_insumo_destino:{type:'string'},nome_local_origem:{type:'string'},nome_local_destino:{type:'string'}});
spec.components.schemas.StockRequest=object({id_solicitacao:id,id_usuario:id,id_local:id,id_sessao:nullableId,id_insumo:nullableId,id_equipamento:nullableId,quantidade:{type:'integer',minimum:1},status:statusReq,observacao:{type:'string',nullable:true},data_solicitacao:{type:'string'},nome_item:{type:'string',nullable:true},distancia_km:{...distance,nullable:true},tempo_estimado_min:{...duration,nullable:true},estoque_origem:{type:'string',nullable:true,enum:['DISPONIVEL','SALDO_INSUFICIENTE','INDISPONIVEL',null]}});
const stockRequest = spec.components.schemas.StockRequest;
Object.assign(stockRequest.properties, {
    status_supervisao: { type:'string', nullable:true, enum:['PENDENTE','APROVADA','RECUSADA',null] },
    id_supervisor_decisao: nullableId,
    data_decisao_supervisao: { type:'string', nullable:true }
});
stockRequest.required.push('status_supervisao','id_supervisor_decisao','data_decisao_supervisao');
spec.components.schemas.Logistics=object({id_logistica:id,id_fornecedor:id,id_local_origem:nullableId,id_local_destino:id,id_solicitacao:nullableId,id_insumo_origem:nullableId,id_equipamento_origem:nullableId,id_insumo_destino:nullableId,quantidade:{type:'integer',nullable:true},status:statusShip,data_envio:{type:'string',nullable:true},data_prevista:{type:'string',nullable:true},data_recebimento:{type:'string',nullable:true},data_devolucao:{type:'string',nullable:true},id_usuario_recebimento:nullableId,id_usuario_devolucao:nullableId,observacao:{type:'string',nullable:true},devolucao_disponivel:{type:'boolean'}});
const logistics = spec.components.schemas.Logistics;
Object.assign(logistics.properties,{id_transporte:nullableId,nome_transporte:{type:'string',nullable:true}});
logistics.required.push('id_transporte','nome_transporte');
const incidentTypes = ['ACIDENTE','EXTRAVIO','PERDA'];
const eventId = {type:'string',pattern:'^[1-9][0-9]{0,19}$'};
spec.components.schemas.LogisticsEvent=object({id_evento:eventId,id_usuario:id,tipo:{type:'string',enum:['STATUS',...incidentTypes]},status:statusShip,descricao:{type:'string',nullable:true},criado_em:{type:'string'}});
spec.components.schemas.LocalStock=object({id_local:id,inputs:{type:'array',items:object({id_insumo:id,id_fornecedor:id,nome:{type:'string'},quantidade:{type:'integer'},disponivel:{type:'integer'},status:{type:'string',enum:['EM_ESTOQUE','SEM_ESTOQUE']}})},equipment:{type:'array',items:object({id_equipamento:id,id_fornecedor:id,nome:{type:'string'},quantidade:{type:'integer'},status:{type:'string',enum:['EM_ESTOQUE','SEM_ESTOQUE']}})},a_chegar:{type:'array',items:object({id_logistica:id,id_insumo:nullableId,id_equipamento:nullableId,nome:{type:'string'},quantidade:{type:'integer'},status:statusShip})}});
const list=schema=>object({items:{type:'array',items:ref(schema)},pagination:ref('Pagination')});
const errors={400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'};
for(const r of supplyOperations){
    const isRequest=r.path.includes('/stock/'),name=isRequest?'StockRequest':'Logistics';
    const description=r.path.includes('/input-links')
        ? 'Exclusivo para ADMIN. Um insumo de origem aponta para um insumo do mesmo fornecedor por unidade de destino. Salvar a mesma origem e unidade substitui o vínculo.'
        : r.action==='review'
        ? 'Supervisor da unidade revisa uma solicitação pendente. A aprovação encaminha ao fornecedor; a rejeição encerra a solicitação sem encaminhar.'
        : r.action==='alternatives'
        ? 'Origens de outros fornecedores com item de mesmo nome e categoria. A consulta é restrita à equipe autorizada da solicitação.'
        : r.action==='sources'
        ? 'Origens disponíveis para reposição no cinema do supervisor ou da equipe do colaborador.'
        : r.path.startsWith('/api/admin/')
        ? 'Exclusivo para ADMIN. Cada direção possui uma rota que pode ser editada ou inativada.'
        : 'Escopo por ADMIN, fornecedor proprietário, supervisor do cinema atribuído ou colaborador membro ativo da equipe da sessão. O envio usa a duração da rota ativa para registrar a previsão de chegada quando disponível.';
    const op={operationId:r.operationId,tags:['Suprimentos'],summary:r.operationId.replaceAll('_',' '),description,security:[{bearerAuth:[]}],parameters:[],responses:{}};
    if(r.path.includes('{id}'))op.parameters.push({name:'id',in:'path',required:true,schema:id});
    if(r.action==='alternatives'){
        const alternative=object({item_id:id,nome:{type:'string'},id_local_origem:id,nome_origem:{type:'string'},fornecedor:{type:'string'}});
        op.responses['200']=response(object({items:{type:'array',maxItems:5,items:alternative}}));
    }else if(r.action==='sources'){
        op.parameters.push({name:'localId',in:'query',schema:id},{name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:20}},
            {name:'cursor',in:'query',schema:id},{name:'kind',in:'query',schema:{type:'string',enum:['input','equipment'],default:'input'}});
        const source={nome:{type:'string'},id_local_origem:id,nome_origem:{type:'string'},disponivel:{type:'integer',minimum:1}};
        op.responses['200']=response(object({
            items:{type:'array',items:{oneOf:[object({id_insumo:id,...source}),object({id_equipamento:id,...source})]}},
            pagination:ref('Pagination')
        }));
    }else if(r.action==='logisticsRoutes'||r.action==='inputLinks'){
        op.parameters.push({name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:20}},{name:'cursor',in:'query',schema:id});
        op.responses['200']=response(list(r.action==='inputLinks'?'ReplenishmentInputLink':'LogisticsRoute'));
    }else if(r.action==='saveInputLink'){
        op.requestBody={required:true,content:{'application/json':{schema:object({sourceId:id,targetId:id})}}};
        op.responses['200']=response(ref('ReplenishmentInputLink'));
    }else if(r.action==='removeInputLink'){
        op.responses['204']={description:'Vínculo removido.'};
    }else if(r.action==='createLogisticsRoute'||r.action==='patchLogisticsRoute'){
        const creating=r.action==='createLogisticsRoute';
        const schema=creating?object({originId:id,destinationId:id,...routeMetrics})
            : {...object({...routeMetrics,status:routeStatus},[]),minProperties:1};
        op.requestBody={required:true,content:{'application/json':{schema}}};
        op.responses[creating?'201':'200']=response(ref('LogisticsRoute'));
    }else if(r.action==='stock'){
        op.parameters.push({name:'localId',in:'query',required:true,schema:id},{name:'sessionId',in:'query',schema:id});
        op.responses['200']=response(ref('LocalStock'));
    }else if(['requests','shipments'].includes(r.action)){
        op.parameters.push({name:'localId',in:'query',schema:id},{name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:20}},{name:'cursor',in:'query',schema:id});
        op.parameters.push({name:'sessionId',in:'query',schema:id});
        if(r.action==='requests')op.parameters.push({name:'status',in:'query',schema:statusReq});
        op.responses['200']=response(list(name));
    }else if(r.action==='createRequest'){
        op.description+=' Solicitações de colaboradores aguardam revisão do supervisor antes de aparecerem para o fornecedor.';
        op.requestBody={required:true,content:{'application/json':{schema:object({localId:id,sessionId:id,inputId:id,equipmentId:id,quantity:{type:'integer',minimum:1,maximum:2147483647},note:{type:'string',maxLength:2000}},['localId','quantity'])}}};
        op.responses['201']=response(ref(name));
    }else if(r.action==='review'){
        op.requestBody={required:true,content:{'application/json':{schema:object({decision:{type:'string',enum:['APROVADA','RECUSADA']}})}}};
        op.responses['200']=response(ref('StockRequest'));
    }else if(r.action==='send'){
        op.description+=' Exige transporte ativo, próprio do fornecedor e sem entrega em andamento.';
        op.requestBody={required:true,content:{'application/json':{schema:object({transportId:id})}}};
        op.responses['200']=response(ref('Logistics'));
    }else if(r.action==='history'){
        op.parameters.push({name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:20}},{name:'cursor',in:'query',schema:eventId});
        op.responses['200']=response(list('LogisticsEvent'));
    }else if(r.action==='incident'){
        op.description+=' Fornecedor proprietário ou ADMIN registra ocorrência em entrega enviada ou em trânsito, preservando o estado da entrega.';
        op.requestBody={required:true,content:{'application/json':{schema:object({type:{type:'string',enum:incidentTypes},description:{type:'string',minLength:1,maxLength:2000}})}}};
        op.responses['201']=response(ref('Logistics'));
    }else op.responses['200']=response(ref(name));
    for(const [code,error] of Object.entries(errors))op.responses[code]={$ref:`#/components/responses/${error}`};
    (spec.paths[r.path]??={})[r.method]=op;
}
await writeFile(file,`${JSON.stringify(spec,null,2)}\n`);
console.info(`Suprimentos: ${supplyOperations.length} operações documentadas.`);
