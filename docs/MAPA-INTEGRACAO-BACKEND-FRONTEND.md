# Mapa de integração backend–frontend

Levantamento do código local em 25/10/2026, incluindo refatorações ainda não commitadas. Não é uma validação do ambiente de produção. Este documento não implementa as integrações.

## Como ler

- **Integrar:** a página existe, mas precisa consumir dados e ações reais.
- **Criar interface:** falta uma tela, aba ou modal. Os caminhos sugeridos abaixo ainda não existem.
- **Ampliar backend:** não foi localizada uma rota que cubra a funcionalidade; não presumir que existe só porque há uma tabela/model.
- Os nomes na coluna **Módulos** apontam para o catálogo ao final, que identifica **model, controller, router e service** reais. Uma página pode consumir vários módulos.
- O frontend chama endpoints HTTP; nunca importa models/controllers do servidor. A cadeia é `page → components → hooks → API → router → controller → service → model → banco`.
- Rotas frontend existentes ficam em `frontend/src/app/<rota>/page.jsx`. `{id}` nas URLs da API é um parâmetro a substituir.

## 1. Páginas existentes: cinema

| Página | O que falta integrar | Módulos | Endpoints principais e limites |
|---|---|---|---|
| `/cinema/home` | Leitura integrada: filmes, banners, experiências, cinemas, sessões e combos. Ainda falta ligar seleção de sessão ao fluxo real de assentos/checkout; implantação depende da URL/CORS e banco. | catalog, session, venue, promotional, combo | Ver [integração da home](HOME-CINEMA-INTEGRACAO.md). Sem dados fictícios como fallback; consulta de sessões por unidade/data. |
| `/cinema/filmes` | Catálogo, filtros, gêneros, detalhes, imagens e disponibilidade real. | catalog, filmGallery, session | `GET /api/films`, `/api/genres`, `/api/films/{id}`, `/api/sessions`. Adaptar filtros aos validators. |
| `/cinema/localizacoes` | Cinemas, salas e seleção por ID real. | venue, session | `GET /api/locations`, `/api/locations/{localId}/rooms`, `/api/sessions`. |
| `/cinema/astrasnack` | Combos reais, imagens, preço cotado e inclusão no pedido. | combo, commerceGallery, pricing, order | `GET /api/combos`; `POST /api/pricing/quote` e `/api/orders/quote`. **`/api/inputs` não é catálogo público:** exige ADMIN/FORNECEDOR. Catálogo avulso implementado no módulo snackCatalog, em `/api/locations/{localId}/snacks` ([contrato](BOMBONIERE-PUBLICA-API.md)). |
| `/cinema/experiencias` | Vincular escolhas a salas/sessões reais quando aplicável. Conteúdo promocional pode continuar estático. | venue, session | `GET /api/locations/{localId}/rooms`, `/api/sessions`. Conteúdo: `GET /api/experiences` (promotional); CRUD ADMIN disponível. Reservas de eventos não são cobertas. |
| `/cinema/planos` | Carregar planos, apresentar resumo contratual, contratar, pagar e mostrar assinatura real. | plan, participation, payment, paymentMethod, content | `GET /api/plans`; `POST /api/subscriptions/summary`, `/api/subscriptions`, `/api/payments`. Convites pertencem a uma assinatura existente. |
| `/cinema/parcerias` | Definir origem dos parceiros/ofertas e validar cupons durante a compra. | pricing; content somente para conteúdo suportado | `POST /api/pricing/quote` ou `/api/orders/quote`. Parceiros: `GET /api/partners` (promotional); não usar listagem administrativa de cupons no cliente. |
| `/cinema/suporte` | Abrir/listar chamados, conversar, acompanhar status e encaminhar conversa do chatbot. FAQ pode continuar local. | support, content (assistant) | `GET/POST /api/support`; `GET/POST /api/support/{id}/messages`; `POST /api/assistant/messages`, `/api/assistant/handoff`. IA depende de provider. |
| `/cinema/perfil` | Ler/salvar usuário, contatos, endereços, preferências e meios de pagamento reais; substituir confirmações demonstrativas. | identity, paymentMethod | `GET/PATCH /api/users/me`; CRUD `/api/users/me/addresses`, `/contacts`, `/payment-methods`; `GET/PATCH /api/users/me/preferences`. Correção: troca de senha autenticada já existe em `PATCH /api/users/me`, com currentPassword/password/passwordConfirmation; [contrato verificado](TROCA-SENHA-API.md). Recuperação/reset é outro fluxo. |
| `/cinema/minhascompras` | Histórico real, detalhes, ingresso, comprovante e reembolso. | order, ticket, content, refund, payment | `GET /api/orders/{orderId}`, `/api/orders/{orderId}/tickets`, `/api/orders/{orderId}/receipt`; `POST /api/payments/{id}/refunds`. Listagem implementada em `GET /api/orders?limit=20&cursor={orderId}`; falta conectar a interface. |
| `/cinema/notificacao` | Substituir armazenamento demonstrativo por notificações e marcação de leitura da API. | notification | Consultar rotas de listagem/leitura em `notificationRoutes.js`; manter atualização visual após confirmação do servidor. |
| `/cinema/carrinho` | Usar IDs reais, cotar valores/estoque/cupom no servidor e preparar checkout. | order, pricing, combo, session | `POST /api/orders/quote`, `/api/orders/checkout`. Carrinho local pode ser rascunho; não há CRUD de carrinho persistente. |
| `/cinema/pagamento` | Carregar dados de cobrança e métodos tokenizados; criar pedido/pagamento e acompanhar pendência, aprovação ou falha. | identity, order, paymentMethod, payment, content | `POST /api/orders/checkout`, `/api/payments`; `GET /api/payments/{id}`; `POST /api/payments/{id}/reconcile`. Não considerar confirmação visual como pagamento aprovado. |
| `/cinema/sessao/ingressos` | Exibir sessão real, categorias/quantidades permitidas, cotação e continuidade para seleção de assentos. | session, catalog, venue, pricing, order | `GET /api/sessions/{id}`; `POST /api/pricing/quote`, `/api/orders/quote`. IDs e regras devem vir do servidor. |
| `/cinema/sessao/assentos` | Carregar mapa real, acessibilidade, seleção vinculada à sessão e tratar conflito/expiração no checkout. | venue, session, order; seatOccupancy interno | `GET /api/locations/{localId}/rooms/{roomId}/seats`; checkout pelo módulo order. **Disponibilidade implementada:** `GET /api/sessions/{id}/seats` retorna mapa e ocupação da sessão. Reserva continua interna ao checkout; falta integrar a página. |
| `/cinema/ingressos` | Manter redirecionamento para a rota organizada em `sessao`; sem integração própria. | — | Não duplicar seleção/checkout nesta rota antiga. |

