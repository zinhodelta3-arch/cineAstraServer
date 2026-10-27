# Perfis de streaming — contrato implementado

Item 3 do plano de backend. Implementado no código, sem implantação nem integração da tela neste item.

## Rotas

Todas exigem `Authorization: Bearer <token>` de um CLIENTE com sessão ativa. O proprietário vem da autenticação, nunca do corpo da requisição. Perfis de outra conta retornam 404.

| Método | Rota | Resultado |
|---|---|---|
| GET | `/api/streaming/profiles` | `items`, `activeProfileId`, `maxProfiles: 5` |
| POST | `/api/streaming/profiles` | Cria perfil; 201 e header Location |
| GET | `/api/streaming/profiles/{id}` | Consulta perfil próprio |
| PATCH | `/api/streaming/profiles/{id}` | Altera nome, avatar ou preferência infantil |
| DELETE | `/api/streaming/profiles/{id}` | Remove perfil; 204 sem corpo |
| POST | `/api/streaming/profiles/{id}/select` | Seleciona e devolve o perfil ativo; corpo vazio ou `{}` |

Criação:

```json
{"name":"Marina","avatar":"gato","kids":false}
```

Perfil retornado dentro de `data` do envelope `{success, data, requestId}`:

```json
{"id":"1","name":"Marina","avatar":"gato","kids":false,"selected":true,"photoUrl":null}
```

PATCH aceita um ou mais campos de criação. IDs são strings. A listagem não precisa de paginação porque é limitada a cinco perfis.

## Regras

- Nome obrigatório, aparado, normalizado em NFC, até 24 caracteres (limite UTF-16 do validator, como a tela atual). Nomes não diferenciam maiúsculas/minúsculas dentro da conta. Acentos são preservados.
- Avatares: `astronauta`, `gato`, `lua`, `pipoca`, `fantasma`, `robo`, `raposa`, `estrela`. Padrão: `astronauta`; `kids` padrão false.
- Conta nova retorna lista vazia: o frontend deve oferecer criação. Nenhum perfil demonstrativo é gravado automaticamente.
- O primeiro perfil é selecionado. A conta pode ter até cinco e não pode remover o último.
- Excluir o selecionado ativa o perfil restante de menor ID. Seleção é persistida por conta e compartilhada entre dispositivos.
- Escritas usam a transação da identidade e o lock do usuário pai, serializando criação/edição/exclusão/seleção. A constraint de nome também protege duplicidade no banco.
- Campos extras, proprietário informado pelo cliente, IDs inválidos, PATCH vazio e avatares desconhecidos retornam 422.
- Conflitos 409: `PROFILE_LIMIT`, `PROFILE_NAME_CONFLICT`, `PROFILE_LAST_REQUIRED`.
- Perfis de visualização não são contas, dependentes ou participantes de assinatura. Selecionar perfil não altera o usuário autenticado nem concede acesso a vídeos.
- `kids` é uma preferência de apresentação. Não implementa classificação indicativa, PIN ou proteção parental; não deve ser apresentado como bloqueio de conteúdo.
- Fotos personalizadas usam o sub-recurso privado `/photo`, implementado separadamente: ver [contrato de fotos](FOTOS-PERFIS-STREAMING-API.md). DTO inclui `photoUrl` ou null. Criação/PATCH continuam aceitando apenas name/avatar/kids, sem base64 ou campo photo do protótipo.
- Favoritos foram implementados no item 4: [contrato](FAVORITOS-STREAMING-API.md). Progresso e histórico foram implementados no item 5: [contrato](PROGRESSO-STREAMING-API.md). O frontend atual continua local até ser integrado.

## Banco e instalação

Migration nova: [20261025_31_streaming_profiles.sql](../database/migrations/20261025_31_streaming_profiles.sql), incluída em [migrationPlan.js](../backend/scripts/migrationPlan.js). Cria `streaming_perfis` sem alterar tabelas anteriores.

Aplicar com o procedimento de migrations descrito em [database/README.md](../database/README.md). O runner exige ledger válido e recusa produção; não remover essas proteções. A migration não foi aplicada a banco remoto neste trabalho. O SQL consolidado `database/cineastra-install.sql` inclui esta tabela e as migrations até a 36. Usar somente em schema vazio; banco existente exige atualização incremental pelo ledger.

## Arquivos

- [Model](../backend/src/models/streamingProfileModel.js)
- [Service](../backend/src/services/streamingProfileService.js)
- [Controller](../backend/src/controllers/streamingProfileController.js)
- [Router](../backend/src/routes/streamingProfileRoutes.js)
- [Validators](../backend/src/validators/streamingProfileValidators.js)
- [Gerador OpenAPI](../backend/scripts/generateStreamingProfileOpenapi.js)
- [Testes](../backend/tests/streamingProfile.test.js)

Os testes de HTTP/service usam persistência simulada e transações serializadas; verificam CRUD, isolamento, conflitos, seleção e rollback. O teste de model confere SQL e inclusão da migration no plano. Isso não substitui execução da migration e concorrência em MySQL real antes da implantação.
