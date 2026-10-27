# Favoritos de streaming — Minha lista

Item 4 implementado no backend. A tela ainda precisa consumir a API; não houve implantação ou alteração do frontend.

## Endpoints

Todos exigem Bearer token de CLIENTE e perfil pertencente à conta autenticada. O perfil é explícito na URL e não depende da seleção global. IDs de perfil/filme são strings INT UNSIGNED; cursor é string BIGINT UNSIGNED.

| Método | Rota | Retorno |
|---|---|---|
| GET | `/api/streaming/profiles/{profileId}/favorites?limit=20` | Lista paginada |
| PUT | `/api/streaming/profiles/{profileId}/favorites/{filmId}` | 204, sem corpo |
| DELETE | `/api/streaming/profiles/{profileId}/favorites/{filmId}` | 204, sem corpo |

PUT/DELETE aceitam corpo vazio ou `{}`. São idempotentes: repetir uma inclusão não duplica nem muda a ordem; repetir remoção não falha se o perfil próprio ainda existe. Para adicionar novamente após remover, o filme precisa continuar ativo e disponível para streaming.

Exemplo de `data` no envelope `{success, data, requestId}` da listagem:

```json
{
  "profileId": "10",
  "items": [{
    "id": "9007199254740993",
    "filmId": "2",
    "addedAt": "2026-10-25T12:00:00.000Z",
    "catalogAvailable": true,
    "film": {"title": "Filme", "duration": 120, "classification": "12"}
  }],
  "pagination": {"limit": 20, "nextCursor": null}
}
```

- Padrão de 20, máximo 100 por página; ordem decrescente por ID do favorito. Enviar o `nextCursor` como `cursor` na próxima chamada. `null` indica fim.
- Lista vazia é sucesso. IDs devem permanecer strings para evitar perda de precisão.
- `catalogAvailable` indica somente presença no catálogo de streaming, não autorização de reprodução.
- Filme arquivado ou retirado do streaming permanece na lista, com `catalogAvailable: false` e `film: null`. Pode ser removido sem consultar o catálogo.
- Só se adicionam novos favoritos de filmes ativos e disponíveis para streaming. Não depende de compra/assinatura; assistir continua exigindo autorização pelos endpoints de play.
- Não retorna URL de reprodução, dados pessoais, pedidos ou tokens. Para detalhes/imagens públicas de filmes disponíveis, usar os módulos de catálogo/galeria existentes.
- Perfil inexistente ou alheio retorna 404 para todas as operações. Novo filme inexistente/indisponível retorna 404. Sem autenticação: 401; papel diferente de CLIENTE: 403; parâmetros/corpo inválidos: 422.
- Cada perfil possui sua lista, inclusive perfis da mesma conta. As regras de `kids` continuam sendo preferência visual; favoritos não implementam controle parental.

## Persistência e concorrência

[Migration 32](../database/migrations/20261025_32_streaming_favorites.sql) cria `streaming_favoritos`, após a migration 31 de perfis. Há unicidade por perfil/filme, índice de paginação e exclusão em cascata ao remover o perfil. Filmes continuam com arquivamento, sem remoção física automática.

As operações usam a transação de identidade e o lock do usuário pai, compartilhado com a exclusão de perfis. Assim, inclusões concorrentes do mesmo filme e alterações dos perfis são serializadas. A inclusão também bloqueia o filme durante a verificação do catálogo. Auditoria e mutação são confirmadas juntas.

A migration está no plano de [migrationPlan.js](../backend/scripts/migrationPlan.js), mas não foi aplicada no banco alvo. Seguir [database/README.md](../database/README.md). O snapshot `cineastra-install.sql` não contém as migrations 31/32; importar somente esse snapshot não habilita esses recursos.

## Arquivos

- [Model](../backend/src/models/streamingFavoriteModel.js)
- [Service](../backend/src/services/streamingFavoriteService.js)
- [Controller](../backend/src/controllers/streamingFavoriteController.js)
- [Router](../backend/src/routes/streamingFavoriteRoutes.js)
- [Validators](../backend/src/validators/streamingFavoriteValidators.js)
- [Gerador OpenAPI](../backend/scripts/generateStreamingFavoriteOpenapi.js)
- [Testes](../backend/tests/streamingFavorite.test.js)

Os testes cobrem HTTP/service com persistência simulada, concorrência serializada, isolamento, idempotência, paginação, filme indisponível e rollback. Também conferem SQL parametrizado e constraints no plano. Ainda é necessário validar a migration, a cascata e os locks em MySQL real antes da implantação.