## 2. Páginas existentes: autenticação, streaming e admin

| Página | O que falta integrar | Módulos | Endpoints principais e limites |
|---|---|---|---|
| `/auth`, `/auth/login` | Login real, tratamento de erros, sessão e logout; recuperação de senha real. | identity | `POST /api/auth/login`, `/api/auth/logout`, `/api/auth/password/forgot`; `GET /api/users/me`. |
| `/auth/cadastro` | Cadastro com schema real, consentimentos e tratamento das validações. | identity | `POST /api/auth/register` (também existe alias `/api/auth/registrar`). CAPTCHA/2FA estão em standby por decisão anterior; não reativar como parte desta integração. |
| `/streaming/home` | Catálogo/gêneros, acessos adquiridos, autorização e reprodução real; definir persistência de Minha lista. | catalog, filmGallery, streaming, plan | `GET /api/films`, `/api/streaming/my-accesses`; `POST /api/streaming/{accessId}/play` ou `/api/streaming/films/{filmId}/play`. Favoritos implementados no módulo streamingFavorite; falta integrar. Histórico/progresso implementados no módulo streamingProgress; recomendações precisam de contrato adicional. |
| `/streaming/perfis` | Substituir perfis locais por CRUD persistente e seleção vinculada ao usuário. | streamingProfile; identity como autenticação | CRUD e seleção implementados em `/api/streaming/profiles` (ver contrato abaixo). Falta aplicar migration e integrar a tela; upload privado de fotos implementado no sub-recurso `/photo`; ver [contrato](FOTOS-PERFIS-STREAMING-API.md). |
| `/streaming/meuperfil` | Persistir avatar/nome do perfil de visualização, favoritos e histórico; unificar vínculo com perfil selecionado. | streamingProfile para perfis, streaming para reprodução; streamingFavorite para Minha lista; streamingProgress para histórico/progresso | `GET /api/streaming/my-accesses` lista direitos de acesso, não histórico de visualização. Dados locais atuais não substituem essas APIs. |
| `/admin/dashboard` | Substituir métricas/gráficos demonstrativos por relatórios; ajustar indicadores ao que a API realmente fornece. | report | `GET /api/admin/reports/dashboard` implementado para vendas/ocupação/tipos/filmes; ver [contrato e limites](DASHBOARD-API.md). Financeiro/caixa permanece em `/api/admin/reports/finance`; alocação social em `/api/admin/reports/social-allocation`. Integração visual pendente. |
| `/admin/tabelaexemplo` | Decidir a entidade real antes de integrar. Hoje é uma demonstração de CRUD/modal. | catalog **se a tabela passar a gerenciar filmes** | Nesse caso: `GET /api/admin/films`, `POST /api/films`, `PATCH/DELETE /api/films/{id}`. Não existe model de “tabelaexemplo”. |
| `/`, `/admin`, `/streaming` | Preservar entrada/redirecionamentos; aplicar sessão/permissão quando a navegação depender do usuário. | identity quando necessário | Não precisam de CRUD próprio. |

