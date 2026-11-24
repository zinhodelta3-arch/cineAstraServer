import { readFile, writeFile } from 'node:fs/promises';
import { supplierOperations } from '../src/routes/supplierRoutes.js';

const file = new URL('../src/docs/openapi.json', import.meta.url);
const spec = JSON.parse(await readFile(file, 'utf8'));
spec.tags = [...spec.tags.filter(t => t.name !== 'Fornecedores'), { name: 'Fornecedores', description: 'Cadastro administrativo e consulta da própria conta de fornecedor.' }];
const id = { type: 'string', pattern: '^[1-9][0-9]{0,9}$', description: 'INT UNSIGNED decimal.' };
const cnpj = { type: 'string', pattern: '^(?:[A-Za-z0-9]{12}[0-9]{2}|[A-Za-z0-9]{2}\\.[A-Za-z0-9]{3}\\.[A-Za-z0-9]{3}/[A-Za-z0-9]{4}-[0-9]{2})$', description: 'CNPJ numérico ou alfanumérico com DVs válidos; armazenado em 14 caracteres maiúsculos.' };
const name = { type: 'string', minLength: 1, maxLength: 150 };
const obj = (properties, required = Object.keys(properties)) => ({ type: 'object', additionalProperties: false, properties, ...(required.length ? { required } : {}) });
const ref = name => ({ $ref: `#/components/schemas/${name}` });
const response = data => ({ description: 'Sucesso', content: { 'application/json': { schema: obj({ success: { type: 'boolean', enum: [true] }, data, requestId: { type: 'string', format: 'uuid' } }) } } });
const status = { type: 'string', enum: ['ATIVO','INATIVO'] };
spec.components.schemas.SupplierAdmin = obj({ id_fornecedor: id, id_usuario: id, id_empresa:{...id,nullable:true},
    email:{type:'string',format:'email',nullable:true},razao_social: name, nome_cine: { ...name, nullable: true }, cnpj: { type: 'string', maxLength: 18, description: 'Novos registros em 14 caracteres; legados podem conservar pontuação.' }, status, data_cadastro: { type: 'string' } });
spec.components.schemas.SupplierSelf = obj({ id_fornecedor: id, razao_social: name, nome_cine: { ...name, nullable: true }, cnpj_ultimos4: { type: 'string', pattern: '^[A-Z0-9]{2}[0-9]{2}$' }, status });
const details={razao_social:name,nome_cine:{...name,nullable:true}};
spec.components.schemas.SupplierCompany = obj({id_empresa:id,...details,cnpj});
const bodies = { create: obj({ userId: id, companyId:id }), patch: { ...obj({ companyId:id, status }, []), minProperties: 1 },
    companyCreate:obj({...details,cnpj},['razao_social','cnpj']),companyPatch:obj(details,['razao_social']) };
const summaries = { list: 'Listar fornecedores', create: 'Cadastrar fornecedor', get: 'Consultar fornecedor', patch: 'Alterar fornecedor', archive: 'Arquivar fornecedor', me: 'Consultar meu cadastro de fornecedor',
    companies:'Listar empresas fornecedoras',companyCreate:'Cadastrar empresa fornecedora',companyPatch:'Editar empresa fornecedora' };
const descriptions = {
    list: 'ADMIN vê cadastro e CNPJ; paginação por ID e filtro de status.',
    create: 'ADMIN vincula uma conta FORNECEDOR ativa a uma empresa cadastrada. Várias contas podem usar a mesma empresa.',
    get: 'ADMIN consulta o cadastro com o e-mail da conta vinculada.',
    patch: 'ADMIN altera a empresa ou o status, preservando o vínculo com a conta.',
    archive: 'ADMIN marca INATIVO; mantém produtos, logística e histórico.',
    me: 'FORNECEDOR obtém cadastro vinculado ao próprio usuário autenticado, com CNPJ abreviado.',
    companies:'ADMIN pesquisa empresas pela razão social, nome de exibição ou CNPJ.',
    companyCreate:'ADMIN cadastra uma empresa por CNPJ normalizado e único.',
    companyPatch:'ADMIN altera os nomes cadastrais compartilhados com as contas vinculadas.'
};
for (const r of supplierOperations) {
    const op = { operationId: r.operationId, tags: ['Fornecedores'], summary: summaries[r.action], description: descriptions[r.action], security: [{ bearerAuth: [] }], parameters: [], responses: {} };
    if (r.path.includes('{id}')) op.parameters.push({ name: 'id', in: 'path', required: true, schema: id });
    if (['list','companies'].includes(r.action)) {
        op.parameters.push({ name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } }, { name: 'cursor', in: 'query', schema: id });
        if (r.action==='list') op.parameters.push({name:'companyId',in:'query',schema:id});
        op.parameters.push(r.action==='list'?{name:'status',in:'query',schema:status}:{name:'q',in:'query',schema:{type:'string',maxLength:150}});
    }
    if (bodies[r.action]) op.requestBody = { required: true, content: { 'application/json': { schema: bodies[r.action] } } };
    if (r.action === 'archive') op.responses['204'] = { description: 'Fornecedor marcado INATIVO.' };
    else if (['list','companies'].includes(r.action)) op.responses['200'] = response(obj({ items: { type: 'array', items: ref(r.action==='list'?'SupplierAdmin':'SupplierCompany') }, pagination: ref('Pagination') }));
    else op.responses[['create','companyCreate'].includes(r.action) ? '201' : '200'] = response(ref(r.action === 'me' ? 'SupplierSelf' : r.action.startsWith('company')?'SupplierCompany':'SupplierAdmin'));
    for (const [code, name] of Object.entries({ 400:'BadRequest',401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',413:'PayloadTooLarge',422:'ValidationError',429:'RateLimited',500:'InternalError',503:'Unavailable' })) op.responses[code] = { $ref: `#/components/responses/${name}` };
    (spec.paths[r.path] ??= {})[r.method] = op;
}
await writeFile(file, `${JSON.stringify(spec, null, 2)}\n`);
console.info(`Fornecedores: ${supplierOperations.length} operações documentadas.`);
