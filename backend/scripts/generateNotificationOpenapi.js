import { readFile, writeFile } from 'node:fs/promises';
import { notificationOperations } from '../src/routes/notificationRoutes.js';
import { unitCommunicationOperations } from '../src/routes/unitCommunicationRoutes.js';

const file = new URL('../src/docs/openapi.json', import.meta.url);
const spec = JSON.parse(await readFile(file, 'utf8'));
spec.tags = [...spec.tags.filter(t => t.name !== 'Notificações'), { name: 'Notificações', description: 'Consulta e leitura de notificações próprias; emissão somente por serviço interno.' }];
const id = { type: 'string', pattern: '^[1-9][0-9]{0,19}$', description: 'BIGINT UNSIGNED decimal retornado como string.' };
const obj = (properties, required = Object.keys(properties)) => ({ type: 'object', additionalProperties: false, properties, required });
const ref = name => ({ $ref: `#/components/schemas/${name}` });
const response = data => ({ description: 'Sucesso', content: { 'application/json': { schema: obj({ success: { type: 'boolean', enum: [true] }, data, requestId: { type: 'string', format: 'uuid' } }) } } });
spec.components.schemas.Notification = obj({ id_notificacao: id, titulo: { type: 'string', maxLength: 200 }, mensagem: { type: 'string', nullable: true }, tipo: { type: 'string', maxLength: 50, nullable: true }, lida: { type: 'boolean' }, data_envio: { type: 'string' } });
spec.components.schemas.Notification.properties.solicitacao_experiencia_id = {
    type: 'string', pattern: '^[1-9][0-9]{0,9}$', description: 'Identificador da solicitação em notificações de confirmação de experiência.'
};
spec.components.schemas.Notification.properties.destino=obj({
    kind:{type:'string',enum:['support','adminSupport','order','refund','supply','team','experience','unitCommunication']},id,detailId:id
},['kind','id']);
for (const r of notificationOperations) {
    const list = r.action === 'list';
    const op = { operationId: r.operationId, tags: ['Notificações'], summary: list ? 'Listar minhas notificações' : 'Marcar minha notificação como lida',
        description: list ? 'Usa o usuário da sessão autenticada; não aceita id_usuario. Cursor BIGINT, filtro unread=true/false e tipo. A chave interna de deduplicação não é exposta.' : 'Atualização idempotente restrita ao destinatário autenticado; notificação alheia retorna 404. Não existe endpoint público de emissão.',
        security: [{ bearerAuth: [] }], parameters: list ? [
            { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
            { name: 'cursor', in: 'query', schema: id },
            { name: 'order', in: 'query', schema: { type: 'string', enum: ['recent'] }, description: 'Ordena do mais recente ao mais antigo. Repita o valor ao usar o próximo cursor.' },
            { name: 'unread', in: 'query', schema: { type: 'boolean' } },
            { name: 'type', in: 'query', schema: { type: 'string', minLength: 1, maxLength: 50 } }
        ] : [{ name: 'id', in: 'path', required: true, schema: id }], responses: {} };
    op.responses['200'] = response(list ? obj({ items: { type: 'array', items: ref('Notification') }, pagination: ref('Pagination') }) : ref('Notification'));
    for (const [code, name] of Object.entries({ 400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable' })) op.responses[code] = { $ref: `#/components/responses/${name}` };
    (spec.paths[r.path] ??= {})[r.method] = op;
}
for(const r of unitCommunicationOperations) {
    const count={type:'integer',minimum:0};
    const sending=r.action==='send',listing=r.action==='recipients';
    const counts=obj(Object.fromEntries(['stock','supply','orders','sessions','absences','equipment'].map(key=>[key,count])));
    const name={type:'string'};
    const data=sending?obj({recipients:count,delivered:count}):listing
        ?obj({items:{type:'array',items:obj({id,name})},pagination:ref('Pagination')}):obj({location:obj({id,name}),counts});
    const op={operationId:r.operationId,tags:['Notificações'],summary:r.operationId.replaceAll('_',' '),
        description:'SUPERVISOR com unidade ativa. O escopo é obtido pelo vínculo da conta autenticada.',
        security:[{bearerAuth:[]}],responses:{[sending?'201':'200']:response(data)}};
    if(listing)op.parameters=[
        {name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:20}},
        {name:'cursor',in:'query',schema:id},{name:'q',in:'query',schema:{type:'string',maxLength:100}}
    ];
    if(sending){
        const fields={title:{type:'string',minLength:1,maxLength:170},message:{type:'string',minLength:1,maxLength:2000},requestId:{type:'string',format:'uuid'}};
        op.requestBody={required:true,content:{'application/json':{schema:{oneOf:[
            obj({...fields,audience:{type:'string',enum:['ALL']}}),
            obj({...fields,audience:{type:'string',enum:['SELECTED']},recipientIds:{type:'array',uniqueItems:true,minItems:1,maxItems:100,items:id}})
        ]}}}};
    }
    for(const [status,reason] of Object.entries({401:'Unauthorized',403:'Forbidden',409:'Conflict',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'})) {
        op.responses[status]={$ref:`#/components/responses/${reason}`};
    }
    (spec.paths[r.path]??={})[r.method]=op;
}
await writeFile(file, `${JSON.stringify(spec, null, 2)}\n`);
console.info(`Notificações: ${notificationOperations.length} operações documentadas.`);
