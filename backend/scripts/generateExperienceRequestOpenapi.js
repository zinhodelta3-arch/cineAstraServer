import { readFile, writeFile } from 'node:fs/promises';
import { experienceRequestOperations } from '../src/routes/experienceRequestRoutes.js';

const file = new URL('../src/docs/openapi.json', import.meta.url);
const spec = JSON.parse(await readFile(file, 'utf8'));
const tag = 'Solicitações de experiências';
if (!spec.tags.some(item => item.name === tag)) spec.tags.push({ name: tag, description: 'Orçamento, triagem e acompanhamento por unidade.' });
const id = { type: 'string', pattern: '^[1-9][0-9]{0,9}$' };
const str = (maxLength = 4000) => ({ type: 'string', maxLength });
const nullable = property => ({ ...property, nullable: true });
const status = { type: 'string', enum: ['RECEBIDA', 'EM_ANALISE', 'PROPOSTA_ENVIADA', 'CONCLUIDA', 'CANCELADA'] };
const date = { type: 'string', format: 'date' };
const time = { type: 'string', pattern: '^([01][0-9]|2[0-3]):[0-5][0-9]$' };
const guests = { type: 'integer', minimum: 1, maximum: 100000 };
const object = (properties, required = Object.keys(properties)) => ({ type: 'object', additionalProperties: false, properties, ...(required.length ? { required } : { minProperties: 1 }) });
const array = items => ({ type: 'array', items });
const fields = {
    id, protocol: str(14), title: str(150), status, locationId: nullable(id), location: nullable(str(150)),
    date, time: nullable(time), guests, details: str(), preferences: nullable(str(1000)),
    requirements: nullable(str(1000)), custom: { type: 'boolean' }, updatedAt: str(40),
};
const event = object({ id, type: { type: 'string', enum: ['STATUS', 'MENSAGEM', 'ATRIBUICAO'] },
    sender: { type: 'string', enum: ['CLIENTE', 'EQUIPE'] }, text: str(), createdAt: str(40) });
const definitions = [
    ['Listar solicitações visíveis à conta', object({ items: array(object(fields)), nextCursor: nullable(id) })],
    ['Criar solicitação como cliente', object(fields), {
        ...object({ experienceId: id, customSpace: { ...str(150), minLength: 3 }, locationId: id, date, time, guests,
            details: { ...str(), minLength: 10 }, preferences: str(1000), requirements: str(1000) }, ['date', 'guests', 'details']),
        oneOf: [{ required: ['experienceId'] }, { required: ['customSpace'] }]
    }],
    ['Consultar solicitação e histórico', object({ ...fields, canClaim: { type: 'boolean' }, events: array(event), nextCursor: nullable(id) })],
    ['Atualizar status ou encaminhar solicitação', object(fields), object({ status, locationId: id, supervisorId: id }, [])],
    ['Enviar mensagem à outra parte', object({ id }), object({ message: str() })],
];

for (const [index, { method, path, operationId }] of experienceRequestOperations.entries()) {
    const [summary, data, input] = definitions[index];
    const parameters = [];
    if (path.includes('{id}')) parameters.push({ name: 'id', in: 'path', required: true, schema: id });
    if (method === 'get') parameters.push({ name: 'cursor', in: 'query', schema: id });
    const outcome = object({ success: { type: 'boolean', enum: [true] }, data, requestId: { type: 'string', format: 'uuid' } });
    const responses = { [method === 'post' ? '201' : '200']: { description: 'Operação concluída', content: { 'application/json': { schema: outcome } } } };
    for (const [code, ref] of Object.entries({ 401: 'Unauthorized', 403: 'Forbidden', 404: 'NotFound', 422: 'ValidationError', 429: 'RateLimited', 500: 'InternalError' })) {
        responses[code] = { $ref: '#/components/responses/' + ref };
    }
    (spec.paths[path] ??= {})[method] = { operationId, summary, tags: [tag], security: [{ bearerAuth: [] }], parameters,
        ...(input && { requestBody: { required: true, content: { 'application/json': { schema: input } } } }), responses };
}
await writeFile(file, JSON.stringify(spec, null, 2) + '\n');