## 3. Interfaces que faltam: cliente

Os caminhos desta seção são **sugestões**, não rotas já implementadas. Recursos de conta/compras também podem ser abas ou modais.

| Tela/fluxo sugerido | O que implementar | Módulos e API |
|---|---|---|
| `/cinema/suporte/atendimentos` e `/[id]` | Lista, abertura, mensagens, detalhe e encerramento do chamado. | support: `GET/POST /api/support`, `GET /api/support/{id}`, `GET/POST /api/support/{id}/messages`, `POST /api/support/{id}/close`. |
| Chatbot dentro de suporte | Mensagens, estado indisponível e transferência ao atendimento humano. | content controller/router → assistantService → provider; `POST /api/assistant/messages`, `/api/assistant/handoff`. Não existe assistantModel próprio. |
| `/auth/redefinir-senha` | Receber token, validar nova senha e mostrar resultado/expiração. | identity: `POST /api/auth/password/reset`; ligar à solicitação `/api/auth/password/forgot`. |
| `/cinema/assinatura` | Resumo, benefícios, cobrança, renovação conforme contrato e cancelamento. | plan, participation, refund: `GET /api/subscriptions/me`, `/api/subscriptions/{subscriptionId}`; `POST /api/subscriptions/{subscriptionId}/benefits/combo/redeem`, `/api/subscriptions/{id}/cancel`. |
| Participantes/convites da assinatura | Convidar, aceitar/recusar, sair, suspender/retomar, propor divisão e consentir. | participation: `/api/subscriptions/{subscriptionId}/participants`, `/invitations`, `/division-proposals`; `/api/subscription-invitations/me`. Métodos no router. |
| Cobranças da assinatura | Ver cobranças próprias e previsão do próximo ciclo; efetuar pagamento da cobrança. | participation, payment: `GET /api/subscriptions/{subscriptionId}/charges`, `/next-cycle`; `POST /api/payments` com `chargeId`. |
| Configurações de conta/privacidade | Gerir endereços/contatos, exportar dados, solicitar exclusão. | identity: CRUD de addresses/contacts; `POST /api/users/me/export`, `DELETE /api/users/me`. |
| Controle parental | Configurar restrições/autorização de menores vinculados. | identity: `GET/PATCH /api/users/me/children/{id}/controls`; `POST /api/users/me/children/{id}/authorizations`. Listagem implementada: `GET /api/users/me/children` ([contrato](DEPENDENTES-API.md)); vínculo continua sujeito à comprovação/revisão do fluxo de identidade. |
| Resultado de pagamento e reembolso | Exibir pendência/sucesso/falha e acompanhar solicitação. Pode entrar em compras/pagamento. | payment, refund: `GET /api/payments/{id}`, `/api/refunds/{id}`; reconciliação pelos respectivos routers. |
| Biblioteca/player de streaming | Mostrar acessos válidos e reproduzir URL/autorização do servidor. Pode ser integrado à home. | streaming: `GET /api/streaming/my-accesses`; dois endpoints POST de play. Provider de vídeo necessário. |
| Newsletter: confirmar/preferências/descadastrar | Consumir token dos links e permitir gestão da inscrição. | newsletter: `POST /api/newsletter/confirm`, `/preferences/view`, `/unsubscribe`, `/resubscribe`; `PATCH /api/newsletter/preferences`. Incluir autorização quando aplicável. |
| Termos, privacidade e dados institucionais | Exibir versões publicadas; apresentar conteúdo contratual antes do aceite. | content: `GET /api/content/{slug}`. O serviço de contrato depende de `business`, `terms` e `privacy`. |

## 4. Interfaces que faltam: administração

Os caminhos são propostas de organização. Respeitar ADMIN e demais escopos definidos pelos routers/services; esconder menu não substitui autorização.

