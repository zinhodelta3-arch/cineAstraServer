import {readFile,writeFile} from 'node:fs/promises';
import {planOperations} from '../src/routes/planRoutes.js';
import {adminStreamingOperations} from '../src/routes/adminStreamingRoutes.js';

const file=new URL('../src/docs/openapi.json',import.meta.url),spec=JSON.parse(await readFile(file,'utf8'));
spec.tags=[...spec.tags.filter(x=>x.name!=='Plans'),{name:'Plans',description:'Planos, contratos de assinatura e solicitação de combo mensal.'}];
const id={type:'string',pattern:'^[1-9][0-9]{0,19}$'};
const money={type:'string',pattern:'^[0-9]{1,8}\\.[0-9]{2}$',nullable:true};
const obj=(properties,required=Object.keys(properties))=>({type:'object',additionalProperties:false,properties,...(required.length?{required}:{})});
const ref=name=>({$ref:`#/components/schemas/${name}`});
const envelope=schema=>obj({success:{type:'boolean',enum:[true]},data:schema,requestId:{type:'string',format:'uuid'}});
const page=schema=>obj({items:{type:'array',items:schema},pagination:obj({limit:{type:'integer'},nextCursor:{...id,nullable:true}})});
const modality={type:'string',enum:['INDIVIDUAL','DUPLA','FAMILIA']};
const discounts=obj(Object.fromEntries(['SESSION','INPUT','COMBO','RENTAL','PURCHASE'].map(category=>[category,{type:'integer',minimum:0,maximum:10000}])),[]);
const period={type:'string',enum:['MENSAL','ANUAL']};
const day={type:'string',format:'date',nullable:true};
const planInput={name:{type:'string',maxLength:100},description:{type:'string',nullable:true,maxLength:5000},maxMembers:{type:'integer',minimum:1,maximum:100},catalogAccess:{type:'boolean'},freeComboId:{...id,nullable:true},freeCombosPerMonth:{type:'integer',enum:[0,1]}};
const planFields={id,...planInput,monthlyPrice:money,annualPrice:money,discounts,active:{type:'boolean'}};
spec.components.schemas.Plan=obj({...planFields,modalities:{type:'array',items:obj({modality,maxMembers:planInput.maxMembers,monthlyPrice:money,annualPrice:money})}});
spec.components.schemas.PlanSnapshot={
  ...obj({...planFields,modality,renewalConsent:{type:'boolean'},benefitsSince:day,legal:{type:'object'}},[]),
  nullable:true
};
spec.components.schemas.PlanAdmin=obj({...spec.components.schemas.Plan.properties,monthlyBenefitCost:money,annualBenefitCost:money});
spec.components.schemas.PlanContract=obj({id:id,planId:id,period:{type:'string',enum:['MENSAL','ANUAL']},divisionMode:{type:'string',enum:['TITULAR_PAGA','DIVISAO_IGUAL']},status:{type:'string',enum:['PENDENTE','ATIVA','CANCELADA','EXPIRADA']},autoRenew:{type:'boolean'},startsOn:{type:'string',format:'date',nullable:true},endsOn:{type:'string',format:'date',nullable:true},contractPrice:money,contract:{...ref('Plan'),nullable:true},chargeId:id,chargeStatus:{type:'string',enum:['PENDENTE','PAGO','ATRASADO','ISENTO']},paymentPath:{type:'string'}},['id','planId','period','divisionMode','status','autoRenew','startsOn','endsOn','contractPrice','contract']);
spec.components.schemas.PlanContract.properties.administrativeDraft={type:'boolean'};
Object.assign(spec.components.schemas.PlanContract.properties,{
  planName:{type:'string',nullable:true},suspended:{type:'boolean'},
  contract:ref('PlanSnapshot'),modality:{...modality,nullable:true},maxMembers:{...planInput.maxMembers,nullable:true},
  endingOn:day,adminProposal:{...obj({planId:id,planName:{type:'string'},period,modality}),nullable:true},
  chargeStatus:{type:'string',enum:['PENDENTE','PAGO','ATRASADO','ISENTO','CANCELADO']},
  chargeDue:{type:'string',format:'date'},chargeAmount:money,paymentId:{...id,nullable:true},paymentStatus:{type:'string',nullable:true},
  scheduledChange:{...obj({planId:id,planName:{type:'string'},modality:{...modality,nullable:true},period,price:money,effectiveOn:{type:'string',format:'date'}}),nullable:true},
});
spec.components.schemas.PlanComboRequest=obj({id,subscriptionId:id,comboId:id,competence:{type:'string',format:'date'},status:{type:'string',enum:['SOLICITADO']}});
const body=schema=>({required:true,content:{'application/json':{schema}}});
const pathId=name=>({name,in:'path',required:true,schema:id});
const pagination=[{name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:50}},{name:'cursor',in:'query',schema:{type:'string',pattern:'^(0|[1-9][0-9]{0,19})$'}}];
const errors={400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'};
const descriptions={list_public_plans:'Listar ofertas publicadas',get_public_plan:'Consultar oferta publicada',list_admin_plans:'Listar planos administrativos',get_admin_plan:'Consultar plano administrativo',create_plan:'Criar plano inativo',update_plan:'Atualizar plano e ativar oferta validada',archive_plan:'Arquivar oferta para novas contratações',list_my_subscriptions:'Listar contratos próprios',get_my_subscription:'Consultar contrato próprio',create_subscription_contract:'Contratar plano com cobrança pendente',request_monthly_combo:'Solicitar combo mensal contratado'};
for(const route of planOperations){
  const op={operationId:route.operationId,tags:['Plans'],summary:descriptions[route.operationId],security:route.path.startsWith('/api/plans')?[]:[{bearerAuth:[]}],responses:{}};
  const isAdmin=route.path.startsWith('/api/admin');
  if(route.path.includes('{planId}'))op.parameters=[pathId('planId')];
  if(route.path.includes('{subscriptionId}'))op.parameters=[pathId('subscriptionId')];
  if(['list_public_plans','list_admin_plans','list_my_subscriptions'].includes(route.operationId))op.parameters=pagination;
  if(route.operationId==='create_plan')op.requestBody=body(obj(planInput,['name','maxMembers']));
  if(route.operationId==='update_plan')op.requestBody=body(obj({...planInput,discounts,active:{type:'boolean'}},[]));
  const draftFields={planId:id,period,modality};
  if(route.operationId==='create_admin_subscription_draft'){
    op.summary='Registrar proposta de assinatura para cliente ativo';
    op.description='ADMIN. Valida o plano publicado e registra proposta pendente. O cliente confirma a oferta na contratação; a proposta não gera cobrança nem acesso.';
    op.requestBody=body(obj({userId:id,...draftFields},['userId','planId','period']));
  }
  if(route.operationId==='update_admin_subscription'){
    op.summary='Editar proposta, propor troca ou configurar renovação';
    op.description='Trocas em contratos ativos exigem aceite do titular. A reativação da renovação exige autorização registrada.';
    op.requestBody=body({oneOf:[
      obj({action:{type:'string',enum:['updateDraft','proposeChange']},...draftFields},['action','planId','period']),
      obj({action:{type:'string',enum:['stopRenewal','enableRenewal']}})
    ]});
  }
  if(route.operationId==='create_subscription_contract'){
    op.parameters=[{name:'Idempotency-Key',in:'header',required:true,schema:{type:'string',minLength:8,maxLength:120}}];
    op.requestBody=body(obj({...draftFields,autoRenew:{type:'boolean'},divisionMode:{type:'string',enum:['TITULAR_PAGA','DIVISAO_IGUAL']}},['planId','period']));
    op.description='Cria snapshot imutável da oferta e cobrança PENDENTE. Use o chargeId retornado em POST /api/payments com outro Idempotency-Key. A assinatura só ativa após confirmação autenticada do gateway.';
  }
  if(route.operationId==='request_monthly_combo')op.description='Exige contrato ATIVA, cobrança paga e combo incluído no snapshot. Reserva uma única solicitação por competência; SOLICITADO não equivale a entrega.';
  if(route.operationId==='get_current_subscription')op.summary='Consultar o plano atual do titular ou participante';
  if(route.operationId==='schedule_subscription_change'){
    op.summary='Agendar mudança para o próximo ciclo';
    op.description='Preserva o ciclo atual. A mudança passa a valer após confirmação da cobrança do próximo ciclo.';
    op.requestBody=body(obj({...draftFields,autoRenew:{type:'boolean'},divisionMode:{type:'string',enum:['TITULAR_PAGA','DIVISAO_IGUAL']},
      acceptance:obj({accepted:{type:'boolean',enum:[true]},offerHash:{type:'string',pattern:'^[a-f0-9]{64}$'}})},['planId','period','acceptance']));
  }
  const responseSchema=route.operationId.includes('plan')&&!route.operationId.includes('subscription')?ref(isAdmin?'PlanAdmin':'Plan'):
    route.operationId==='get_current_subscription'?obj({subscription:{...obj({planName:{type:'string'},period:{type:'string'},status:{type:'string'},endsOn:{type:'string',format:'date',nullable:true}}),nullable:true}}):
    route.operationId==='request_monthly_combo'?ref('PlanComboRequest'):ref('PlanContract');
  const data=['list_public_plans','list_admin_plans','list_my_subscriptions'].includes(route.operationId)?page(responseSchema):responseSchema;
  const code=route.method==='delete'?'204':route.method==='post'&&route.operationId!=='schedule_subscription_change'?'201':'200';
  const ending=route.operationId==='end_admin_subscription';
  if(ending)op.summary='Encerrar assinatura ao fim do ciclo pago';
  op.responses[code]=code==='204'?{description:ending?'Encerramento registrado':'Plano arquivado'}:{description:'Sucesso',content:{'application/json':{schema:envelope(data)}}};
  for(const [status,name] of Object.entries(errors))op.responses[status]={$ref:`#/components/responses/${name}`};
  (spec.paths[route.path]??={})[route.method]=op;
}
const subscriptions=page(obj({
  id,userId:id,customer:{type:'string'},planId:id,plan:{type:'string'},startsOn:day,endsOn:day,period,
  divisionMode:{type:'string'},status:{type:'string'},autoRenew:{type:'boolean'},contractPrice:money,
  administrativeDraft:{type:'boolean'},modality:{...modality,nullable:true},renewalConsent:{type:'boolean'},endingOn:day
}));
const accesses=page(obj({
  id,userId:id,customer:{type:'string'},filmId:id,film:{type:'string'},itemId:id,
  mode:{type:'string'},startsAt:{type:'string',format:'date-time',nullable:true},expiresAt:{type:'string',format:'date-time',nullable:true},status:{type:'string'}
}));
for(const route of adminStreamingOperations){
  const access=route.path.includes('accesses'),deleting=route.method==='delete';
  const filters=[...pagination,{name:'userId',in:'query',schema:id},{name:access?'filmId':'planId',in:'query',schema:id},
    {name:'status',in:'query',schema:{type:'string',enum:access?['ATIVO','EXPIRADO','REVOGADO']:['ATIVA','PENDENTE','EXPIRADA','CANCELADA']}}];
  const op={operationId:route.operationId,tags:['Plans'],summary:deleting?'Revogar acesso avulso':access?'Listar acessos de streaming':'Listar assinaturas administrativas',
    security:[{bearerAuth:[]}],parameters:deleting?[pathId('accessId')]:filters,responses:{}};
  op.responses[deleting?'204':'200']=deleting?{description:'Acesso revogado e histórico preservado'}:
    {description:'Sucesso',content:{'application/json':{schema:envelope(access?accesses:subscriptions)}}};
  for(const [status,name] of Object.entries(errors))op.responses[status]={$ref:`#/components/responses/${name}`};
  (spec.paths[route.path]??={})[route.method]=op;
}
await writeFile(file,`${JSON.stringify(spec,null,2)}\n`);
console.info(`Planos: ${planOperations.length} operações documentadas.`);
