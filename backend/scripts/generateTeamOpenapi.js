import { readFile, writeFile } from 'node:fs/promises';
import { teamLookupOperations, teamOperations } from '../src/routes/teamRoutes.js';

const file = new URL('../src/docs/openapi.json', import.meta.url);
const spec = JSON.parse(await readFile(file, 'utf8'));
spec.tags = [...spec.tags.filter(tag => tag.name !== 'Equipes'), { name: 'Equipes', description: 'Equipes por sessão, membros, solicitações e convites.' }];
const id = { type: 'string', pattern: '^[1-9][0-9]{0,9}$', description: 'INT UNSIGNED decimal.' };
const entryId = { type: 'string', pattern: '^[1-9][0-9]{0,19}$', description: 'BIGINT UNSIGNED decimal, retornado como string.' };
const str = { type: 'string', minLength: 1, maxLength: 100 };
const obj = (properties, required = Object.keys(properties)) => ({ type: 'object', additionalProperties: false, properties, ...(required.length ? { required } : {}) });
const nullable = schema => ({ ...schema, nullable: true });
const ref = name => ({ $ref: `#/components/schemas/${name}` });
const response = data => ({ description: 'Sucesso', content: { 'application/json': { schema: obj({ success: { type: 'boolean', enum: [true] }, data, requestId: { type: 'string', format: 'uuid' } }) } } });
const [context, collaborator, available, ownRequests, eligible, ownInvitations, collaborators] = teamLookupOperations;
const sessionDate = { type:'string',format:'date' };
const sessionTime = { type:'string',pattern:'^[0-9]{2}:[0-9]{2}:[0-9]{2}$' };
const expiresAt={type:'string',description:'Data e hora UTC. Vale até sete dias ou o fim da sessão, o que ocorrer primeiro.'};
const collaboratorProfile=obj({id,name:str,email:{type:'string',format:'email'},phone:nullable(str),status:{type:'string',enum:['ATIVO']}});
spec.paths[collaborators.path]={get:{
    operationId:collaborators.operationId,tags:['Equipes'],summary:'Listar contas de colaboradores do cinema',
    description:'SUPERVISOR vê colaboradores ativos com vínculos vigentes no seu cinema.',
    security:[{bearerAuth:[]}],
    parameters:[{name:'limit',in:'query',schema:{type:'integer',minimum:1,maximum:100,default:20}},
        {name:'cursor',in:'query',schema:id},{name:'q',in:'query',schema:{type:'string',minLength:1,maxLength:100}}],
    responses:{200:response(obj({items:{type:'array',items:collaboratorProfile},pagination:ref('Pagination')})),
        401:{$ref:'#/components/responses/Unauthorized'},403:{$ref:'#/components/responses/Forbidden'},422:{$ref:'#/components/responses/ValidationError'}}
}};
spec.paths[context.path] = { get: {
    operationId: context.operationId, tags: ['Equipes'], summary: 'Consultar cinemas da unidade',
    description: 'SUPERVISOR vê o cinema atribuído; COLABORADOR vê cinemas das equipes em que possui vínculo ativo.',
    security: [{ bearerAuth: [] }], responses: {
        200: response(obj({ locations: { type: 'array', items: obj({ id_local: id, nome: str }) } })),
        401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' }
    }
} };
spec.paths[collaborator.path] = { get: {
    operationId: collaborator.operationId, tags: ['Equipes'], summary: 'Localizar colaborador para convite',
    description: 'SUPERVISOR vinculado a um cinema localiza por e-mail exato uma conta COLABORADOR ativa; retorna somente identificador e nome.',
    security: [{ bearerAuth: [] }], parameters: [{ name: 'email', in: 'query', required: true, schema: { type: 'string', format: 'email', maxLength: 150 } }],
    responses: {
        200: response(obj({ id, name: str })),
        401: { $ref: '#/components/responses/Unauthorized' }, 403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' }, 422: { $ref: '#/components/responses/ValidationError' }
    }
} };
spec.components.schemas.Team = obj({ id_equipe: id, id_supervisor: id, id_sessao: id, nome: str, status: { type: 'string', enum: ['ATIVA','FINALIZADA','CANCELADA'] } });
Object.assign(spec.components.schemas.Team.properties, {
    sessionStatus: { type: 'string', enum: ['AGENDADA','EM_CARTAZ','ENCERRADA','CANCELADA',null], nullable: true },
    myFunction: { type: 'string', nullable: true },
    supervisorName:nullable(str),
    sessionOpen: { type:'boolean' },
    location: nullable(obj({id,name:str})),
    schedule: nullable(obj({date:sessionDate,start:sessionTime,end:sessionTime})),
});
spec.components.schemas.Team.required.push('sessionStatus','sessionOpen','location','schedule','supervisorName');
spec.components.schemas.TeamMember = obj({ id_equipe_membro: id, id_equipe: id, id_usuario: id, name:nullable(str), funcao: nullable(str), data_entrada: { type: 'string', format: 'date' }, status: { type: 'string', enum: ['ATIVO','INATIVO'] } });
spec.components.schemas.TeamEntry = obj({ id_entrada: entryId, id_equipe: id, id_usuario: id, id_emissor: id, tipo: { type: 'string', enum: ['SOLICITACAO','CONVITE'] }, funcao_proposta: nullable(str), status: { type: 'string', enum: ['PENDENTE','ACEITA','RECUSADA','CANCELADA'] }, criado_em: { type: 'string' }, decidido_em: nullable({ type: 'string' }) });
spec.components.schemas.TeamEntry.properties.expiresAt=expiresAt;
const joinLists = [
    [available, 'Listar equipes disponíveis para ingresso', id, obj({
        hasTeam: { type: 'boolean' },
        items: { type: 'array', items: obj({ id_equipe: id, nome: str, cinema: str, data:sessionDate, horario_inicio:sessionTime, horario_fim:sessionTime }) },
        pagination: ref('Pagination')
    })],
    [ownRequests, 'Acompanhar minhas solicitações de ingresso', entryId, obj({
        items: { type: 'array', items: obj({ id_entrada: entryId, id_equipe: id, nome: str, status: spec.components.schemas.TeamEntry.properties.status, criado_em: { type: 'string' }, decidido_em: nullable({ type: 'string' }),funcao_proposta:nullable(str),expiresAt }) },
        pagination: ref('Pagination')
    })],
    [ownInvitations,'Listar convites recebidos',entryId,obj({
        items:{type:'array',items:obj({id_entrada:entryId,id_equipe:id,nome:str,cinema:str,data:sessionDate,
            horario_inicio:sessionTime,horario_fim:sessionTime,status:spec.components.schemas.TeamEntry.properties.status,
            funcao_proposta:nullable(str),criado_em:{type:'string'},decidido_em:nullable({type:'string'}),expiresAt})},
        pagination:ref('Pagination')
    })],
    [eligible,'Listar sessões disponíveis para formar equipe',id,obj({
        items:{type:'array',items:obj({id_sessao:id,data:sessionDate,horario_inicio:sessionTime,horario_fim:sessionTime,titulo_filme:{type:'string'},nome_sala:str})},
        pagination:ref('Pagination')
    })],
];
for (const [operation, summary, cursor, data] of joinLists) {
    spec.paths[operation.path] = { get: {
        operationId: operation.operationId, tags: ['Equipes'], summary, description:operation===eligible?'SUPERVISOR vê sessões vigentes sem equipe ativa no cinema atribuído.':'Exclusivo para COLABORADOR autenticado.',
        security: [{ bearerAuth: [] }],
        parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } },
            { name: 'cursor', in: 'query', schema: cursor },
            ...([ownRequests,ownInvitations].includes(operation)?[{name:'entryId',in:'query',schema:entryId}]:[])
        ],
        responses: { 200: response(data), 401: { $ref: '#/components/responses/Unauthorized' },
            403: { $ref: '#/components/responses/Forbidden' }, 422: { $ref: '#/components/responses/ValidationError' } }
    } };
}
const bodies = {
    create: obj({ sessionId: id, nome: str, supervisorId: id }, ['sessionId','nome']),
    patch: { ...obj({ nome: str, status: { type: 'string', enum: ['FINALIZADA','CANCELADA'] }, supervisorId: id }, []), minProperties: 1 },
    changeMember: obj({ funcao: str }), request: obj({}, []), invitation:{oneOf:[obj({userId:id,funcao:str}),obj({email:{type:'string',format:'email',maxLength:150},funcao:str})]},
    editEntry:obj({funcao:str}),
    createCollaborator:obj({name:str,email:{type:'string',format:'email',maxLength:150},cpf:{type:'string'},
        dateOfBirth:sessionDate,funcao:str,
        password:{type:'string',minLength:12,maxLength:72,writeOnly:true},passwordConfirmation:{type:'string',minLength:12,maxLength:72,writeOnly:true}}),
    editCollaborator:{...obj({name:str,phone:nullable(str)},[]),minProperties:1},
    decision: obj({ decision: { type: 'string', enum: ['ACEITAR','RECUSAR'] }, funcao: str }, ['decision'])
};
const summaries = {
    list: 'Listar equipes visíveis', get: 'Consultar equipe', create: 'Criar equipe para sessão', patch: 'Alterar equipe', archive: 'Cancelar equipe',
    members: 'Listar membros', changeMember: 'Alterar função de membro', removeMember: 'Desativar membro', entries: 'Listar solicitações e convites',
    request: 'Solicitar entrada na equipe', invitation: 'Convidar colaborador', decision: 'Aceitar ou recusar entrada', cancelEntry: 'Cancelar entrada pendente',editEntry:'Editar função proposta em entrada pendente',
    createCollaborator:'Cadastrar colaborador e criar convite',editCollaborator:'Editar perfil do colaborador',deactivateCollaborator:'Desativar acesso do colaborador'
};
const descriptions = {
    list: 'ADMIN vê todas; SUPERVISOR vê equipes do cinema atribuído; COLABORADOR vê equipes com vínculo ativo ou convite pendente próprio.',
    get: 'SUPERVISOR vê equipes do cinema atribuído. COLABORADOR vê equipe com vínculo ativo ou convite pendente próprio.',
    create: 'ADMIN indica supervisor ativo; SUPERVISOR só cria para si. Supervisor deve estar vinculado ao cinema da sessão. Sessão deve estar AGENDADA/EM_CARTAZ e aceita uma equipe ativa.',
    patch: 'ADMIN ou supervisor responsável pela equipe no cinema atribuído. Transferir supervisão exige ADMIN e vínculo do novo supervisor ao cinema da sessão; cancela entradas pendentes. FINALIZADA/CANCELADA cancelam pendências.',
    archive: 'ADMIN ou supervisor responsável pela equipe. Cancelamento lógico.',
    members: 'ADMIN, supervisor vinculado ao cinema ou membro ativo da equipe.',
    changeMember: 'Somente ADMIN ou supervisor responsável pela equipe define função de membro ativo.',
    removeMember: 'ADMIN ou supervisor responsável pela equipe desativa o vínculo; nova entrada exige solicitação ou convite.',
    entries: 'ADMIN e supervisor vinculado ao cinema veem todas as entradas; COLABORADOR vê somente as próprias quando membro ativo ou convidado.',
    request: 'COLABORADOR sem equipe ativa pode solicitar seu primeiro ingresso. Com equipe ativa, a solicitação fica restrita ao cinema em que atua. O supervisor recebe a solicitação e avalia o ingresso.',
    invitation: 'ADMIN ou supervisor responsável convida um COLABORADOR ativo. Se o colaborador já pertence a uma equipe vigente, o convite é restrito ao cinema em que atua.',
    decision: 'Solicitação: ADMIN ou supervisor responsável aceita com função, ou recusa. Convite: apenas o destinatário decide. Após sete dias ou o fim da sessão, entradas pendentes expiram.',
    editEntry:'Somente ADMIN altera a função proposta de um convite ou solicitação ainda pendente e elegível.',
    createCollaborator:'Somente o supervisor responsável pela equipe vigente pode cadastrar uma conta de colaborador. A participação começa após o aceite do convite.',
    editCollaborator:'SUPERVISOR atualiza nome e telefone de um colaborador com vínculo vigente no mesmo cinema.',
    deactivateCollaborator:'SUPERVISOR revoga o acesso e preserva o histórico do colaborador do cinema. Vínculo vigente em outro cinema exige intervenção do ADMIN.',
    cancelEntry: 'ADMIN, supervisor próprio ou emissor cancela entrada pendente.'
};
for (const r of teamOperations) {
    const op = { operationId: r.operationId, tags: ['Equipes'], summary: summaries[r.action], description: descriptions[r.action], security: [{ bearerAuth: [] }], parameters: [], responses: {} };
    if (r.path.includes('{id}')) op.parameters.push({ name: 'id', in: 'path', required: true, schema: id });
    if (r.path.includes('{memberId}')) op.parameters.push({ name: 'memberId', in: 'path', required: true, schema: id });
    if (r.path.includes('{entryId}')) op.parameters.push({ name: 'entryId', in: 'path', required: true, schema: entryId });
    if (['list','members','entries'].includes(r.action)) op.parameters.push({ name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } }, { name: 'cursor', in: 'query', schema: r.action === 'entries' ? entryId : id });
    if(r.action==='entries')op.parameters.push({name:'entryId',in:'query',schema:entryId});
    if (bodies[r.action]) op.requestBody = { required: true, content: { 'application/json': { schema: bodies[r.action] } } };
    const data = ['list','members','entries'].includes(r.action) ? obj({ items: { type: 'array', items: ref(r.action === 'list' ? 'Team' : r.action === 'members' ? 'TeamMember' : 'TeamEntry') }, pagination: ref('Pagination') }) : ref(['members','changeMember'].includes(r.action) ? 'TeamMember' : ['request','invitation','decision','editEntry'].includes(r.action) ? 'TeamEntry' : 'Team');
    if (['archive','removeMember','cancelEntry','deactivateCollaborator'].includes(r.action)) op.responses['204'] = { description: 'Alteração concluída sem corpo.' };
    else if(r.action==='createCollaborator')op.responses['201']=response(obj({id,name:str,entryId}));
    else if(r.action==='editCollaborator')op.responses['200']=response(collaboratorProfile);
    else op.responses[['create','request','invitation'].includes(r.action) ? '201' : '200'] = response(data);
    for (const [code, name] of Object.entries({ 400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable' })) op.responses[code] = { $ref: `#/components/responses/${name}` };
    (spec.paths[r.path] ??= {})[r.method] = op;
}
await writeFile(file, `${JSON.stringify(spec, null, 2)}\n`);
console.info(`Equipes: ${teamOperations.length + teamLookupOperations.length} operações documentadas.`);