| Página sugerida | Funcionalidades pendentes | Módulos e contratos principais |
|---|---|---|
| `/admin/suporte` | Fila, detalhe, mensagens, atribuição, atendimento ao vivo e resolução. | support: `GET /api/admin/support`; POST `/{id}/assign`, `/live/start`, `/live/end`, `/resolve`; mensagens no caminho compartilhado `/api/support/{id}/messages`. |
| `/admin/filmes` e gêneros | Listar/criar/editar/arquivar e associar gêneros; editar galeria. | catalog, filmGallery, imageUpload. GET administrativo em `/api/admin/films` e `/genres`; escrita em `/api/films` e `/api/genres`, conforme router. |
| `/admin/cinemas` | Unidades, salas e mapa físico de assentos. | venue: CRUD `/api/admin/locations`, sub-recursos rooms/seats. |
| `/admin/sessoes` | Programação, edição e cancelamento de sessões. | session: CRUD `/api/admin/sessions`. |
| `/admin/combos` | Cadastro, composição, preço e imagens. | combo, commerceGallery, imageUpload, pricing: `/api/admin/combos`, `PUT /api/admin/combos/{id}/items`. Listagem completa implementada em `GET /api/admin/combos`, com filtros por nome, unidade e ativo/arquivado ([contrato](ADMIN-CATALOGO-API.md)). |
| `/admin/insumos` e `/admin/equipamentos` | Cadastro e galerias de insumos/equipamentos. | product, commerceGallery, imageUpload: CRUD `/api/inputs`, `/api/equipment`; acesso autenticado ADMIN/FORNECEDOR. |
| `/admin/precos` | Custos, parâmetros, simulação e publicação de preços. | pricing: `/api/admin/pricing/parameters`, `/costs/{kind}/{id}`, `/quote`, `/publish/{category}/{id}`. |
| `/admin/promocoes` e `/admin/cupons` | Criar/editar/arquivar campanhas de desconto e cupons. | pricing: `/api/admin/pricing/promotions`, `/api/admin/pricing/coupons`. |
| `/admin/planos` | CRUD de planos e configuração de benefícios. | plan, pricing: `/api/admin/plans`; `/api/admin/pricing/plans/{planId}/benefits`. |
| `/admin/usuarios` | Criar, consultar por ID e alterar acesso. | identity: `POST /api/admin/users`, `GET /api/admin/users/{id}`, `PATCH /api/admin/users/{id}/access`. Listagem/pesquisa implementada: `GET /api/admin/users` (adminDirectory); falta integrar a tela. |
| `/admin/privacidade` | Consultar solicitações de privacidade. | identity: `GET /api/admin/privacy-requests/{id}`. Fila implementada: `GET /api/admin/privacy-requests` (adminDirectory); não há ações administrativas de aprovação declaradas nesse router. |
| `/admin/equipes` | Equipes, membros, convites e solicitações de entrada. | team: rotas `/api/teams` e sub-recursos definidos no router. |
| `/admin/fornecedores` | Cadastro e autorização por unidade. | supplier, product: `/api/admin/suppliers`; `/api/admin/suppliers/{supplierId}/locations`. |
| `/admin/estoque` | Saldos, movimentos e alertas. | inventory, supply: `/api/inventory/inputs/{id}`, `/equipment/{id}`, `/movements`, `/alerts`; `GET /api/stock`. |
| `/admin/reposicoes` | Criar/consultar solicitações; aprovar/recusar conforme escopo. | supply: `/api/stock/requests`, POST `/{id}/approve` e `/{id}/refuse`. |
| `/admin/logistica` | Remessas, envio, trânsito, recebimento, devolução e cancelamento. | supply: `/api/logistics` e ações do router. |
| `/admin/reembolsos` | Analisar e decidir solicitação. | refund: `POST /api/admin/refunds/{id}/decision`. Fila e detalhe implementados: `GET /api/admin/refunds` e `GET /api/admin/refunds/{id}`. `GET /api/refunds/{id}` continua CLIENTE. |
| `/admin/newsletter` | Categorias, campanhas, agendamento e cancelamento. | newsletterCampaign; newsletterDelivery no servidor para entrega/webhook. |
| `/admin/conteudos` | Publicar versões oficiais de conteúdo. | content: `POST /api/admin/content`; consultar publicado em `GET /api/content/{slug}`. Editor com rascunhos/histórico completo exigiria ampliar API. |
| `/admin/relatorios` | Financeiro e alocação social por filtros suportados. | report: `GET /api/admin/reports/finance`, `/social-allocation`. Pode complementar dashboard. |
| `/admin/auditoria` | Auditoria e logs HTTP com filtros/paginação. | report: `GET /api/admin/audit-logs`, `/api/admin/http-logs`. |

## 5. Interfaces que faltam: equipe e fornecedor

| Interface sugerida | O que falta | Módulos |
|---|---|---|
| Portaria/check-in | Validar ingresso, consumir entrada, registrar saída/reentrada e consultar presença por sessão. | ticket: `POST /api/tickets/validate`, `/consume`, `/exit`, `/entry`; `GET /api/sessions/{sessionId}/tickets`, `/attendance`. Perfis ADMIN/SUPERVISOR/COLABORADOR. |
| Chamados internos | Lista/detalhe por equipe, atribuir, aceitar, resolver, fechar e consultar histórico. Não confundir com suporte do cliente. | task: `/api/teams/{id}/chamados` e sub-recursos; team para vínculo. Conferir parâmetros exatos no router. |
| Portal do fornecedor | Dados próprios, unidades permitidas, insumos/equipamentos e estoque/logística no escopo autorizado. | supplier, product, inventory, supply: `/api/suppliers/me`, `/api/suppliers/me/locations`; demais operações conforme autorização do service. |

## 6. Lacunas e dependências que impedem uma integração completa

