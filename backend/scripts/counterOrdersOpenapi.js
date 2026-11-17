export function documentCounterOrders(spec) {
    const id={type:'string',pattern:'^[1-9][0-9]{0,19}$'};
    const money={type:'string',pattern:'^[0-9]{1,8}\\.[0-9]{2}$'};
    const str={type:'string'};
    const obj=(properties,required=Object.keys(properties))=>({type:'object',additionalProperties:false,properties,required});
    const array=items=>({type:'array',items});
    const value=name=>({type:'string',enum:[name]});
    const quantity={type:'integer',minimum:1,maximum:100};
    const cart={lines:{...array({oneOf:[
        obj({kind:value('SESSION'),id,seatId:id,quantity:{type:'integer',enum:[1]}}),
        obj({kind:value('INPUT'),id,quantity}),
        obj({kind:value('COMBO'),id,quantity}),
    ]}),minItems:1,maxItems:50},ageConfirmed:{type:'boolean',default:false}};
    const catalog=obj({classification:{type:'string',enum:['L','10','12','14','16','18']},
        seats:array(obj({id,label:str})),snacks:array(obj({id,name:str,kind:{type:'string',enum:['INPUT','COMBO']}}))});
    const sale=obj({orderId:id,channel:{type:'string',enum:['BALCAO','APP']},
        status:{type:'string',enum:['EM_ANDAMENTO','AGUARDANDO_PAGAMENTO','PAGO','FINALIZADO','CANCELADO']},
        total:{...money,nullable:true},tickets:array(obj({code:str,type:{type:'string',enum:['INGRESSO_SESSAO','RETIRADA_INSUMO']}}))});
    const session={name:'sessionId',in:'path',required:true,schema:id};
    const key={name:'Idempotency-Key',in:'header',required:true,schema:{type:'string',pattern:'^[A-Za-z0-9._:-]{8,120}$'}};
    const path='/api/unit/sessions/{sessionId}/counter';
    const op=(operationId,summary,status,data,body,parameters=[session])=>({
        operationId,tags:['Carrinho'],summary,description:'Somente colaborador ativo da equipe da sessão.',
        security:[{bearerAuth:[]}],parameters,
        ...(body&&{requestBody:{required:true,content:{'application/json':{schema:body}}}}),
        responses:{
            [status]:{description:summary,content:{'application/json':{schema:obj({success:{type:'boolean',enum:[true]},data,requestId:{type:'string',format:'uuid'}})}}},
            ...Object.fromEntries(Object.entries({400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',
                413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'})
                .map(([code,name])=>[code,{$ref:`#/components/responses/${name}`}])),
        },
    });
    spec.paths[path]={get:op('counter_catalog','Consultar catálogo da sessão para venda presencial',200,catalog)};
    spec.paths[`${path}/quote`]={post:op('counter_quote','Cotar venda presencial',200,{$ref:'#/components/schemas/OrderCartQuote'},obj(cart,['lines']))};
    spec.paths[`${path}/orders`]={post:op('counter_sale','Pagar no balcão ou enviar pedido à conta do cliente',201,sale,{oneOf:[
        obj({...cart,channel:value('BALCAO'),expectedTotal:money},['lines','channel','expectedTotal']),
        obj({...cart,channel:value('APP'),customerEmail:{type:'string',format:'email',maxLength:254}},['lines','channel','customerEmail']),
    ]},[session,key])};
}
