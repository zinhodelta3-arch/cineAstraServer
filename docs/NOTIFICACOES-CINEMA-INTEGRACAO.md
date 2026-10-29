# Integração de /cinema/notificacao

## Implementado

- Lista privada em `GET /api/notifications/me`, com cursor, atualização manual, estados de erro/vazio e nova tentativa.
- Conteúdo real: ID, título, mensagem, tipo, data e indicador de leitura.
- Ação explícita para marcar como lida por `PATCH /api/notifications/me/{id}/read`. Apenas abrir detalhes não altera a leitura.
- A interface só confirma a mudança depois de a API retornar o mesmo ID com lida=true. Erros mantêm o aviso como não lido.
- Sino do header usa a mesma integração e atualiza a leitura confirmada na página, e vice-versa, por evento em memória associado ao usuário.
- A página e o sino são remontados ao trocar o usuário. Não há dados globais de usuário nem persistência em localStorage. Avisos de demonstração antigos não são importados.
- Tipos desconhecidos usam apresentação genérica; datas ausentes/inválidas não geram erro de renderização. Datas válidas são exibidas em Brasília.

## Contagem e ações

A API não retorna total global de não lidas. Os contadores e filtros indicam explicitamente que consideram somente os itens carregados; o sino mostra os avisos mais recentes da primeira página. A lista permite carregar os demais.

Exclusão, restauração, retorno a não lida e ação em lote foram retirados da interface porque não existem no contrato do backend. Não há atualização automática em segundo plano nem sincronização entre abas nesta etapa; use a atualização da página.

## Arquitetura

- `notification-center`, cards/grupos/dialog e `notification-button`: apresentação.
- `use-notifications`: consultas, paginação, confirmação de leitura e sincronização em memória.
- `use-notification-center`: filtros e seleção de detalhes.
- `/api/notifications/[[...path]]`: proxy com cookie HttpOnly, origem validada na escrita, rotas/IDs restritos e sem cache.
- Backend: `notificationRoutes → notificationController → notificationService → notificationModel`.

## Validação e limites

Testes unitários de IDs, mapeamento, datas e tipos desconhecidos. Build concluído e ESLint dos módulos de notificações sem erros. O header possui um erro preexistente de setState no efeito de montagem e um aviso de imagem, fora da integração de avisos; não foram alterados seus controles de tema.

Produção/Coolify não verificados. Nenhuma notificação real foi alterada. Sem mudança no backend, Docker ou YAML.

Teste de navegador com backend isolado concluído: bloqueio sem sessão/origem válida, falha de leitura sem confirmação falsa, sincronização com o sino após sucesso, paginação/filtros/detalhes, layout móvel, troca de conta e logout sem compartilhar avisos.
