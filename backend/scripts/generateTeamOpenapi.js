import { readFile, writeFile } from 'node:fs/promises';
import { teamLookupOperations, teamOperations } from '../src/routes/teamRoutes.js';

const file = new URL('../src/docs/openapi.json', import.meta.url);
const spec = JSON.parse(await readFile(file, 'utf8'));
spec.info.version = '1.7.0';
spec.tags = [...spec.tags.filter(tag => tag.name !== 'Equipes'), { name: 'Equipes', description: 'Equipes por sessão, membros, solicitações e convites.' }];
const id = { type: 'string', pattern: '^[1-9][0-9]{0,9}$', description: 'INT UNSIGNED decimal.' };
const entryId = { type: 'string', pattern: '^[1-9][0-9]{0,19}$', description: 'BIGINT UNSIGNED decimal, retornado como string.' };
const str = { type: 'string', minLength: 1, maxLength: 100 };
const obj = (properties, required = Object.keys(properties)) => ({ type: 'object', additionalProperties: false, properties, ...(required.length ? { required } : {}) });
const nullable = schema => ({ ...schema, nullable: true });
const ref = name => ({ $ref: `#/components/schemas/${name}` });
const response = data => ({ description: 'Sucesso', content: { 'application/json': { schema: obj({ success: { type: 'boolean', enum: [true] }, data, requestId: { type: 'string', format: 'uuid' } }) } } });
const [context, collaborator] = teamLookupOperations;
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
spec.components.schemas.TeamMember = obj({ id_equipe_membro: id, id_equipe: id, id_usuario: id, funcao: nullable(str), data_entrada: { type: 'string', format: 'date' }, status: { type: 'string', enum: ['ATIVO','INATIVO'] } });
spec.components.schemas.TeamEntry = obj({ id_entrada: entryId, id_equipe: id, id_usuario: id, id_emissor: id, tipo: { type: 'string', enum: ['SOLICITACAO','CONVITE'] }, funcao_proposta: nullable(str), status: { type: 'string', enum: ['PENDENTE','ACEITA','RECUSADA','CANCELADA'] }, criado_em: { type: 'string' }, decidido_em: nullable({ type: 'string' }) });
const bodies = {
    create: obj({ sessionId: id, nome: str, supervisorId: id }, ['sessionId','nome']),
    patch: { ...obj({ nome: str, status: { type: 'string', enum: ['FINALIZADA','CANCELADA'] }, supervisorId: id }, []), minProperties: 1 },
    changeMember: obj({ funcao: str }), request: obj({}, []), invitation: obj({ userId: id, funcao: str }),
    decision: obj({ decision: { type: 'string', enum: ['ACEITAR','RECUSAR'] }, funcao: str }, ['decision'])
};
const summaries = {
    list: 'Listar equipes visíveis', get: 'Consultar equipe', create: 'Criar equipe para sessão', patch: 'Alterar equipe', archive: 'Cancelar equipe',
    members: 'Listar membros', changeMember: 'Alterar função de membro', removeMember: 'Desativar membro', entries: 'Listar solicitações e convites',
    request: 'Solicitar entrada na equipe', invitation: 'Convidar colaborador', decision: 'Aceitar ou recusar entrada', cancelEntry: 'Cancelar entrada pendente'
};
const descriptions = {
    list: 'ADMIN vê todas; SUPERVISOR vê equipes do cinema atribuído; COLABORADOR vê equipes com vínculo ativo ou convite pendente próprio.',
    get: 'SUPERVISOR vê equipes do cinema atribuído. COLABORADOR vê equipe com vínculo ativo ou convite pendente próprio.',
    create: 'ADMIN indica supervisor ativo; SUPERVISOR só cria para si. Supervisor deve estar vinculado ao cinema da sessão. Sessão deve estar AGENDADA/EM_CARTAZ e aceita uma equipe ativa.',
    patch: 'ADMIN ou supervisor vinculado ao cinema. Transferir supervisão exige ADMIN e vínculo do novo supervisor ao cinema da sessão; cancela entradas pendentes. FINALIZADA/CANCELADA cancelam pendências.',
    archive: 'ADMIN ou supervisor vinculado ao cinema. Cancelamento lógico.',
    members: 'ADMIN, supervisor vinculado ao cinema ou membro ativo da equipe.',
    changeMember: 'Somente ADMIN ou supervisor vinculado ao cinema define função de membro ativo.',
    removeMember: 'ADMIN ou supervisor vinculado ao cinema desativa o vínculo; nova entrada exige solicitação ou convite.',
    entries: 'ADMIN e supervisor vinculado ao cinema veem todas as entradas; COLABORADOR vê somente as próprias quando membro ativo ou convidado.',
    request: 'COLABORADOR membro ativo de outra equipe do mesmo cinema pode solicitar entrada para si; não ingressa automaticamente.',
    invitation: 'ADMIN ou supervisor vinculado ao cinema convida COLABORADOR ativo e define função. Membro só entra após aceitar.',
    decision: 'Solicitação: ADMIN ou supervisor vinculado ao cinema aceita com função, ou recusa. Convite: só destinatário COLABORADOR aceita ou recusa; não redefine função.',
    cancelEntry: 'ADMIN, supervisor próprio ou emissor cancela entrada pendente.'
};
for (const r of teamOperations) {
    const op = { operationId: r.operationId, tags: ['Equipes'], summary: summaries[r.action], description: descriptions[r.action], security: [{ bearerAuth: [] }], parameters: [], responses: {} };
    if (r.path.includes('{id}')) op.parameters.push({ name: 'id', in: 'path', required: true, schema: id });
    if (r.path.includes('{memberId}')) op.parameters.push({ name: 'memberId', in: 'path', required: true, schema: id });
    if (r.path.includes('{entryId}')) op.parameters.push({ name: 'entryId', in: 'path', required: true, schema: entryId });
    if (['list','members','entries'].includes(r.action)) op.parameters.push({ name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } }, { name: 'cursor', in: 'query', schema: r.action === 'entries' ? entryId : id });
    if (bodies[r.action]) op.requestBody = { required: true, content: { 'application/json': { schema: bodies[r.action] } } };
    const data = ['list','members','entries'].includes(r.action) ? obj({ items: { type: 'array', items: ref(r.action === 'list' ? 'Team' : r.action === 'members' ? 'TeamMember' : 'TeamEntry') }, pagination: ref('Pagination') }) : ref(['members','changeMember'].includes(r.action) ? 'TeamMember' : ['request','invitation','decision'].includes(r.action) ? 'TeamEntry' : 'Team');
    if (['archive','removeMember','cancelEntry'].includes(r.action)) op.responses['204'] = { description: 'Alteração concluída sem corpo.' };
    else op.responses[['create','request','invitation'].includes(r.action) ? '201' : '200'] = response(data);
    for (const [code, name] of Object.entries({ 400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable' })) op.responses[code] = { $ref: `#/components/responses/${name}` };
    (spec.paths[r.path] ??= {})[r.method] = op;
}
await writeFile(file, `${JSON.stringify(spec, null, 2)}\n`);
console.info(`Equipes: ${teamOperations.length + teamLookupOperations.length} operações documentadas.`);