1. **Histórico de compras — backend implementado:** `GET /api/orders` lista os próprios pedidos com paginação por cursor. Retorna `items` (orderId, financialStatus, total, currency, createdAt) e `pagination` (limit, nextCursor). Limite padrão 20, máximo 100; ordenação por ID decrescente, cursor exclusivo e `nextCursor: null` no fim. O proprietário vem da autenticação CLIENTE. Não inclui itens nem tickets: usar os endpoints de detalhe. Falta integrar Minhas compras.
2. **Streaming:** CRUD e seleção persistente de perfis implementados no módulo streamingProfile; ver [contrato e instalação](PERFIS-STREAMING-API.md). Favoritos implementados no módulo streamingFavorite ([contrato](FAVORITOS-STREAMING-API.md)). Progresso/histórico implementados no módulo streamingProgress ([contrato](PROGRESSO-STREAMING-API.md)). Upload privado de fotos implementado ([contrato](FOTOS-PERFIS-STREAMING-API.md)); falta aplicar migration 36 e integrar frontend. Não confundir conta, dependente e perfil de streaming.
3. **Assentos — consulta implementada:** `GET /api/sessions/{id}/seats` público, sem cache, retorna `sessionId`, `roomId`, `locationId` e `seats` (`seatId`, `row`, `number`, `type`, `availability`). Estados: DISPONIVEL, RESERVADO, VENDIDO, INDISPONIVEL. Reservas com expiração menor ou igual ao relógio UTC do banco não bloqueiam a leitura; assentos inativos são indisponíveis. Sessão inexistente ou não pública retorna 404; sala sem assentos retorna lista vazia. A elegibilidade segue os status cadastrais públicos, não autoriza compra. Leitura única, sem escrita e sem dados dos compradores. `seatOccupancyModel/Service` continuam internos ao checkout, que revalida e reserva. Falta integrar a página.
4. **Filas administrativas:** usuários e privacidade têm listagem/pesquisa implementadas no bloco adminDirectory ([contrato](ADMIN-USUARIOS-PRIVACIDADE-API.md)). Reembolsos também têm fila e detalhe administrativos implementados ([contrato](ADMIN-REEMBOLSOS-API.md)). Não montar tabelas consultando IDs arbitrários.
5. **Conteúdo promocional implementado:** parceiros, experiências e banners têm leitura pública de ativos e cadastro/edição/publicação ADMIN no módulo promotional. Ver [contrato](CONTEUDO-PROMOCIONAL-API.md). Migration 35 e integração frontend pendentes; reservas de eventos e recomendações personalizadas não estão incluídas.
6. **Bomboniere — consulta avulsa implementada:** módulo snackCatalog lista/detalha INPUT por unidade sem abrir rotas privadas. Ver [contrato e limite do cadastro](BOMBONIERE-PUBLICA-API.md): `venda_avulsa` separa ingredientes internos de produtos publicados, com padrão false; aplicar a migration 34 e publicar os itens desejados antes da implantação.
7. **Providers:** `app.js` usa por padrão providers indisponíveis de pagamento, streaming, newsletter, identidade e assistente. Conferir injeção/configuração efetiva antes de declarar o fluxo funcional; endpoint existente não significa serviço externo pronto.
8. **Contratos:** `contentService` exige versões publicadas de `business`, `terms`, `privacy` para montar oferta contratual. Ausência pode retornar `CONTENT_UNAVAILABLE`; incluir publicação na preparação do checkout/assinaturas.
9. **Suporte ao vivo:** existem ações start/end e mensagens HTTP; não foi estabelecido aqui um contrato WebSocket/SSE. Planejar atualização por HTTP ou adicionar transporte de tempo real explicitamente.
10. **CAPTCHA/2FA:** preservar flags atuais de standby. Não são requisitos para criar telas agora; ativação futura é uma tarefa separada.

## 7. Padrão para executar cada integração

- Deixar `page.jsx` como entrada, UI em `components/<área>/<página>` e estado/efeitos/requisições em `hooks/<área>/<página>`. Reutilizar cliente HTTP central em vez de duplicar autenticação/erros.
- Usar o contrato em [OpenAPI](../backend/src/docs/openapi.json), os validators do módulo e o router efetivamente montado em [app.js](../backend/src/app.js). Para payloads/roles, conferir também o service; a tabela deste documento não substitui os schemas.
- Enviar `Authorization: Bearer <token>` nas rotas privadas. Tratar 401, 403, validação, conflito e indisponibilidade; evitar tratar falha como sucesso demonstrativo.
- Ler envelope `{ success, data, requestId }` em respostas JSON de sucesso e tratar respostas `204` sem tentar interpretar JSON. Preservar IDs como strings; valores monetários devem seguir o formato exato do contrato.
- Nas operações com `paymentKey`, enviar `Idempotency-Key` válida (8–120 caracteres permitidos no validator). Reutilizar a chave ao repetir a mesma intenção; não gerar nova cobrança a cada retry.
- Cotação e checkout calculam preços/regras no backend. Não confiar no total, desconto, disponibilidade ou status de pagamento calculado no navegador.
- Meios de pagamento exigem integração com provider/tokenização. O cartão demonstrativo não é uma credencial válida; não persistir PAN/CVV no navegador ou no banco da aplicação.
- Para cada página: verificar carga, vazio, erro, permissão, envio pendente, sucesso e atualização após mutação; validar comportamento com IDs reais e banco migrado.
- A existência de migrations em `database/` não prova que foram executadas no ambiente alvo. Preparar banco, dados mínimos e providers antes de testar fluxo completo.

