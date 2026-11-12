import { commerceErrors } from './commerce-errors.mjs';

const statusCodes = { 400: 'INVALID_REQUEST', 401: 'UNAUTHENTICATED', 403: 'FORBIDDEN', 404: 'NOT_FOUND', 408: 'REQUEST_TIMEOUT', 409: 'CONFLICT', 413: 'PAYLOAD_TOO_LARGE', 415: 'UNSUPPORTED_MEDIA', 422: 'VALIDATION_ERROR', 429: 'RATE_LIMITED', 500: 'INTERNAL_ERROR', 502: 'INVALID_RESPONSE', 503: 'DEPENDENCY_UNAVAILABLE', 504: 'REQUEST_TIMEOUT' };
const messages = {
  NETWORK_ERROR: 'Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.',
  REQUEST_TIMEOUT: 'O serviço demorou para responder. Consulte o estado da operação antes de tentar novamente.',
  DEPENDENCY_UNAVAILABLE: 'O serviço está temporariamente indisponível. Tente novamente em instantes.',
  INTERNAL_ERROR: 'Não foi possível concluir a operação por uma falha interna. Tente novamente; se persistir, contate o suporte.',
  INVALID_RESPONSE: 'O servidor retornou uma resposta inválida. Tente novamente; se persistir, contate o suporte.',
  RATE_LIMITED: 'Muitas tentativas em pouco tempo. Aguarde antes de tentar novamente.',
  PAYLOAD_TOO_LARGE: 'Os dados enviados excedem o tamanho permitido. Reduza o arquivo ou o conteúdo.',
  UNSUPPORTED_MEDIA: 'O formato enviado não é aceito. Confira o tipo de arquivo ou de conteúdo.',
  MALFORMED_JSON: 'Os dados enviados estão em um formato inválido. Confira o formulário e tente novamente.',
  DUPLICATE_RESOURCE: 'Já existe um registro com esses dados. Abra o cadastro existente ou altere os dados antes de salvar.',
  RESOURCE_IN_USE: 'O registro está vinculado a outros dados. Revise os vínculos antes de tentar removê-lo.',
  INVALID_REFERENCE: 'Um registro selecionado deixou de estar disponível. Atualize as opções e selecione novamente.',
  ROOM_CAPACITY_MISMATCH: 'Informe uma capacidade igual à quantidade de assentos ativos da sala.',
  ROOM_CAPACITY_REACHED: 'A sala atingiu o limite de assentos ativos. Revise o mapa de assentos antes de ativar mais um.',
  TASK_MEMBERSHIP_REQUIRED: 'Para acessar os chamados, entre na equipe e confirme com o supervisor que sua função foi atribuída.',
  TRANSACTION_CONFLICT: 'Os dados foram alterados por outra operação. Atualize a página e confira o estado antes de tentar novamente.',
  UPLOAD_BUSY: 'Há outros envios de imagens em andamento. Aguarde e tente novamente.',
  INVALID_UPLOAD: 'Não foi possível ler o arquivo enviado. Selecione uma imagem válida e tente novamente.',
  ...commerceErrors,
};
const fieldLabels = { name: 'nome', nome: 'nome', email: 'e-mail', cpf: 'CPF', cnpj: 'CNPJ', password: 'senha', passwordConfirmation: 'confirmação da senha', dateOfBirth: 'data de nascimento', phone: 'telefone', quantity: 'quantidade', quantidade: 'quantidade', price: 'preço', preco: 'preço', valor: 'valor', localId: 'unidade', sessionId: 'sessão', filmId: 'filme', teamId: 'equipe', userId: 'usuário', reason: 'justificativa', justificativa: 'justificativa', message: 'mensagem', subject: 'assunto', titulo: 'título', descricao: 'descrição', status: 'status', items: 'itens', start: 'data inicial', end: 'data final' };

export function errorMetadata(value, status = 503) {
  const code = typeof value?.code === 'string' && /^[A-Z][A-Z0-9_]{0,79}$/.test(value.code) ? value.code : statusCodes[status] ?? (status >= 500 ? 'INTERNAL_ERROR' : 'INVALID_REQUEST');
  const requestId = typeof value?.requestId === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value.requestId) ? value.requestId : null;
  const details = Array.isArray(value?.details) ? value.details.filter(item => item && typeof item.field === 'string' && typeof item.code === 'string' && /^[a-zA-Z0-9_.-]{1,80}$/.test(item.field) && /^[A-Z_]{1,50}$/.test(item.code)).slice(0, 20).map(({ field, code }) => ({ field, code })) : [];
  const retryAfter = Number(value?.retryAfter);
  return { code, ...(requestId && { requestId }), ...(details.length && { details }), ...(Number.isInteger(retryAfter) && retryAfter > 0 && retryAfter <= 86400 && { retryAfter }) };
}

export function errorMessage(status, code, fallback) {
  if (Object.hasOwn(messages, code)) return messages[code];
  if (status >= 500) return status === 503 ? messages.DEPENDENCY_UNAVAILABLE : messages.INTERNAL_ERROR;
  if (typeof fallback === 'string' && fallback.trim()) return fallback;
  return ({ 401: 'Entre na sua conta para continuar.', 403: 'Sua conta não tem permissão para esta operação.', 404: 'O registro solicitado não está disponível.', 409: 'A operação conflita com o estado atual dos dados. Atualize a página.', 422: 'Confira os dados informados.' })[status] ?? 'Não foi possível concluir a operação. Tente novamente.';
}

export function responseError(response, payload) {
  const metadata = errorMetadata({ ...payload, requestId: payload?.requestId ?? response.headers.get('X-Request-Id'), retryAfter: payload?.retryAfter ?? response.headers.get('Retry-After') }, response.status);
  const error = new Error(errorMessage(response.status, metadata.code, payload?.message));
  error.name = 'ApiResponseError';
  if (metadata.code === 'INVALID_RESPONSE') error.message = `O servidor retornou uma resposta inválida (HTTP ${response.status}). Tente novamente; se persistir, contate o suporte.`;
  if (response.status === 422 && metadata.details?.length) {
    const labels = [...new Set(metadata.details.map(item => fieldLabels[item.field.replace(/^(body|query|params)\./, '')]).filter(label => typeof label === 'string'))];
    if (labels.length) error.message += ` Campos a conferir: ${labels.join(', ')}.`;
  }
  Object.assign(error, metadata, { status: response.status });
  if (response.status === 429 && metadata.retryAfter) error.message += ` Aguarde ${metadata.retryAfter} segundos.`;
  if (response.status >= 500 && metadata.requestId) error.message += ` Código de atendimento: ${metadata.requestId}.`;
  return error;
}

export function networkError(cause) {
  const code = cause?.name === 'TimeoutError' || cause?.name === 'AbortError' ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR';
  return Object.assign(new Error(errorMessage(503, code)), { name: 'ApiResponseError', status: 503, code });
}
