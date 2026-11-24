import {readFile,writeFile} from 'node:fs/promises';
import {ticketOperations} from '../src/routes/ticketRoutes.js';

const file=new URL('../src/docs/openapi.json',import.meta.url),spec=JSON.parse(await readFile(file,'utf8'));
spec.info.description=spec.info.description.replace('tickets seguem na tarefa35.','tickets por unidade emitidos na aprovação e consumidos por equipe vinculada.');
spec.tags=[...spec.tags.filter(x=>x.name!=='Tickets'),{name:'Tickets',description:'Tickets por unidade, consulta e consumo por equipe vinculada.'}];
const id={type:'string',pattern:'^[1-9][0-9]{0,19}$'};
const obj=(properties,required=Object.keys(properties))=>({type:'object',additionalProperties:false,properties,required});
const ref=name=>({$ref:`#/components/schemas/${name}`});
const code={type:'string',pattern:'^[A-Za-z0-9_-]{43}$'};
const nullableDate={type:'string',format:'date-time',nullable:true};
const str={type:'string'}, nullableText={...str,nullable:true}, nullableId={...id,nullable:true};
const attendanceStates=['PRESENTE','SAIU','AUSENTE','AGUARDANDO','SEM_REGISTRO'];
const money={type:'string',example:'24.00'};
spec.components.schemas.Ticket=obj({id,itemId:id,type:{type:'string',enum:['INGRESSO_SESSAO','RETIRADA_INSUMO','ACESSO_STREAMING']},unit:{type:'integer',minimum:1},status:{type:'string',enum:['GERADO','UTILIZADO','CANCELADO','EXPIRADO']},presence:{type:'string',enum:['DENTRO','FORA'],nullable:true},expiresAt:nullableDate,usedAt:nullableDate,exitedAt:nullableDate});
spec.components.schemas.OwnerTicket=structuredClone(spec.components.schemas.Ticket);
spec.components.schemas.OwnerTicket.properties.code=code;
spec.components.schemas.OwnerTicket.required.push('code');
spec.components.schemas.SessionTicket=obj({...spec.components.schemas.Ticket.properties,
    orderId:nullableId,buyerName:nullableText,channel:{type:'string',enum:['SITE','APP','BALCAO']},
    seat:nullableText,attendanceStatus:{type:'string',enum:[...attendanceStates,null],nullable:true}});
spec.components.schemas.TicketValidation=structuredClone(spec.components.schemas.Ticket);
spec.components.schemas.TicketValidation.properties.valid={type:'boolean'};
spec.components.schemas.TicketValidation.properties.reentryAllowed={type:'boolean'};
spec.components.schemas.TicketValidation.properties.halfEvidenceRequired={type:'boolean'};
spec.components.schemas.TicketValidation.required.push('valid','reentryAllowed','halfEvidenceRequired');
spec.components.schemas.TicketConsumption=structuredClone(spec.components.schemas.Ticket);
spec.components.schemas.TicketConsumption.properties.halfEvidenceChecked={type:'boolean'};
spec.components.schemas.TicketConsumption.required.push('halfEvidenceChecked');
spec.components.schemas.TicketReentry=structuredClone(spec.components.schemas.TicketConsumption);
spec.components.schemas.TicketReentry.properties.presence={type:'string',enum:['DENTRO']};
spec.components.schemas.TicketPassage=obj({id,ticketId:id,type:{type:'string',enum:['ENTRADA','SAIDA']},at:{type:'string',format:'date-time'},staffId:{...id,nullable:true}});
spec.components.schemas.TicketPassage.properties.customerName={type:'string',description:'Disponível ao supervisor quando o ingresso tem cliente titular.'};
spec.components.schemas.AttendanceTicket=obj({...spec.components.schemas.Ticket.properties,
    name:{type:'string'},emailHint:{type:'string',nullable:true},seat:{type:'string',nullable:true},halfEvidenceRequired:{type:'boolean'}});
