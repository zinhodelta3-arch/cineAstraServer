import { readFile, writeFile } from 'node:fs/promises';
import { sessionOperations } from '../src/routes/sessionRoutes.js';

const file = new URL('../src/docs/openapi.json', import.meta.url);
const spec = JSON.parse(await readFile(file, 'utf8'));
spec.tags = [...spec.tags.filter(t => t.name !== 'Sessões'), { name: 'Sessões', description: 'Oferta de filmes, agendamento, operação e arquivo de sessões presenciais.' }];
const id = { type: 'string', pattern: '^[1-9][0-9]{0,9}$', description: 'INT UNSIGNED decimal, máximo 4294967295.' };
const date = { type: 'string', format: 'date' };
const time = { type: 'string', pattern: '^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$' };
const money = { type: 'string', pattern: '^(0|[1-9][0-9]{0,7})\\.[0-9]{2}$' };
const language = { type: 'string', enum: ['DUBLADO', 'LEGENDADO', 'ORIGINAL'] };
const status = { type: 'string', enum: ['AGENDADA', 'EM_CARTAZ', 'ENCERRADA', 'CANCELADA', 'INTERROMPIDA'] };
const operational = { type: 'string', enum: [...status.enum, 'ATRASADA', 'EXPIRADA'] };
const visibility = { type:'string', enum:['programming','archived'] };
const fields = { id_filme: id, id_sala: id, data: date, horario_inicio: time, horario_fim: time, idioma: language, preco_inteira: money };
const object = (properties, required = Object.keys(properties)) => ({ type: 'object', additionalProperties: false, properties, required });
const example = { id_sessao: '1', id_filme: '1', id_sala: '2', id_local: '1', data: '2026-10-10', data_fim: '2026-10-11', horario_inicio: '23:30:00', horario_fim: '01:00:00', idioma: 'DUBLADO', preco_inteira: '20.00', status: 'AGENDADA' };
spec.components.schemas.Session = { ...object({ id_sessao: id, ...fields, id_local: id, data_fim: date, status }), example };
const seatCount = { type: 'integer', minimum: 0 };
Object.assign(spec.components.schemas.Session.properties, {
    titulo_filme: { type: 'string', nullable: true },
    status_operacional: { ...operational, description: 'Atrasada após 15 minutos e expirada ao atingir o término quando a sessão ainda está agendada.' },
    arquivada_em: { type:'string', nullable:true, description:'Quando arquivada, horário UTC no formato do banco de dados.' },
    imagem_filme: { type: 'string', nullable: true, description: 'Capa do filme na listagem pública filtrada por localId e date.' },
    classificacao_filme: { type: 'string', nullable: true, description: 'Classificação do filme na listagem pública filtrada por localId e date.' },
    activeSeats: { ...seatCount, description: 'Assentos ativos. Presente com filmId ou localId e date na consulta pública, e com roomId na consulta administrativa.' },
    availableSeats: { ...seatCount, description: 'Assentos ativos sem venda confirmada ou reserva vigente no instante da consulta.' }
});
spec.components.schemas.SessionCreate = { ...object(fields, ['id_filme','id_sala','data','horario_inicio','horario_fim','preco_inteira']), example: Object.fromEntries(Object.entries(example).filter(([key]) => key in fields)) };
const patchFields = { ...fields, status }; delete patchFields.id_sala;
spec.components.schemas.SessionPatch = { type: 'object', additionalProperties: false, minProperties: 1, properties: patchFields, example: { horario_inicio: '23:45', horario_fim: '01:15' } };
const ref = name => ({ $ref: `#/components/schemas/${name}` });
const response = data => ({ description: 'Sucesso', content: { 'application/json': { schema: object({ success: { type: 'boolean', enum: [true] }, data, requestId: { type: 'string', format: 'uuid' } }) } } });
for (const r of sessionOperations) {
    const op = { operationId: r.operationId, tags: ['Sessões'], summary: r.operationId.replaceAll('_', ' '), security: r.admin ? [{ bearerAuth: [] }] : [],
        description: r.admin ? 'ADMIN com sessão ativa/2FA. Intervalo mínimo de 1h entre sessões no mesmo cinema. Fim anterior ao início significa dia seguinte. Itens de pedido congelam alterações de preço e horário. Interromper ou cancelar uma sessão em andamento suspende vendas e encaminha pagamentos para análise. O arquivo preserva o histórico comercial.' : 'Consulta sessões AGENDADA/EM_CARTAZ com local, sala e filme ativos e filme disponível para cinema. O checkout revalida a disponibilidade.',
        parameters: r.path.includes('{id}') ? [{ name: 'id', in: 'path', required: true, schema: id }] : [], responses: {} };
    if (r.action === 'seats') {
        op.summary='Consultar disponibilidade dos assentos por sessão';
        op.description='Consulta pública sem cache: mapa físico e ocupação no instante da leitura. Retorna apenas sessões AGENDADA/EM_CARTAZ com filme, sala e local ativos e filme disponível para cinema. Sessão não pública/inexistente retorna 404. Assento inativo é INDISPONIVEL; ocupação CONFIRMADA é VENDIDO; RESERVADA com expira_em maior que o relógio UTC do banco é RESERVADO; reserva expirada é ignorada sem alteração de dados. Não expõe comprador, pedido, ticket ou prazo individual. Não reserva nem garante compra: checkout revalida disponibilidade e concorrência. Tipo do assento informa acessibilidade. A elegibilidade segue status cadastral da sessão; não é autorização de compra.';
        op.responses['200']=response(object({sessionId:id,roomId:id,locationId:id,seats:{type:'array',items:object({seatId:id,row:{type:'string'},number:{type:'integer',minimum:1},position:{type:'integer',minimum:1},type:{type:'string',enum:['COMUM','PCD','OBESO','IDOSO','CASAL'],nullable:true},availability:{type:'string',enum:['DISPONIVEL','RESERVADO','VENDIDO','INDISPONIVEL']}})}}));
    } else if (r.action === 'list') {
        op.parameters.push({ name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
            { name: 'cursor', in: 'query', schema: id }, { name: 'localId', in: 'query', schema: id }, { name: 'date', in: 'query', schema: date },
            { name: 'startFrom', in: 'query', schema: time }, { name: 'startUntil', in: 'query', schema: time });
        if (r.admin) op.parameters.push({ name: 'status', in: 'query', schema: status }, { name: 'operationalStatus', in:'query', schema:operational },
            { name:'visibility', in:'query', schema:visibility }, { name: 'roomId', in: 'query', schema: id });
        else {
            op.parameters.push({ name: 'filmId', in: 'query', schema: id });
            op.description += ' Com filmId, lista sessões futuras do filme e informa a disponibilidade no instante da consulta. O checkout revalida a disponibilidade.';
        }
        op.responses['200'] = response(object({ items: { type: 'array', items: ref('Session') }, pagination: ref('Pagination') }));
    } else if (r.action === 'get') op.responses['200'] = response(ref('Session'));
    else if (r.action === 'cancel') op.responses['204'] = { description: 'Sessão marcada CANCELADA; registro e histórico preservados.' };
    else if (r.action === 'archive') op.responses['204'] = { description:'Sessão encerrada ou cancelada arquivada com histórico preservado.' };
    else {
        op.requestBody = { required: true, content: { 'application/json': { schema: ref(r.action === 'create' ? 'SessionCreate' : 'SessionPatch') } } };
        const code = r.action === 'create' ? '201' : '200';
        op.responses[code] = { ...response(ref('Session')), ...(code === '201' ? { headers: { Location: { schema: { type: 'string' }, description: 'Detalhe administrativo da sessão' } } } : {}) };
    }
    for (const [code, name] of Object.entries({ 400: 'BadRequest', 401: 'Unauthorized', 403: 'Forbidden', 404: 'NotFound', 409: 'Conflict', 413: 'PayloadTooLarge', 422: 'ValidationError', 429: 'RateLimited', 500: 'InternalError', 503: 'Unavailable' })) op.responses[code] = { $ref: `#/components/responses/${name}` };
    (spec.paths[r.path] ??= {})[r.method] = op;
}
const secureUnit = (operationId, summary, description) => ({
    operationId, summary, description, tags:['Sessões'], security:[{bearerAuth:[]}],
    responses:Object.fromEntries(Object.entries({401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',422:'ValidationError',503:'Unavailable'})
        .map(([code,name])=>[code,{$ref:`#/components/responses/${name}`}]))
});
const programming = spec.paths['/api/admin/sessions'];
const individual = spec.paths['/api/admin/sessions/{id}'];
function asUnit(path, method, op, suffix, description) {
    (spec.paths[path] ??= {})[method] = { ...op, operationId:`unit_${suffix}`, description };
}
asUnit('/api/unit/sessions','get',programming.get,'list_sessions','Consulta as sessões da própria unidade. Equipe vinculada pode consultar. A programação padrão exclui sessões arquivadas.');
spec.paths['/api/unit/sessions'].get.responses = { ...programming.get.responses,
    200:response(object({items:{type:'array',items:{...spec.components.schemas.Session,
        properties:{...spec.components.schemas.Session.properties,duracao_filme:{type:'integer'},can_consult:{type:'boolean'}}}},
        pagination:ref('Pagination'),trailerMinutes:{type:'integer',example:30}})) };
asUnit('/api/unit/sessions','post',{...programming.post,responses:{...programming.post.responses,201:response(ref('Session'))}},'create_session','Somente o Supervisor agenda filmes da oferta local. O fim previsto considera 30 minutos de trailers.');
const unitCreate=object(fields,['id_filme','id_sala','data','horario_inicio','preco_inteira']);
spec.paths['/api/unit/sessions'].post.requestBody={required:true,content:{'application/json':{schema:unitCreate}}};
asUnit('/api/unit/sessions/{id}','get',individual.get,'get_session','Consulta uma sessão da própria unidade por ID.');
asUnit('/api/unit/sessions/{id}','patch',individual.patch,'update_session','Supervisor da unidade pode alterar ou interromper a sessão conforme seu estado.');
asUnit('/api/unit/sessions/{id}','delete',individual.delete,'cancel_session','Supervisor da unidade pode cancelar a sessão conforme seu estado.');
asUnit('/api/unit/sessions/{id}/archive','post',spec.paths['/api/admin/sessions/{id}/archive'].post,'archive_session','Supervisor pode arquivar sessões encerradas e canceladas da sua unidade.');
const note = { type:'string', maxLength:300, nullable:true };
const offers = '/api/unit/film-offers';
const listOffers = secureUnit('unit_list_film_offers','Listar oferta de filmes da unidade','Consulta da equipe vinculada à unidade.');
listOffers.parameters = Object.entries({limit:{type:'integer',minimum:1,maximum:100,default:20},cursor:id,localId:id,titulo:{type:'string',maxLength:200}})
    .map(([name,schema])=>({name,schema,in:'query'}));
listOffers.responses[200] = response(object({items:{type:'array',items:object({id_filme:id,titulo:{type:'string'},duracao:{type:'integer'},observacao:note})},pagination:ref('Pagination')}));
spec.paths[offers] = {get:listOffers};
for(const [method,summary,properties,required] of [
    ['post','Adicionar filme à oferta',{id_filme:id,observacao:note},['id_filme']],
    ['patch','Editar observação da oferta',{observacao:note},['observacao']],
    ['delete','Retirar filme da oferta',null,[]],
]){
    const op=secureUnit(`unit_${method}_film_offer`,summary,'Somente o Supervisor pode modificar a oferta da sua unidade. Sessões existentes permanecem vinculadas.');
    op.responses[204]={description:'Oferta atualizada.'};
    if(properties)op.requestBody={required:true,content:{'application/json':{schema:object(properties,required)}}};
    if(method!=='post')op.parameters=[{name:'id',in:'path',required:true,schema:id}];
    ((spec.paths[method==='post'?offers:`${offers}/{id}`] ??= {}))[method]=op;
}
await writeFile(file, `${JSON.stringify(spec, null, 2)}\n`);
console.info(`Sessões: ${sessionOperations.length} operações documentadas.`);
