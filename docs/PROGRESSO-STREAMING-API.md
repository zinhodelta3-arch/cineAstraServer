# Histórico, progresso e Continuar assistindo

Item 5 implementado no backend. Não altera o player/frontend nem autoriza reprodução; grava apenas informações de retomada enviadas pelo cliente.

## Endpoints

Todos exigem Bearer token de CLIENTE, com perfil próprio explícito na URL.

| Método | Rota | Retorno |
|---|---|---|
| GET | `/api/streaming/profiles/{profileId}/history` | Histórico paginado |
| GET | `/api/streaming/profiles/{profileId}/continue-watching` | Iniciados, não concluídos e ainda disponíveis no catálogo |
| GET | `/api/streaming/profiles/{profileId}/progress/{filmId}` | Último progresso; 404 se ausente |
| PUT | `/api/streaming/profiles/{profileId}/progress/{filmId}` | Grava posição, retorna progresso e nova versão |
| DELETE | `/api/streaming/profiles/{profileId}/progress/{filmId}` | Remove progresso/histórico desse filme; 204 idempotente |

PUT:

```json
{"positionSeconds":120,"expectedVersion":0}
```

Exemplo de `data` no envelope `{success, data, requestId}`:

```json
{
  "filmId":"2",
  "positionSeconds":120,
  "durationSeconds":6000,
  "completed":false,
  "version":1,
  "updatedAt":"2026-10-25T12:00:00.000Z",
  "catalogAvailable":true,
  "title":"Filme"
}
```

## Contrato do player

1. Consultar o progresso do filme no perfil selecionado. Ausência (404) significa primeira gravação com `expectedVersion: 0`.
2. Autorizar reprodução pelos endpoints de streaming já existentes. Ter progresso ou aparecer em Continuar assistindo não substitui compra, assinatura, classificação etária ou URL assinada.
3. Enviar posição inteira em segundos e a versão recebida. Não enviar duração, conclusão, usuário ou timestamps: o servidor define esses campos.
4. Atualizar a versão local após cada resposta. Serializar envios; em `409 PROGRESS_VERSION_CONFLICT`, consultar o progresso atual e decidir como conciliar os dispositivos. Não repetir uma atualização antiga usando automaticamente uma versão nova.
5. Debounce nas atualizações, por exemplo a cada 30 segundos e ao pausar/sair. O fluxo `streamingProgress` tem limite de 120 escritas por janela configurada, por IP e identidade; o limite geral também se aplica. Respeitar 429 e headers de rate limit. Não reutiliza a cota de checkout.
6. O relógio usado na ordenação é o do banco. Não aceitar o horário do dispositivo como ordem de reprodução.

## Regras e limites

- Duração deriva de `filmes.duracao` (minutos), convertida para segundos. Este é o metadado disponível hoje, não a duração exata medida pelo provedor de vídeo. O cadastro precisa estar coerente com o vídeo antes da integração real.
- Posição não pode exceder essa duração. Posição zero é válida; gravar uma posição menor permite reiniciar/retroceder intencionalmente.
- Conclusão calculada a partir de 95% da duração, arredondando o limiar para cima. Voltar para uma posição anterior ao limiar torna o registro não concluído.
- Histórico é um resumo por perfil/filme, não um log de todas as sessões nem prova de visualização efetiva. Não usar como comprovação financeira, de direitos ou parental.
- Histórico inclui registros iniciados em zero e concluídos. Continuar assistindo exclui posição zero, concluídos e filmes fora do catálogo.
- Filmes arquivados/retirados do streaming permanecem no histórico com `catalogAvailable: false` e `title: null`; podem ser removidos. Não podem receber novas gravações enquanto indisponíveis.
- Perfil inexistente/alheio: 404; sem login: 401; papel não CLIENTE: 403; corpo/IDs/paginação inválidos: 422; versão desatualizada: 409; duração cadastral inutilizável: 503.
- Campos extras são rejeitados. IDs permanecem strings. A listagem não retorna URL de vídeo, pedido, credenciais ou dados pessoais.
- DELETE remove posição e histórico do filme; novo início deve consultar o estado novamente. Excluir perfil remove seus registros em cascata.
- Preferência `kids` não é controle parental implementado por este módulo.

## Paginação

Histórico e Continuar assistindo retornam `{profileId, items, pagination: {limit, nextCursor}}`. Padrão 20, máximo 100. Ordenação por última atualização e ID decrescentes.

O cursor é o timestamp UTC com milissegundos seguido de `_` e ID, por exemplo `2026-10-25T12:00:00.000Z_9007199254740993`. Reenviar sem alterações como query `cursor` usando URLSearchParams. `null` indica fim.

A lista é viva, não um snapshot entre requisições: gravações durante a paginação podem mover itens para o início. Para atualizar a tela após gravações, recarregar a primeira página e deduplicar por filmId.

## Instalação e arquivos

[Migration 33](../database/migrations/20261025_33_streaming_progress.sql) cria `streaming_progresso` após a migration de perfis. Inclui unicidade por perfil/filme, constraint de posição, índice de paginação e cascade ao excluir perfil. Está no runner; ainda não foi aplicada ao banco alvo. O snapshot `cineastra-install.sql` inclui as migrations até a 36, para schema vazio. Seguir [database/README.md](../database/README.md).

- [Model](../backend/src/models/streamingProgressModel.js)
- [Service](../backend/src/services/streamingProgressService.js)
- [Controller](../backend/src/controllers/streamingProgressController.js)
- [Router](../backend/src/routes/streamingProgressRoutes.js)
- [Validators](../backend/src/validators/streamingProgressValidators.js)
- [Gerador OpenAPI](../backend/scripts/generateStreamingProgressOpenapi.js)
- [Testes](../backend/tests/streamingProgress.test.js)

As mutações usam o lock do usuário em activeActor, compartilhado com a exclusão de perfis. A versão protege contra atualizações atrasadas do player. Posições não geram evento de auditoria por batimento; a exclusão explícita é auditada. Não são emitidos eventos de compra, tickets ou concessões de acesso.

Validação automatizada cobre HTTP/service com persistência simulada, limites, conclusão, reinício, conflitos, isolamento, SQL e plano de migrations. Execução da migration, constraints e locks em MySQL real ainda precisam ser verificados antes da implantação.
