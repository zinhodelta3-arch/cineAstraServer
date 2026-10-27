# Admin — bloco de reembolsos

Fila e detalhe administrativo implementados no módulo de reembolso existente. Nenhuma migration nova, nenhuma alteração de frontend ou implantação.

## Endpoints

| Método | Rota | Uso |
|---|---|---|
| GET | `/api/admin/refunds` | Nova fila paginada |
| GET | `/api/admin/refunds/{id}` | Novo detalhe para análise |
| POST | `/api/admin/refunds/{id}/decision` | Decisão já existente, reutilizada |

Somente ADMIN com sessão ativa. Router e service verificam o papel. Respostas não usam cache. As consultas não fazem chamadas ao gateway, não reconciliam nem alteram estados financeiros.

## Filtros da fila

- `limit`: padrão 20, máximo 100.
- `cursor`: ID do último reembolso da página anterior, exclusivo, string BIGINT UNSIGNED.
- `status`: RECEBIDA, EM_ANALISE, ENVIADA, CONFIRMADA, NEGADA ou FALHOU.
- `reason`: ARREPENDIMENTO, DEFEITO, OUTRO ou CANCELAMENTO_PLANO.
- `compensation`: NAO_APLICAVEL, PENDENTE ou CONCLUIDA.
- `userId`: ID exato do solicitante, string INT UNSIGNED.
- `paymentId`, `orderId`, `chargeId`: IDs exatos, strings BIGINT UNSIGNED.

Filtros combinados por AND. Sem filtro de status, retorna todos os estados. Ordem decrescente de ID; não é ordenação por SLA. Manter filtros ao paginar e reiniciar cursor ao trocá-los. Não há total agregado ou pesquisa textual neste bloco. Exemplos:

```text
GET /api/admin/refunds?status=EM_ANALISE&limit=20
GET /api/admin/refunds?status=CONFIRMADA&compensation=PENDENTE
GET /api/admin/refunds?paymentId=7
```

## Dados retornados

Envelope `{success, data, requestId}`. Na fila, `data` contém `items` e `pagination: {limit, nextCursor}`. Lista vazia é sucesso; nextCursor null indica fim.

Cada resumo inclui:

- `id`, `paymentId`, `userId`, `orderId`, `chargeId` (os dois últimos podem ser null).
- `reason`, `status`, `withinSevenDays`, `compensation`.
- `requestedAmount`, `confirmedAmount`, `paymentAmount`, `paymentStatus`.
- `receivedAt`, `responseDueAt`, `respondedAt`: UTC ISO; respondedAt pode ser null.

O detalhe acrescenta `details` (relato do cliente), `termsVersion` e `decisionBasis`, todos podendo ser null. Renderizar os campos livres como texto, nunca como HTML.

Valores monetários permanecem strings decimais; valores ainda não definidos são null. IDs permanecem strings. Não retorna chaves de idempotência, referências/transações do gateway, tokens, dados de cartão ou CPF.

A consulta do cliente em `/api/refunds/{id}` continua restrita ao titular CLIENTE, com seu contrato anterior. Não usar essa rota para a tela administrativa.

## Fluxo de decisão existente

1. Listar EM_ANALISE e consultar detalhe por ID.
2. Enviar a decisão à rota POST existente com `decision`, `termsVersion`, `basis` e, ao aprovar, `amount`.
3. O serviço revalida estado, versão dos termos e valor disponível; conflitos retornam 409.
4. Aprovar passa a solicitação para RECEBIDA, sujeita ao envio/processamento do provider; não significa dinheiro estornado.
5. A confirmação financeira depende do gateway. Compensação de direitos pode continuar PENDENTE, conforme comportamento já existente.

A fila pode mostrar saldo/status de pagamento para análise, mas não fornece uma garantia de valor aprovável: a decisão calcula o saldo real transacionalmente. Não foram criadas ações de forçar confirmação, executar compensação ou reconciliar como admin.

## Erros e validação

401: sem sessão; 403: não ADMIN; 404: detalhe inexistente; 422: filtros/IDs/paginação inválidos. Filtros desconhecidos, repetidos e IDs fora da faixa são rejeitados. A decisão preserva seus erros e regras atuais.

- [Model](../backend/src/models/refundModel.js)
- [Service](../backend/src/services/refundService.js)
- [Controller](../backend/src/controllers/refundController.js)
- [Router](../backend/src/routes/refundRoutes.js)
- [Validators](../backend/src/validators/refundValidators.js)
- [Gerador OpenAPI](../backend/scripts/generateRefundOpenapi.js)
- [Testes administrativos](../backend/tests/adminRefund.test.js)
- [Testes existentes de reembolso](../backend/tests/refund.test.js)

Testes HTTP/service usam persistência simulada. Conferem filtros, paginação, autorização, DTOs, ausência de chamadas ao gateway e SQL parametrizado. Consultas ainda precisam de validação em MySQL real antes da implantação. Reutiliza as tabelas de reembolsos/pagamentos existentes.