const envelope=schema=>obj({success:{type:'boolean',enum:[true]},data:schema,requestId:{type:'string',format:'uuid'}});
const page=schema=>obj({items:{type:'array',items:schema},pagination:obj({limit:{type:'integer'},nextCursor:{...id,nullable:true}})});
const attendancePage=obj({summary:obj(Object.fromEntries(['total','entered','inside','exited','late','absent'].map(key=>[key,{type:'integer',minimum:0}]))),items:{type:'array',items:ref('TicketPassage')},pagination:obj({limit:{type:'integer'},nextCursor:{...id,nullable:true}})});
const records={
    orders:obj({orderId:id,buyerName:nullableText,channel:{type:'string',enum:['SITE','APP','BALCAO']},status:str,placedAt:nullableDate,
        expiresAt:nullableDate,total:money,buyerId:nullableId},['orderId','buyerName','channel','status','placedAt','expiresAt']),
    staff:obj({personId:id,name:str,role:str,sources:{type:'array',items:str}}),
    payments:obj({paymentId:id,orderId:id,status:str,amount:money,method:nullableText,paidAt:nullableDate}),
    refunds:obj({refundId:id,paymentId:id,orderId:id,status:str,requestedAmount:{...money,nullable:true},confirmedAmount:{...money,nullable:true},requestedAt:nullableDate}),
    audit:obj({eventId:id,type:str,at:nullableDate,actorId:nullableId,actorName:nullableText})
};
const json=(description,schema,example)=>({description,content:{'application/json':{schema:envelope(schema),example:{success:true,data:example,requestId:'00000000-0000-4000-8000-000000000001'}}}});
const errors={400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'};
for(const route of ticketOperations){
    const owner=route.operationId==='list_order_tickets',session=route.operationId==='list_session_tickets',attendance=route.operationId==='list_session_attendance',validate=route.operationId==='validate_ticket',exit=route.operationId==='exit_ticket',entry=route.operationId==='reenter_ticket';
    const pending=route.operationId==='list_session_pending_orders';
    const sessionRecords=route.operationId==='list_session_records';
    const list=owner||session||attendance||pending||sessionRecords;
    const op={operationId:route.operationId,tags:['Tickets'],summary:({list_order_tickets:'Listar tickets do próprio pedido',list_session_tickets:'Ver tickets da sessão vinculada',list_session_attendance:'Histórico de entradas e saídas da sessão',validate_ticket:'Validar ticket sem consumir',consume_ticket:'Consumir ticket uma vez',exit_ticket:'Registrar saída do ingresso',reenter_ticket:'Registrar reentrada do ingresso'})[route.operationId],
        description:owner?'Somente CLIENTE dono do pedido recebe o código opaco. Ticket é emitido apenas após aprovação autenticada. Cada unidade comprada tem ticket próprio.':session?'ADMIN, supervisor do cinema ou colaborador membro ativo da equipe da sessão consultam tickets sem ver códigos.':attendance?'ADMIN, supervisor do cinema ou colaborador membro ativo da equipe da sessão consultam passagens, sem códigos ou documentos.':validate?'ADMIN, supervisor do cinema ou colaborador membro ativo da equipe consultam validade sem mudar estado.':exit?'ADMIN, supervisor do cinema ou colaborador membro ativo da equipe registram saída somente após entrada ativa; a passagem é append-only.':entry?'ADMIN, supervisor do cinema ou colaborador membro ativo da equipe registram reentrada somente após saída, antes do vencimento, com nova conferência de meia; UTILIZADO permanece.':'ADMIN, supervisor do cinema ou colaborador membro ativo da equipe consomem ticket uma vez. Ingresso cria a primeira entrada no histórico; retirada de insumo não cria presença. Meia exige conferência presencial mínima. Ticket expirado ou repetido retorna 409.',
        security:[{bearerAuth:[]}],parameters:list?[{name:owner?'orderId':'sessionId',in:'path',required:true,schema:id},{name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:50}},{name:'cursor',in:'query',schema:{type:'string',pattern:'^(0|[1-9][0-9]{0,19})$'}}]:[],responses:{}};
    if(route.operationId==='staff_session_seat_map'){
        op.summary='Consultar ocupação e clientes da sessão no mapa';
        op.description='Restrito ao Admin, supervisor da unidade e colaborador ativo da equipe da sessão. Exibe pedido e nome do cliente sem código de ingresso ou contato.';
        op.parameters=[{name:'sessionId',in:'path',required:true,schema:id}];
        const count={type:'integer',minimum:1};
        op.responses['200']=json('Espelho de assentos',obj({sessionId:id,seats:{type:'array',items:obj({
            seatId:id,row:str,number:count,position:count,type:str,
            availability:{type:'string',enum:['DISPONIVEL','RESERVADO','VENDIDO','INDISPONIVEL']},
            orderId:{...id,nullable:true},customerName:{...str,nullable:true},orderStatus:{...str,nullable:true},reservedUntil:{type:'string',format:'date-time',nullable:true}
        })}}),{sessionId:'1',seats:[]});
    }else if(sessionRecords){
        op.summary='Listar registros vinculados à sessão';
        op.description='Admin consulta todas as seções. Supervisor consulta pedidos da própria unidade. Colaborador consulta pedidos das sessões com vínculo ativo. Total e ID do cliente em pedidos são exclusivos do Admin.';
        op.parameters.push({name:'section',in:'path',required:true,schema:{type:'string',enum:Object.keys(records)}});
        op.responses['200']=json('Registros paginados',page({oneOf:Object.values(records)}),{items:[],pagination:{limit:50,nextCursor:null}});
    }else if(['find_attendance_tickets','register_customer_passage'].includes(route.operationId)){
        const find=route.method==='get';
        op.summary=find?'Buscar ingressos pagos da sessão pelo cliente':'Registrar passagem pelo ingresso selecionado';
        op.description='Somente supervisor da unidade da sessão. A busca usa nome ou e-mail completo e omite códigos e e-mails completos.';
        op.parameters=[{name:'sessionId',in:'path',required:true,schema:id}];
        if(find){
            op.parameters.push({name:'q',in:'query',required:true,schema:{type:'string',minLength:3,maxLength:254}},
                {name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:30,default:12}},{name:'cursor',in:'query',schema:id});
            op.responses['200']=json('Ingressos correspondentes',obj({items:{type:'array',items:ref('AttendanceTicket')},pagination:obj({nextCursor:{...id,nullable:true}})}),{items:[],pagination:{nextCursor:null}});
        }else{
            op.requestBody={required:true,content:{'application/json':{schema:{oneOf:[
                obj({ticketId:id,direction:{type:'string',enum:['ENTRADA']},halfEvidenceType:{type:'string',enum:['CIE','PCD','ID_JOVEM','IDOSO']}},['ticketId','direction']),
                obj({ticketId:id,direction:{type:'string',enum:['SAIDA']}}),
            ]}}}};
            op.responses['200']=json('Passagem registrada',{oneOf:[ref('Ticket'),ref('TicketConsumption')]},{id:'123',itemId:'456',type:'INGRESSO_SESSAO',unit:1,status:'UTILIZADO',presence:'DENTRO',expiresAt:null,usedAt:'2026-10-10T20:00:00.000Z',exitedAt:null,halfEvidenceChecked:false});
        }
    }else if(pending){
        op.summary='Listar pedidos da sessão aguardando pagamento';
        op.description='ADMIN, supervisor do cinema ou colaborador membro ativo da sessão consultam pedidos com reserva vigente, sem dados de clientes.';
        op.responses['200']=json('Página de pedidos pendentes',page(obj({orderId:id,expiresAt:{type:'string',format:'date-time'}})),{items:[],pagination:{limit:50,nextCursor:null}});
    }
    else if(list){
        if(session)op.parameters.push({name:'presence',in:'query',schema:{type:'string',enum:attendanceStates}});
        op.responses['200']=json(attendance?'Histórico e resumo de presença':'Página de tickets',
            attendance?attendancePage:page(ref(owner?'OwnerTicket':'SessionTicket')),
            {...(attendance?{summary:{total:1,entered:1,inside:0,exited:1,late:0,absent:0}}:{}),items:[],pagination:{limit:50,nextCursor:null}});
    }
    else{
        op.requestBody={required:true,content:{'application/json':{schema:obj({code,sessionId:{...id,description:'Quando informado, exige ingresso da sessão indicada.'},...(validate||exit?{}:{halfEvidenceType:{type:'string',enum:['CIE','PCD','ID_JOVEM','IDOSO']}})},['code']),example:{code:'mJQnV2DaK6x7B5tR8uYwQ9cE0fGhI1jKlMnOpQrStUv',sessionId:'5',...(validate||exit?{}:{halfEvidenceType:'CIE'})}}}};
        op.responses['200']=json(validate?'Validade sem consumo':exit?'Saída registrada':entry?'Reentrada registrada':'Ticket consumido',ref(validate?'TicketValidation':exit?'Ticket':entry?'TicketReentry':'TicketConsumption'),{id:'123',itemId:'456',type:'INGRESSO_SESSAO',unit:1,status:validate?'GERADO':'UTILIZADO',presence:validate?null:exit?'FORA':'DENTRO',expiresAt:'2026-10-10T22:00:00.000Z',usedAt:validate?null:'2026-10-10T20:00:00.000Z',exitedAt:exit||entry?'2026-10-10T20:30:00.000Z':null,...(validate?{valid:true,reentryAllowed:false,halfEvidenceRequired:false}:exit?{}:{halfEvidenceChecked:false})});
    }
    for(const [status,name] of Object.entries(errors))op.responses[status]={$ref:`#/components/responses/${name}`};
    (spec.paths[route.path]??={})[route.method]=op;
}
await writeFile(file,`${JSON.stringify(spec,null,2)}\n`);
console.info(`Tickets: ${ticketOperations.length} operações documentadas.`);
