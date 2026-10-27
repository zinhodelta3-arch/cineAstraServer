# Admin — bloco de usuários e privacidade

Implementado no backend: listagem/pesquisa de usuários e fila de solicitações de privacidade. Não cria páginas frontend nem altera decisões de privacidade ou regras de alteração de acesso.

## Endpoints novos

Somente ADMIN com Bearer token e sessão ativa. O papel é conferido tanto no router quanto no service, com revalidação da identidade. Respostas usam `Cache-Control: no-store`.

| Endpoint | Filtros opcionais |
|---|---|
| `GET /api/admin/users` | `q`, `userId`, `role`, `status`, `limit`, `cursor` |
| `GET /api/admin/privacy-requests` | `q`, `userId`, `type`, `status`, `limit`, `cursor` |

- `q`: trecho literal de nome ou e-mail, de 1 a 150 caracteres após trim. `%`, `_` e `!` não funcionam como curingas. Comparação de maiúsculas/acentos segue a collation do banco.
- Filtros combinam por AND; nome/e-mail dentro de q combinam por OR.
- `userId`: identificador exato da conta, string INT UNSIGNED.
- `role`: ADMIN, FORNECEDOR, SUPERVISOR, COLABORADOR, CLIENTE.
- Status de usuário: ATIVO, INATIVO, BLOQUEADO, PENDENTE_VERIFICACAO.
- Status de privacidade: RECEBIDA, EM_ANALISE, CONCLUIDA, RECUSADA. Tipo suportado hoje: EXCLUSAO.
- Sem status informado, retorna todos os estados. Para fila pendente, solicitar explicitamente o estado desejado; este contrato não aceita múltiplos status no mesmo parâmetro.
- Paginação padrão 20, máximo 100, ordem por ID decrescente, cursor exclusivo. Cursor de usuário é INT UNSIGNED; de solicitação é BIGINT UNSIGNED. Preservar IDs como strings.
- Manter os filtros ao enviar `nextCursor`. Reiniciar paginação ao trocar filtros. Não há contagem total nesta primeira versão.

Exemplo:

```text
GET /api/admin/users?q=ana&role=CLIENTE&status=INATIVO&limit=20
GET /api/admin/privacy-requests?status=RECEBIDA&type=EXCLUSAO&limit=20
```

## Respostas

Envelope `{success, data, requestId}`. `data` contém `items` e `pagination: {limit, nextCursor}`. Lista vazia é sucesso; `nextCursor: null` indica fim.

Resumo de usuário:

```json
{"id":"3","name":"Ana","email":"ana@example.com","role":"CLIENTE","status":"INATIVO","createdAt":null}
```

Resumo de solicitação:

```json
{"id":"9007199254740993","user":{"id":"3","name":"Ana","email":"ana@example.com"},"type":"EXCLUSAO","status":"RECEBIDA","createdAt":"2026-10-25T12:00:00.000Z","closedAt":null}
```

Datas são UTC ISO; data de cadastro legada pode ser null. A lista não retorna CPF, senha/hash, telefone, data de nascimento, tokens ou motivo detalhado da decisão. O detalhe de privacidade continua no endpoint existente por ID.

Erros: 401 para sessão ausente/inválida, 403 para papel não ADMIN, 422 para filtro desconhecido/inválido, cursor fora da faixa ou parâmetros repetidos. Falhas de infraestrutura seguem o tratamento comum da API.

## Operações existentes reutilizadas

- `GET /api/admin/users/{id}`: detalhe do usuário.
- `POST /api/admin/users`: criação administrativa de contas conforme regras existentes.
- `PATCH /api/admin/users/{id}/access`: alteração de acesso; preserva proteção do último administrador e restrições de reativação.
- `GET /api/admin/privacy-requests/{id}`: detalhe/status da solicitação.

Não foi criado endpoint de aprovação/exclusão definitiva de dados. A fila permite encontrar as solicitações; uma futura decisão automatizada depende de regras de retenção e execução próprias. CAPTCHA e 2FA permanecem com as flags atuais.

## Arquivos e validação

- [Model](../backend/src/models/adminDirectoryModel.js)
- [Service](../backend/src/services/adminDirectoryService.js)
- [Controller](../backend/src/controllers/adminDirectoryController.js)
- [Router](../backend/src/routes/adminDirectoryRoutes.js)
- [Validators](../backend/src/validators/adminDirectoryValidators.js)
- [Gerador OpenAPI](../backend/scripts/generateAdminDirectoryOpenapi.js)
- [Testes](../backend/tests/adminDirectory.test.js)

Reutiliza `usuarios` e `solicitacoes_privacidade`; nenhuma migration nova. Os testes cobrem filtros, paginação, DTOs, rejeição de acesso e SQL parametrizado com busca literal. Ainda é necessário validar as consultas no MySQL real. Busca por trecho usa LIKE com wildcard inicial; em bases grandes, avaliar EXPLAIN e uma estratégia de busca específica, sem presumir que índice comum resolve esse filtro.
