import {readFile,writeFile} from 'node:fs/promises';
import {refundOperations} from '../src/routes/refundRoutes.js';
const file=new URL('../src/docs/openapi.json',import.meta.url),spec=JSON.parse(await readFile(file,'utf8'));
spec.tags=[...spec.tags.filter(t=>t.name!=='Reembolsos'),{name:'Reembolsos',description:'Solicitação, revisão, estorno confirmado e cancelamento da assinatura.'}];
spec.components.schemas.PaymentStatus.properties.status.enum=['PENDENTE','APROVADO','RECUSADO','PARCIALMENTE_ESTORNADO','ESTORNADO'];
const id={type:'string',pattern:'^[1-9][0-9]{0,19}$'},money={type:'string',pattern:'^(0|[1-9][0-9]{0,7})\\.[0-9]{2}$'};
const obj=(properties,required=Object.keys(properties))=>({type:'object',additionalProperties:false,properties,...(required.length?{required}:{})});
const ref=name=>({$ref:`#/components/schemas/${name}`});
const response=data=>({description:'Sucesso',content:{'application/json':{schema:obj({success:{type:'boolean',enum:[true]},data,requestId:{type:'string',format:'uuid'}})}}});
spec.components.schemas.Refund=obj({id,paymentId:id,reason:{type:'string',enum:['ARREPENDIMENTO','DEFEITO','OUTRO','CANCELAMENTO_PLANO']},status:{type:'string',enum:['RECEBIDA','EM_ANALISE','ENVIADA','CONFIRMADA','NEGADA','FALHOU','CANCELADA']},requestedAmount:{...money,nullable:true},confirmedAmount:{...money,nullable:true},withinSevenDays:{type:'boolean'},receivedAt:{type:'string'},responseDueAt:{type:'string'},respondedAt:{type:'string',nullable:true},compensation:{type:'string',enum:['NAO_APLICAVEL','PENDENTE','CONCLUIDA']}});
const errors={400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'};
for(const r of refundOperations){
    const op={operationId:r.operationId,tags:['Reembolsos'],summary:r.operationId.replaceAll('_',' '),description:'Solicitação confirmada imediatamente como recebida; estorno só é confirmado pelo gateway. Direito de arrependimento elegível pede valor integral. Outros casos exigem decisão documentada conforme versão dos Termos. Compensação de direitos do checkout pode ficar pendente.',security:[{bearerAuth:[]}],parameters:[{name:'id',in:'path',required:true,schema:id}],responses:{}};
    if(r.operationId==='list_own_order_refunds'){
        op.description='Lista solicitações do pedido do cliente autenticado e informa se há pagamento elegível.';
        op.parameters.push({name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:20}},{name:'cursor',in:'query',schema:id});
        op.responses['200']=response(obj({eligible:{type:'boolean'},items:{type:'array',items:ref('Refund')},pagination:obj({limit:{type:'integer'},nextCursor:{...id,nullable:true}})}));
    }else if(['list_admin_refunds','get_admin_refund'].includes(r.operationId)){
        const summary=obj({...spec.components.schemas.Refund.properties,userId:id,orderId:{...id,nullable:true},chargeId:{...id,nullable:true},paymentAmount:money,paymentStatus:{type:'string',enum:['PENDENTE','APROVADO','RECUSADO','PARCIALMENTE_ESTORNADO','ESTORNADO'],nullable:true},receivedAt:{type:'string',format:'date-time'},responseDueAt:{type:'string',format:'date-time'},respondedAt:{type:'string',format:'date-time',nullable:true}});
        op.description='Somente ADMIN com sessão ativa. Consulta sem efeitos financeiros ou chamadas ao gateway; não expõe referências do provider, chave de idempotência ou dados do cartão. Decisão permanece no endpoint POST existente, sujeita a EM_ANALISE e termos atuais. Filtros combinados por AND; ordem por ID decrescente, cursor exclusivo. Datas administrativas em UTC ISO. Motivo livre e fundamento só no detalhe; renderizar como texto, nunca HTML.';
        if(r.operationId==='list_admin_refunds'){
            op.parameters=[{name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:20}},{name:'cursor',in:'query',schema:id},...['userId','paymentId','orderId','chargeId'].map(name=>({name,in:'query',schema:name==='userId'?{type:'string',pattern:'^[1-9][0-9]{0,9}$'}:id})),...Object.entries({status:spec.components.schemas.Refund.properties.status,reason:spec.components.schemas.Refund.properties.reason,compensation:spec.components.schemas.Refund.properties.compensation}).map(([name,schema])=>({name,in:'query',schema}))];
            op.responses['200']=response(obj({items:{type:'array',items:summary},pagination:obj({limit:{type:'integer',minimum:1,maximum:100},nextCursor:{...id,nullable:true}})}));
        }else op.responses['200']=response(obj({...summary.properties,details:{type:'string',nullable:true},termsVersion:{type:'string',nullable:true},decisionBasis:{type:'string',nullable:true},
            remainingAmount:money,selectedItems:{type:'array',items:obj({itemId:id,amount:money})},
            eligibleItems:{type:'array',items:obj({id,name:{type:'string'},quantity:{type:'integer'},remainingAmount:money})}}));
    }else if(['request_refund','request_own_order_refund','request_admin_order_refund'].includes(r.operationId)){
        op.parameters.push({name:'Idempotency-Key',in:'header',required:true,schema:{type:'string',minLength:8,maxLength:120}});
        const reasons=['ARREPENDIMENTO','DEFEITO','OUTRO'];
        if(r.operationId==='request_refund')reasons.push('CANCELAMENTO_PLANO');
        else op.description='Abre solicitação em análise vinculada ao pagamento do pedido. O pedido permanece no histórico.';
        op.requestBody={required:true,content:{'application/json':{schema:obj({reason:{type:'string',enum:reasons},details:{type:'string',maxLength:1000}},['reason']),example:{reason:'ARREPENDIMENTO'}}}};
        op.responses['202']=response(ref('Refund'));
    }else if(r.operationId==='decide_refund'){
        op.requestBody={required:true,content:{'application/json':{schema:obj({decision:{type:'string',enum:['APPROVE','DENY','CANCEL']},amount:money,itemIds:{type:'array',items:id,minItems:1,maxItems:50,uniqueItems:true},termsVersion:{type:'string'},basis:{type:'string',minLength:10,maxLength:1000}},['decision','termsVersion','basis'])}}};
        op.responses['200']=response(ref('Refund'));
    }else if(r.operationId==='cancel_subscription')op.responses['200']=response(obj({id,status:{type:'string',enum:['CANCELADA']},paymentId:{...id,nullable:true},refund:{...ref('Refund'),nullable:true},refundRequestRequired:{type:'boolean'}}));
    else op.responses['200']=response(ref('Refund'));
    for(const [code,name] of Object.entries(errors))op.responses[code]={$ref:`#/components/responses/${name}`};
    (spec.paths[r.path]??={})[r.method]=op;
}
await writeFile(file,`${JSON.stringify(spec,null,2)}\n`);
console.info(`Reembolsos: ${refundOperations.length} operações documentadas.`);