## 8. Catálogo de arquivos do backend

Cada chave abaixo é a referência usada nas tabelas. Models adicionais/transversais podem ser usados indiretamente pelos services; não há relação obrigatória de um model para uma página.

| Módulo | Model | Controller | Router | Service principal |
|---|---|---|---|---|
| identity | [identityModel.js](../backend/src/models/identityModel.js) | [identityController.js](../backend/src/controllers/identityController.js) | [identityRoutes.js](../backend/src/routes/identityRoutes.js) | [identityService.js](../backend/src/services/identityService.js) |
| catalog | [catalogModel.js](../backend/src/models/catalogModel.js) | [catalogController.js](../backend/src/controllers/catalogController.js) | [catalogRoutes.js](../backend/src/routes/catalogRoutes.js) | [catalogService.js](../backend/src/services/catalogService.js) |
| filmGallery | [filmGalleryModel.js](../backend/src/models/filmGalleryModel.js) | [filmGalleryController.js](../backend/src/controllers/filmGalleryController.js) | [filmGalleryRoutes.js](../backend/src/routes/filmGalleryRoutes.js) | [filmGalleryService.js](../backend/src/services/filmGalleryService.js) |
| venue | [venueModel.js](../backend/src/models/venueModel.js) | [venueController.js](../backend/src/controllers/venueController.js) | [venueRoutes.js](../backend/src/routes/venueRoutes.js) | [venueService.js](../backend/src/services/venueService.js) |
| session | [sessionModel.js](../backend/src/models/sessionModel.js) | [sessionController.js](../backend/src/controllers/sessionController.js) | [sessionRoutes.js](../backend/src/routes/sessionRoutes.js) | [sessionService.js](../backend/src/services/sessionService.js) |
| combo | [comboModel.js](../backend/src/models/comboModel.js) | [comboController.js](../backend/src/controllers/comboController.js) | [comboRoutes.js](../backend/src/routes/comboRoutes.js) | [comboService.js](../backend/src/services/comboService.js) |
| commerceGallery | [commerceGalleryModel.js](../backend/src/models/commerceGalleryModel.js) | [commerceGalleryController.js](../backend/src/controllers/commerceGalleryController.js) | [commerceGalleryRoutes.js](../backend/src/routes/commerceGalleryRoutes.js) | [commerceGalleryService.js](../backend/src/services/commerceGalleryService.js) |
| product | [productModel.js](../backend/src/models/productModel.js) | [productController.js](../backend/src/controllers/productController.js) | [productRoutes.js](../backend/src/routes/productRoutes.js) | [productService.js](../backend/src/services/productService.js) |
| pricing | [pricingModel.js](../backend/src/models/pricingModel.js) | [pricingController.js](../backend/src/controllers/pricingController.js) | [pricingRoutes.js](../backend/src/routes/pricingRoutes.js) | [pricingService.js](../backend/src/services/pricingService.js) |
| order | [orderModel.js](../backend/src/models/orderModel.js) | [orderController.js](../backend/src/controllers/orderController.js) | [orderRoutes.js](../backend/src/routes/orderRoutes.js) | [orderService.js](../backend/src/services/orderService.js) |
| paymentMethod | [paymentMethodModel.js](../backend/src/models/paymentMethodModel.js) | [paymentMethodController.js](../backend/src/controllers/paymentMethodController.js) | [paymentMethodRoutes.js](../backend/src/routes/paymentMethodRoutes.js) | [paymentMethodService.js](../backend/src/services/paymentMethodService.js) |
| payment | [paymentModel.js](../backend/src/models/paymentModel.js) | [paymentController.js](../backend/src/controllers/paymentController.js) | [paymentRoutes.js](../backend/src/routes/paymentRoutes.js) | [paymentService.js](../backend/src/services/paymentService.js) |
| refund | [refundModel.js](../backend/src/models/refundModel.js) | [refundController.js](../backend/src/controllers/refundController.js) | [refundRoutes.js](../backend/src/routes/refundRoutes.js) | [refundService.js](../backend/src/services/refundService.js) |
| ticket | [ticketModel.js](../backend/src/models/ticketModel.js) | [ticketController.js](../backend/src/controllers/ticketController.js) | [ticketRoutes.js](../backend/src/routes/ticketRoutes.js) | [ticketService.js](../backend/src/services/ticketService.js) |
| streaming | [streamingModel.js](../backend/src/models/streamingModel.js) | [streamingController.js](../backend/src/controllers/streamingController.js) | [streamingRoutes.js](../backend/src/routes/streamingRoutes.js) | [streamingService.js](../backend/src/services/streamingService.js) |
| plan | [planModel.js](../backend/src/models/planModel.js) | [planController.js](../backend/src/controllers/planController.js) | [planRoutes.js](../backend/src/routes/planRoutes.js) | [planService.js](../backend/src/services/planService.js) |
| participation | [participationModel.js](../backend/src/models/participationModel.js) | [participationController.js](../backend/src/controllers/participationController.js) | [participationRoutes.js](../backend/src/routes/participationRoutes.js) | [participationService.js](../backend/src/services/participationService.js) |
| notification | [notificationModel.js](../backend/src/models/notificationModel.js) | [notificationController.js](../backend/src/controllers/notificationController.js) | [notificationRoutes.js](../backend/src/routes/notificationRoutes.js) | [notificationService.js](../backend/src/services/notificationService.js) |
| support | [supportModel.js](../backend/src/models/supportModel.js) | [supportController.js](../backend/src/controllers/supportController.js) | [supportRoutes.js](../backend/src/routes/supportRoutes.js) | [supportService.js](../backend/src/services/supportService.js) |
| content | [contentModel.js](../backend/src/models/contentModel.js) | [contentController.js](../backend/src/controllers/contentController.js) | [contentRoutes.js](../backend/src/routes/contentRoutes.js) | [contentService.js](../backend/src/services/contentService.js) |
| report | [reportModel.js](../backend/src/models/reportModel.js) | [reportController.js](../backend/src/controllers/reportController.js) | [reportRoutes.js](../backend/src/routes/reportRoutes.js) | [reportService.js](../backend/src/services/reportService.js) |
| team | [teamModel.js](../backend/src/models/teamModel.js) | [teamController.js](../backend/src/controllers/teamController.js) | [teamRoutes.js](../backend/src/routes/teamRoutes.js) | [teamService.js](../backend/src/services/teamService.js) |
| task | [taskModel.js](../backend/src/models/taskModel.js) | [taskController.js](../backend/src/controllers/taskController.js) | [taskRoutes.js](../backend/src/routes/taskRoutes.js) | [taskService.js](../backend/src/services/taskService.js) |
| supplier | [supplierModel.js](../backend/src/models/supplierModel.js) | [supplierController.js](../backend/src/controllers/supplierController.js) | [supplierRoutes.js](../backend/src/routes/supplierRoutes.js) | [supplierService.js](../backend/src/services/supplierService.js) |
| inventory | [inventoryModel.js](../backend/src/models/inventoryModel.js) | [inventoryController.js](../backend/src/controllers/inventoryController.js) | [inventoryRoutes.js](../backend/src/routes/inventoryRoutes.js) | [inventoryService.js](../backend/src/services/inventoryService.js) |
| supply | [supplyModel.js](../backend/src/models/supplyModel.js) | [supplyController.js](../backend/src/controllers/supplyController.js) | [supplyRoutes.js](../backend/src/routes/supplyRoutes.js) | [supplyService.js](../backend/src/services/supplyService.js) |
| newsletter | [newsletterModel.js](../backend/src/models/newsletterModel.js) | [newsletterController.js](../backend/src/controllers/newsletterController.js) | [newsletterRoutes.js](../backend/src/routes/newsletterRoutes.js) | [newsletterService.js](../backend/src/services/newsletterService.js) |
| newsletterCampaign | [newsletterCampaignModel.js](../backend/src/models/newsletterCampaignModel.js) | [newsletterCampaignController.js](../backend/src/controllers/newsletterCampaignController.js) | [newsletterCampaignRoutes.js](../backend/src/routes/newsletterCampaignRoutes.js) | [newsletterCampaignService.js](../backend/src/services/newsletterCampaignService.js) |
| newsletterDelivery | [newsletterDeliveryModel.js](../backend/src/models/newsletterDeliveryModel.js) | [newsletterDeliveryController.js](../backend/src/controllers/newsletterDeliveryController.js) | [newsletterDeliveryRoutes.js](../backend/src/routes/newsletterDeliveryRoutes.js) | [newsletterDeliveryService.js](../backend/src/services/newsletterDeliveryService.js) |
| streamingProfile | [streamingProfileModel.js](../backend/src/models/streamingProfileModel.js) | [streamingProfileController.js](../backend/src/controllers/streamingProfileController.js) | [streamingProfileRoutes.js](../backend/src/routes/streamingProfileRoutes.js) | [streamingProfileService.js](../backend/src/services/streamingProfileService.js) |
| streamingFavorite | [streamingFavoriteModel.js](../backend/src/models/streamingFavoriteModel.js) | [streamingFavoriteController.js](../backend/src/controllers/streamingFavoriteController.js) | [streamingFavoriteRoutes.js](../backend/src/routes/streamingFavoriteRoutes.js) | [streamingFavoriteService.js](../backend/src/services/streamingFavoriteService.js) |
| streamingProgress | [streamingProgressModel.js](../backend/src/models/streamingProgressModel.js) | [streamingProgressController.js](../backend/src/controllers/streamingProgressController.js) | [streamingProgressRoutes.js](../backend/src/routes/streamingProgressRoutes.js) | [streamingProgressService.js](../backend/src/services/streamingProgressService.js) |
| adminDirectory | [adminDirectoryModel.js](../backend/src/models/adminDirectoryModel.js) | [adminDirectoryController.js](../backend/src/controllers/adminDirectoryController.js) | [adminDirectoryRoutes.js](../backend/src/routes/adminDirectoryRoutes.js) | [adminDirectoryService.js](../backend/src/services/adminDirectoryService.js) |
| snackCatalog | [snackCatalogModel.js](../backend/src/models/snackCatalogModel.js) | [snackCatalogController.js](../backend/src/controllers/snackCatalogController.js) | [snackCatalogRoutes.js](../backend/src/routes/snackCatalogRoutes.js) | [snackCatalogService.js](../backend/src/services/snackCatalogService.js) |

