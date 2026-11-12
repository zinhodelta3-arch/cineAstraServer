import { salesOperations } from '../src/routes/salesRoutes.js';
import { orderOperations } from '../src/routes/orderRoutes.js';

const id = { type: 'string', pattern: '^[1-9][0-9]{0,19}$' };
const ref = name => ({ $ref: `#/components/schemas/${name}` });
const json = schema => ({ 'application/json': { schema } });
const param = (name, location, schema) => ({ name, in: location, required: location === 'path', schema });
const definitions = {
  list_admin_sales_orders: ['Listar pedidos', 200, null, ['limit', 'cursor', 'userId', 'status']],
  list_admin_sales_payments: ['Listar pagamentos', 200, null, ['limit', 'cursor', 'userId', 'status', 'orderId']],
  create_admin_order_draft: ['Criar proposta de pedido', 201, 'AdminSalesDraftCreate'],
  update_admin_order_draft: ['Editar proposta pendente', 200, 'AdminSalesDraft'],
  cancel_admin_order: ['Cancelar pedido pendente', 200],
  reconcile_admin_payment: ['Consultar e conciliar pagamento pelo provedor', 200],
  list_admin_payment_notes: ['Consultar notas administrativas do pagamento', 200],
  add_admin_payment_note: ['Adicionar nota ao pagamento', 201, 'AdminSalesPaymentNote'],
  get_own_admin_order_draft: ['Consultar a própria proposta pendente', 200]
};

export function documentAdminSales(spec) {
  const { schemas } = spec.components;
  const draft = structuredClone(schemas.OrderCartInput);
  delete draft.properties.acceptance;
  schemas.AdminSalesDraft = draft;
  schemas.AdminSalesDraftCreate = {
    type: 'object', additionalProperties: false, required: ['userId', 'draft'],
    properties: { userId: id, draft: ref('AdminSalesDraft') }
  };
  schemas.AdminSalesPaymentNote = {
    type: 'object', additionalProperties: false, required: ['note'],
    properties: { note: { type: 'string', minLength: 1, maxLength: 1000 } }
  };
  schemas.OrderCheckoutInput = structuredClone(schemas.OrderCartInput);
  schemas.OrderCheckoutInput.properties.draftOrderId = { ...id, description: 'Proposta pendente do cliente, com os mesmos itens.' };
  spec.paths['/api/orders/checkout'].post.requestBody.content['application/json'].schema = ref('OrderCheckoutInput');
  const listSchema = spec.paths['/api/orders'].get.responses['200'].content['application/json'].schema;
  listSchema.properties.data.properties.items.items.properties.administrativeDraft = { type: 'boolean' };

  const ownDraft = orderOperations.find(route => route.action === 'draft');
  for (const { path, method, operationId } of [...salesOperations, ownDraft]) {
    const [summary, code, requestSchema, query = []] = definitions[operationId];
    const customer = operationId === ownDraft.operationId;
    const parameters = query.map(name => param(name, 'query', name === 'limit'
      ? { type: 'integer', minimum: 1, maximum: 100 }
      : name === 'status' ? { type: 'string' } : id));
    const pathParam = path.match(/\{(\w+)\}/)?.[1];
    if (pathParam) parameters.push(param(pathParam, 'path', id));
    const responses = {
      [code]: { description: summary, content: json({
        type: 'object', required: ['success', 'data', 'requestId'],
        properties: { success: { type: 'boolean' }, data: customer ? ref('AdminSalesDraft') : { type: 'object' }, requestId: { type: 'string', format: 'uuid' } }
      }) }
    };
    for (const [status, name] of Object.entries({ 401: 'Unauthorized', 403: 'Forbidden', 404: 'NotFound', 409: 'Conflict', 422: 'ValidationError', 429: 'RateLimited', 503: 'Unavailable' })) {
      responses[status] = { $ref: `#/components/responses/${name}` };
    }
    (spec.paths[path] ??= {})[method] = {
      operationId, summary, tags: [customer ? 'Carrinho' : 'Vendas administrativas'],
      security: [{ bearerAuth: [] }], parameters, responses,
      ...(requestSchema ? { requestBody: { required: true, content: json(ref(requestSchema)) } } : {})
    };
  }
}
