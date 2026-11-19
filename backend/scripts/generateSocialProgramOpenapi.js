import { readFile, writeFile } from 'node:fs/promises';
import { socialProgramOperations } from '../src/routes/socialProgramRoutes.js';

const file = new URL('../src/docs/openapi.json', import.meta.url);
const spec = JSON.parse(await readFile(file, 'utf8'));
const name = 'Programa social';
if (!spec.tags.some(tag => tag.name === name)) spec.tags.push({ name, description: 'Iniciativas por competência e destinação custeada pelo CineAstra.' });
const id = { type: 'string', pattern: '^[1-9][0-9]{0,19}$' };
const month = { type: 'string', pattern: '^20[0-9]{2}-(0[1-9]|1[0-2])$' };
const money = { type: 'string', pattern: '^[0-9]+[.][0-9]{2}$' };
const str = { type: 'string' };
const proofUrl = { type: 'string', format: 'uri', maxLength: 2048, nullable: true };
const obj = (properties, required = Object.keys(properties)) => ({ type: 'object', additionalProperties: false, properties, required });
const initiative = { id, month, institution: str, category: str, description: str, purpose: str, proofUrl, simulated: { type: 'boolean' }, active: { type: 'boolean' } };
const contribution = { ...obj({ initiativeId: id, institution: str, month, amount: money, simulated: { type: 'boolean' } }), nullable: true };
spec.components.schemas.OrderCartQuote.properties.socialDestination = contribution;
spec.components.schemas.OrderOperationalStatus.properties.socialDestination = contribution;

for (const { method, path, operationId } of socialProgramOperations) {
    const isList = method === 'get';
    const fields = { ...initiative, amount: money, ...(path.includes('/admin/') && { gross: money, adjustments: money }) };
    const data = isList ? obj({ items: { type: 'array', items: obj(fields) },
        pagination: obj({ limit: { type: 'integer' }, nextCursor: { ...id, nullable: true } }) }) : obj(initiative);
    const response = obj({ success: { type: 'boolean', enum: [true] }, data, requestId: { type: 'string', format: 'uuid' } });
    const responses = { [method === 'post' ? '201' : '200']: { description: 'Operação concluída', content: { 'application/json': { schema: response } } } };
    for (const [status, component] of Object.entries({401:'Unauthorized',403:'Forbidden',404:'NotFound',409:'Conflict',422:'ValidationError',500:'InternalError'})) responses[status] = { $ref: '#/components/responses/' + component };
    const parameters = isList ? [{ name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100 } }, { name: 'cursor', in: 'query', schema: id }] :
        method === 'patch' ? [{ name: 'id', in: 'path', required: true, schema: id }] : [];
    if (isList && !path.includes('/admin/')) parameters.push({ name: 'period', in: 'query', schema: { type: 'string', enum: ['current', 'other'] },
        description: 'Filtra pelo mês atual do CineAstra ou pelos demais meses.' });
    const body = method === 'post' ? obj({ month, destinationId: id, proofUrl }, ['month','destinationId']) : obj({ proofUrl });
    const summary = isList ? 'Consultar iniciativas mensais e valores registrados' : method === 'post' ? 'Publicar a iniciativa de uma competência' : 'Atualizar link público de comprovação';
    (spec.paths[path] ??= {})[method] = { operationId, summary, tags: [name],
        security: path.includes('/admin/') ? [{ bearerAuth: [] }] : [], parameters, responses,
        ...(!isList && { requestBody: { required: true, content: { 'application/json': { schema: body } } } }) };
}
await writeFile(file, JSON.stringify(spec, null, 2) + '\n');