### Exceções e dependências importantes

| Recurso | Arquivos reais | Relação com as páginas |
|---|---|---|
| Perfil/privacidade/endereços | [profileService.js](../backend/src/services/profileService.js), [identityModel.js](../backend/src/models/identityModel.js), identityController/Routes acima | O módulo identity contém autenticação e gestão da conta; profileService concentra ações de perfil. |
| Permissões | [accessService.js](../backend/src/services/accessService.js), [userAccessModel.js](../backend/src/models/userAccessModel.js), [authMiddleware.js](../backend/src/middlewares/authMiddleware.js) | Dependência transversal de rotas privadas, sem página/router próprios. |
| Checkout | [checkoutService.js](../backend/src/services/checkoutService.js), orderModel/Controller/Routes acima | Orquestra pedido, estoque, assentos, ingressos e streaming. |
| Ocupação de assentos | [seatOccupancyModel.js](../backend/src/models/seatOccupancyModel.js), [seatOccupancyService.js](../backend/src/services/seatOccupancyService.js) | Escrita interna no checkout, sem seatOccupancyController/Routes próprios. Consulta pública em sessionModel/Service/Controller/Routes (`GET /api/sessions/{id}/seats`). |
| Cobrança de assinaturas | [subscriptionBillingModel.js](../backend/src/models/subscriptionBillingModel.js), [subscriptionBillingService.js](../backend/src/services/subscriptionBillingService.js) | Apoia planos/cobranças; não há router/controller homônimo. |
| Assistente | [assistantService.js](../backend/src/services/assistantService.js), [assistantProvider.js](../backend/src/providers/assistantProvider.js) | Usa contentController/Routes; encaminhamento cria atendimento via supportService/Model. Não existe assistantModel. |
| Upload | [imageUploadController.js](../backend/src/controllers/imageUploadController.js), [imageUploadRoutes.js](../backend/src/routes/imageUploadRoutes.js), [imageUploadService.js](../backend/src/services/imageUploadService.js), [imageStorage.js](../backend/src/models/imageStorage.js) | Upload administrativo/de fornecedor; não há imageUploadModel.js. Galerias usam também [galleryStorage.js](../backend/src/models/galleryStorage.js). |
| Logs e auditoria | [auditModel.js](../backend/src/models/auditModel.js), [logModel.js](../backend/src/models/logModel.js), [logService.js](../backend/src/services/logService.js) | Registro transversal. A consulta administrativa documentada passa por reportController/Service/Model/Routes. |

