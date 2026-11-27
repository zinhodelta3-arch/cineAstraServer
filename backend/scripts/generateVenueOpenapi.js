import { readFile, writeFile } from 'node:fs/promises';
import { roomLayoutOperations, roomSceneOperations, venueOperations } from '../src/routes/venueRoutes.js';

const file = new URL('../src/docs/openapi.json', import.meta.url);
const spec = JSON.parse(await readFile(file, 'utf8'));
spec.tags = [...spec.tags.filter(t => t.name !== 'Locais'), { name: 'Locais', description: 'Locais, salas e assentos; estrutura de sessões presenciais.' }];
const ref = name => ({ $ref: `#/components/schemas/${name}` });
const id = { type: 'string', pattern: '^[1-9][0-9]{0,9}$', description: 'INT UNSIGNED decimal, máximo 4294967295.' };
const str = max => ({ type: 'string', minLength: 1, maxLength: max });
const status = { local: ['ATIVO', 'INATIVO', 'MANUTENCAO'], room: ['ATIVA', 'INATIVA', 'MANUTENCAO'], seat: ['ATIVA', 'INATIVA'] };
const properties = {
    local: { nome: str(150), cep: { type: 'string', maxLength: 10, nullable: true }, logradouro: { ...str(150), nullable: true }, numero: { ...str(20), nullable: true }, complemento: { ...str(100), nullable: true }, bairro: { ...str(100), nullable: true }, cidade: str(100), estado: { type: 'string', pattern: '^[A-Z]{2}$' }, telefone: { ...str(20), nullable: true }, status: { type: 'string', enum: status.local } },
    room: { nome: str(100), capacidade: { type: 'integer', minimum: 1, maximum: 2147483647 }, tipo: { type: 'string', enum: ['2D', '3D', '4DX', 'VIP', 'IMAX'] }, status: { type: 'string', enum: status.room } },
    seat: { fileira: { type: 'string', pattern: '^[A-Za-z0-9]{1,5}$' }, numero: { type: 'integer', minimum: 1, maximum: 2147483647 }, tipo: { type: 'string', enum: ['COMUM', 'PCD', 'OBESO', 'IDOSO', 'CASAL'] }, status: { type: 'string', enum: status.seat } }
};
properties.seat.posicao_visual={type:'integer',minimum:1,maximum:2147483647,nullable:true};
const examples = {
    local: { id_local: '1', nome: 'Cine Centro', cidade: 'São Paulo', estado: 'SP', cep: null, logradouro: null, numero: null, complemento: null, bairro: null, telefone: null, status: 'ATIVO' },
    room: { id_sala: '2', id_local: '1', nome: 'Sala 1', capacidade: 2, tipo: '2D', status: 'INATIVA' },
    seat: { id_assento: '3', id_sala: '2', fileira: 'A', numero: 1, posicao_visual:null, tipo: 'PCD', status: 'ATIVA', acessivel: true }
};
Object.assign(properties.local, {
    tipo_local: { type:'string', enum:['CINEMA','DRIVE_IN','SALAO_EVENTOS','ESTACIONAMENTO','ESTADIO','PRACA','ESPACO_PUBLICO','OUTRO','TEATRO','BUNKER','CONTAINER'], default:'CINEMA' },
    lotacao_eventos: { type:'integer', minimum:1, maximum:100000, nullable:true },
    acesso_eventos: { type:'string', enum:['NUMERADO','LIVRE',null], nullable:true },
    imagem_url: { type:'string', format:'uri', maxLength:2048, pattern:'^https://', nullable:true }
});
Object.assign(examples.local, { tipo_local:'CINEMA', lotacao_eventos:null, acesso_eventos:null });
const object = (props, required = Object.keys(props)) => ({ type: 'object', additionalProperties: false, properties: props, required });
for (const kind of ['local', 'room', 'seat']) {
    const title = kind[0].toUpperCase() + kind.slice(1);
    const required = kind === 'local' ? ['nome', 'cidade', 'estado'] : kind === 'room' ? ['nome', 'capacidade'] : ['fileira', 'numero'];
    spec.components.schemas[`Venue${title}Input`] = object(properties[kind], required);
    spec.components.schemas[`Venue${title}Input`].example = Object.fromEntries(Object.entries(examples[kind]).filter(([k]) => required.includes(k)));
    spec.components.schemas[`Venue${title}Patch`] = { type: 'object', additionalProperties: false, minProperties: 1, properties: properties[kind] };
    spec.components.schemas[`Venue${title}Patch`].example = kind === 'local' ? { telefone: '1133334444' } : kind === 'room' ? { status: 'ATIVA' } : { tipo: 'PCD' };
    const row = { [kind === 'local' ? 'id_local' : kind === 'room' ? 'id_sala' : 'id_assento']: id,
        ...(kind === 'room' ? { id_local: id } : kind === 'seat' ? { id_sala: id } : {}), ...properties[kind], ...(kind === 'seat' ? { acessivel: { type: 'boolean', description: 'Derivado do tipo PCD, OBESO ou IDOSO.' } } : {}) };
    spec.components.schemas[`Venue${title}`] = object(row);
    if(kind==='local')spec.components.schemas.VenueLocal.properties.slug={type:'string',maxLength:180,description:'Link público estável para o cinema.'};
    spec.components.schemas[`Venue${title}`].example = examples[kind];
}
const response = data => ({ description: 'Sucesso', content: { 'application/json': { schema: object({ success: { type: 'boolean', enum: [true] }, data, requestId: { type: 'string', format: 'uuid' } }) } } });
for (const r of venueOperations) {
    const title = r.kind[0].toUpperCase() + r.kind.slice(1);
    const op = { operationId: r.operationId, tags: ['Locais'], summary: r.operationId.replaceAll('_', ' '), security: r.admin ? [{ bearerAuth: [] }] : [],
        description: r.admin ? 'ADMIN autenticado com sessão ativa e 2FA; mutações revalidam perfil na transação. DELETE arquiva. Salas vinculadas preservam a estrutura; a posição visual de cada assento pode ser alterada. Cache-Control: no-store.' : 'Consulta pública somente de locais, salas e assentos ativos dentro do contexto pai ativo. Nenhuma disponibilidade de ingresso é inferida aqui. Cache-Control: no-store.',
        parameters: [...r.path.matchAll(/\{(\w+)\}/g)].map(m => ({ name: m[1], in: 'path', required: true, schema: id })), responses: {} };
    if(r.operationId==='get_local')op.parameters[0].schema={type:'string',maxLength:180,description:'Slug público ou identificador numérico legado.'};
    if (r.action === 'list') {
        op.parameters.push({ name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } }, { name: 'cursor', in: 'query', schema: id });
        if (r.kind === 'seat') op.parameters.push({ name: 'accessible', in: 'query', schema: { type: 'boolean' } });
        if (r.kind === 'local') op.parameters.push({ name: 'q', in: 'query', description: 'Nome, cidade ou estado do local.', schema: { type: 'string', minLength: 1, maxLength: 150 } });
        if (r.kind === 'local' && !r.admin) op.parameters.push({ name: 'cinema', in: 'query', description: 'Restringe a locais com ao menos uma sala ativa de exibição.', schema: { type: 'string', enum: ['true'] } });
        if (r.admin) op.parameters.push({ name: 'status', in: 'query', schema: { type: 'string', enum: status[r.kind] } });
        op.responses['200'] = response(object({ items: { type: 'array', items: ref(`Venue${title}`) }, pagination: ref('Pagination') }));
    } else if (r.action === 'get') op.responses['200'] = response(ref(`Venue${title}`));
    else if (r.action === 'archive') op.responses['204'] = { description: 'Arquivado sem remover o registro e os vínculos históricos.' };
    else {
        op.requestBody = { required: true, content: { 'application/json': { schema: ref(`Venue${title}${r.method === 'patch' ? 'Patch' : 'Input'}`) } } };
        const code = r.method === 'post' ? '201' : '200';
        op.responses[code] = { ...response(ref(`Venue${title}`)), ...(code === '201' ? { headers: { Location: { schema: { type: 'string' }, description: 'URL administrativa do recurso criado' } } } : {}) };
    }
    for (const [code, name] of Object.entries({ 400: 'BadRequest', 401: 'Unauthorized', 403: 'Forbidden', 404: 'NotFound', 409: 'Conflict', 413: 'PayloadTooLarge', 422: 'ValidationError', 429: 'RateLimited', 500: 'InternalError', 503: 'Unavailable' })) op.responses[code] = { $ref: `#/components/responses/${name}` };
    (spec.paths[r.path] ??= {})[r.method] = op;
}
const layout=object({room:ref('VenueRoom'),spaceType:properties.local.tipo_local,structureLocked:{type:'boolean'},seats:{type:'array',items:ref('VenueSeat')}});
for(const route of roomLayoutOperations){
    const moving=route.action==='moveSeats', creating=route.action==='batchSeats';
    const schema=moving?object({moves:{type:'array',minItems:1,maxItems:400,items:object({seatId:id,position:properties.seat.posicao_visual})}})
        :object({seats:{type:'array',minItems:1,maxItems:400,items:ref('VenueSeatInput')}});
    const mode=route.area==='admin'?'ADMIN':route.method==='get'?'SUPERVISOR ou COLABORADOR da unidade':'SUPERVISOR da unidade';
    const op={operationId:route.operationId,tags:['Locais'],summary:route.operationId.replaceAll('_',' '),
        description:mode+(moving?'. Altera posições em lote preservando identificadores, situação e tipos.':creating?'. Cadastra lote atômico dentro da capacidade, em sala sem sessão vinculada.':'. Consulta toda a disposição física da sala.'),
        security:[{bearerAuth:[]}],parameters:['localId','roomId'].map(name=>({name,in:'path',required:true,schema:id})),
        responses:{[creating?'201':'200']:response(layout)}};
    if(creating||moving)op.requestBody={required:true,content:{'application/json':{schema}}};
    for(const [code,name] of Object.entries({400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'}))op.responses[code]={$ref:`#/components/responses/${name}`};
    (spec.paths[route.path]??={})[route.method]=op;
}
const coordinate = { type:'number', minimum:-2000, maximum:2000 };
const scale = { type:'number', minimum:0.05, maximum:200 };
const sceneFields = {
    id:{type:'integer',minimum:1,maximum:16777215},
    type:{type:'string',enum:['seat','vip','bench','car','screen','stage','speaker','podium','wall','floor','door','barrier','light','column','tree','planter','curtain','stage360','riser','aisle','turf','bleacher','rib','sconce','ceiling-light']},
    x:coordinate,y:coordinate,z:coordinate,sx:scale,sy:scale,sz:scale,
    rotation:{type:'number',minimum:-10000,maximum:10000},
    color:{type:'string',pattern:'^#[a-fA-F0-9]{6}$'},label:{type:'string',maxLength:100},seatId:id
};
spec.components.schemas.RoomStudioScene = object({
    format:{type:'string',enum:['CineAstra-Studio-3D']},
    version:{type:'integer',enum:[2]},
    environment:{type:'string',enum:['cinema','theater','drivein','stadium','park','container','banker','custom']},
    name:str(70),sceneSize:{type:'number',minimum:1,exclusiveMinimum:true,maximum:240},
    objects:{type:'array',minItems:1,maxItems:1200,items:object(sceneFields,Object.keys(sceneFields).filter(key=>key!=='seatId'))}
});
for (const route of roomSceneOperations) {
    const publish = route.method === 'patch';
    const op = { operationId:route.operationId,tags:['Locais'],summary:publish?'Publicar modelo do Studio 3D':'Consultar modelo 3D publicado',
        description:publish?'Requer vínculo único para todos os assentos ativos da sala.':'Retorna a geometria publicada e os IDs dos assentos. A disponibilidade é consultada por sessão.',
        security:publish?[{bearerAuth:[]}]:[],
        parameters:['localId','roomId'].map(name=>({name,in:'path',required:true,schema:id})),
        responses:{200:response(publish?object({published:{type:'boolean',enum:[true]}}):ref('RoomStudioScene'))}
    };
    if(publish) op.requestBody={required:true,content:{'application/json':{schema:ref('RoomStudioScene')}}};
    for(const [code,name] of Object.entries({400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable'}))op.responses[code]={$ref:`#/components/responses/${name}`};
    (spec.paths[route.path]??={})[route.method]=op;
}
await writeFile(file, `${JSON.stringify(spec, null, 2)}\n`);
console.info(`Locais: ${venueOperations.length} operações documentadas.`);