Webhooks de pagamento/newsletter e rotas de saúde são integrações técnicas: não precisam de uma página dedicada para cada endpoint.

## 9. Ordem sugerida

1. Cliente HTTP, autenticação e permissões.
2. Catálogo, cinemas/salas/sessões e administração desses cadastros.
3. Assentos, cotação, checkout, pagamento e compras; completar endpoints faltantes e providers.
4. Suporte do cliente e administrativo; chatbot com fallback humano.
5. Assinaturas/participantes e streaming; criar domínio de perfis/histórico.
6. Estoque/logística/equipe, newsletter, relatórios e demais operações administrativas.

A execução continua página por página; esta ordem é uma proposta, não autorização para implementar ou publicar mudanças.

## Atualização: autenticação no frontend

Login, sessão HttpOnly, logout e redirecionamento por role implementados; ADMIN vai ao dashboard, CLIENTE/FORNECEDOR/COLABORADOR à home cinema e SUPERVISOR permanece no login. Layout de admin valida acesso. Recuperação/redefinição conectadas às rotas; entrega depende do provider. Cadastro autodeclarado integrado, com idade não verificada e aceite de documentos publicados; ver [contrato](CADASTRO-AUTODECLARADO.md). Ver [contrato de integração](AUTH-FRONTEND-INTEGRACAO.md).
