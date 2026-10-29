# Guia exclusivo de integração backend–frontend

Revisão do código em **27/10/2026**. Abrange as **28 páginas existentes**, os headers e as principais interfaces ainda ausentes. Documento de implementação; não confirma implantação, migrations ou providers do Coolify. Não altera regras nem implementa as pendências descritas.

## Como usar

Cada página abaixo aponta os arquivos frontend existentes, os endpoints a consumir e os **models, controllers e routers reais** envolvidos. “Integrado” significa que a chamada foi encontrada no código; não significa que todas as condições de produção foram testadas. Uma página com layout e hook separados ainda pode estar usando dados locais.

Fluxo: `page → components → hook → HTTP → router → controller → service → model → MySQL`.

O frontend não importa models/controllers. Os routers definem métodos, autenticação e validação; os controllers recebem a requisição; os services coordenam as regras; os models acessam o banco. Consulte também o service/validator de mesmo módulo para montar os payloads. A lista por página cobre os módulos de sua funcionalidade; dependências internas transversais estão ao final.

## Endereços, sessão e contrato HTTP

- Backend padrão: `http://backend.cineastra.10.189.87.231.sslip.io/api`. O prefixo `/api` faz parte das rotas reais.
- Catálogo público: `frontend/src/lib/api/public-api.mjs`, configurado por `NEXT_PUBLIC_API_URL`. `resolveApiBase` completa `/api` quando recebe apenas o domínio.
- Autenticação: o navegador chama **o frontend** em `/api/session/login`, `/register`, `/me`, `/logout`, `/forgot` e `/reset`. `frontend/src/app/api/session/[action]/route.js` encaminha ao backend usando `BACKEND_API_URL` ou `NEXT_PUBLIC_API_URL`.
- O cookie de sessão é HttpOnly; o token não está disponível aos hooks. **As demais rotas privadas ainda precisam de handlers específicos no Next ou outro intermediário servidor autorizado**, que leiam o cookie e enviem `Authorization: Bearer`. O handler de sessão atual não é proxy genérico de pedidos/perfil/streaming/admin. Não expor o token no localStorage para resolver isso.
- Leitura pública pelo navegador depende de CORS permitir a origem do frontend. Sessão usa validação própria de origem; `AUTH_PUBLIC_ORIGIN` no frontend pode fixar o endereço público exato. Em HTTP o cookie funciona sem Secure; em HTTPS mantém Secure.
- Backend responde `{ success, data, requestId }`; erros têm `code`, `message` e eventualmente `details`. O intermediário de sessão retorna seu próprio formato resumido. Respostas 204 não têm JSON.
- IDs devem permanecer strings; paginação usa os parâmetros reais do validator. Não assumir total de páginas. Payloads, roles, limites e `Idempotency-Key` devem seguir o router/validator e o [OpenAPI](../backend/src/docs/openapi.json).
- Para cada integração: carregando/vazio/erro, 401/403, 422, conflito 409, envio pendente, sucesso confirmado pelo servidor e atualização após mutação. Não substituir falhas por sucesso de demonstração.

## Índice de páginas

| Página | Situação no código |
|---|---|
| `/auth/login` | Integrado no código |
| `/auth/cadastro` | Integrado no código |
| `/auth/redefinir-senha` | Integrado no código |
| `/cinema/home` | Leitura integrada; compra pendente |
| `/cinema/filmes` | Catálogo, detalhes e consulta de sessões integrados |
| `/cinema/localizacoes` | Consulta de cinemas, salas e sessões integrada |
| `/cinema/astrasnack` | Catálogo por cinema, detalhe e cotação integrados; checkout pendente |
| `/cinema/experiencias` | Conteúdo publicado e solicitação ao suporte integrados |
| `/cinema/planos` | Catálogo e contrato integrados; pagamento e gestão pendentes |
| `/cinema/parcerias` | Publicações integradas; descontos dependem do checkout |
| `/cinema/suporte` | FAQ, chamados e assistente integrados |
| `/cinema/perfil` | Perfil, senha, contatos, endereços e métodos existentes integrados |
| `/cinema/minhascompras` | Histórico, ingressos, contrato e cancelamento pendente integrados |
| `/cinema/notificacao` | Listagem e leitura integradas; sino usa API |
| `/cinema/carrinho` | Cotação AstraSnack integrada; checkout pendente |
| `/cinema/pagamento` | Interface local; integração pendente |
| `/cinema/sessao/ingressos` | Seleção local; integração pendente |
| `/cinema/sessao/assentos` | Mapa local; integração pendente |
| `/streaming/home` | Catálogo local; integração pendente |
| `/streaming/perfis` | Perfis locais; integração pendente |
| `/streaming/meuperfil` | Persistência local; integração pendente |
| `/admin/dashboard` | Gráficos locais; integração pendente |
| `/admin/tabelaexemplo` | CRUD local demonstrativo; entidade ainda não definida |
| `/` | Redirecionamento |
| `/auth` | Redirecionamento |
| `/admin` | Redirecionamento |
| `/streaming` | Redirecionamento |
| `/cinema/ingressos` | Redirecionamento |

## Mapeamento página por página

### `/auth/login`

**Situação:** Integrado no código.

**Página:** [page.jsx](../frontend/src/app/auth/login/page.jsx).

**Componentes de entrada:** [auth-shell.jsx](../frontend/src/components/auth/auth-shell.jsx).

**Hooks existentes:** [use-auth-form.js](../frontend/src/hooks/auth/use-auth-form.js).

| Model | Controller | Router |
|---|---|---|
| [identityModel.js](../backend/src/models/identityModel.js) | [identityController.js](../backend/src/controllers/identityController.js) | [identityRoutes.js](../backend/src/routes/identityRoutes.js) |

**Endpoints para esta página:**

- `POST /api/auth/login`
- `GET /api/users/me`
- `POST /api/auth/password/forgot`

**Integração e pendências:** Login e recuperação conectados ao intermediário Next. ADMIN vai para /admin/dashboard; CLIENTE/FORNECEDOR/COLABORADOR para /cinema/home; SUPERVISOR permanece sem destino próprio. Recuperação depende do provider de e-mail. Não confundir login válido com autorização para todos os recursos.

### `/auth/cadastro`

**Situação:** Integrado no código.

**Página:** [page.jsx](../frontend/src/app/auth/cadastro/page.jsx).

**Componentes de entrada:** [auth-shell.jsx](../frontend/src/components/auth/auth-shell.jsx).

**Hooks existentes:** [use-register-form.js](../frontend/src/hooks/auth/use-register-form.js).

| Model | Controller | Router |
|---|---|---|
| [identityModel.js](../backend/src/models/identityModel.js) | [identityController.js](../backend/src/controllers/identityController.js) | [identityRoutes.js](../backend/src/routes/identityRoutes.js) |

**Endpoints para esta página:**

- `POST /api/auth/register`

**Integração e pendências:** Cria CLIENTE, aceita os PDFs locais 2.0 no modo de teste e redireciona ao login. CPF exige 11 números, sem cálculo verificador; permanece único. Idade é autodeclarada, não verificada. ALLOW_SELF_DECLARED_AGE e ALLOW_LOCAL_REGISTRATION_DOCUMENTS precisam permitir esse fluxo. Não reativar CAPTCHA/2FA sem uma decisão explícita.

### `/auth/redefinir-senha`

**Situação:** Integrado no código.

**Página:** [page.jsx](../frontend/src/app/auth/redefinir-senha/page.jsx).

**Componentes de entrada:** [reset-password.jsx](../frontend/src/components/auth/reset-password.jsx).

**Hooks existentes:** [use-auth-form.js](../frontend/src/hooks/auth/use-auth-form.js).

| Model | Controller | Router |
|---|---|---|
| [identityModel.js](../backend/src/models/identityModel.js) | [identityController.js](../backend/src/controllers/identityController.js) | [identityRoutes.js](../backend/src/routes/identityRoutes.js) |

**Endpoints para esta página:**

- `POST /api/auth/password/reset`

**Integração e pendências:** Recebe token pela URL e envia nova senha/confirmar. Validar entrega do link pelo provider, expiração e reutilização do token no ambiente publicado.

### `/cinema/home`

**Situação:** Leitura integrada; compra pendente.

**Página:** [page.jsx](../frontend/src/app/cinema/home/page.jsx).

**Componentes de entrada:** [cinema-home.jsx](../frontend/src/components/cinema/home/cinema-home.jsx).

**Hooks existentes:** [use-cinema-home.js](../frontend/src/hooks/cinema/home/use-cinema-home.js), [use-escape-close.js](../frontend/src/hooks/cinema/home/use-escape-close.js), [use-home-cart.js](../frontend/src/hooks/cinema/home/use-home-cart.js), [use-home-combos.js](../frontend/src/hooks/cinema/home/use-home-combos.js), [use-home-content.js](../frontend/src/hooks/cinema/home/use-home-content.js), [use-home-experience.js](../frontend/src/hooks/cinema/home/use-home-experience.js), [use-home-hero.js](../frontend/src/hooks/cinema/home/use-home-hero.js), [use-home-sessions.js](../frontend/src/hooks/cinema/home/use-home-sessions.js), [use-image-fallback.js](../frontend/src/hooks/cinema/home/use-image-fallback.js), [use-movie-carousel.js](../frontend/src/hooks/cinema/home/use-movie-carousel.js), [use-public-list.js](../frontend/src/hooks/cinema/home/use-public-list.js), [use-ticket-booking.js](../frontend/src/hooks/cinema/home/use-ticket-booking.js).

| Model | Controller | Router |
|---|---|---|
| [catalogModel.js](../backend/src/models/catalogModel.js) | [catalogController.js](../backend/src/controllers/catalogController.js) | [catalogRoutes.js](../backend/src/routes/catalogRoutes.js) |
| [promotionalModel.js](../backend/src/models/promotionalModel.js) | [promotionalController.js](../backend/src/controllers/promotionalController.js) | [promotionalRoutes.js](../backend/src/routes/promotionalRoutes.js) |
| [venueModel.js](../backend/src/models/venueModel.js) | [venueController.js](../backend/src/controllers/venueController.js) | [venueRoutes.js](../backend/src/routes/venueRoutes.js) |
| [sessionModel.js](../backend/src/models/sessionModel.js) | [sessionController.js](../backend/src/controllers/sessionController.js) | [sessionRoutes.js](../backend/src/routes/sessionRoutes.js) |
| [comboModel.js](../backend/src/models/comboModel.js) | [comboController.js](../backend/src/controllers/comboController.js) | [comboRoutes.js](../backend/src/routes/comboRoutes.js) |

**Endpoints para esta página:**

- `GET /api/films`
- `GET /api/banners`
- `GET /api/experiences`
- `GET /api/locations`
- `GET /api/locations/{localId}/rooms`
- `GET /api/sessions`
- `GET /api/combos`

**Integração e pendências:** Filmes: cinema=true, limite 20, paginação por cursor; separação Em cartaz/Em breve pela data. Banners: placement=cinema-home. Sessões exigem localId/date; combos exigem localId. Falta transportar IDs reais da sessão/itens ao fluxo de assentos e compra; o carrinho local não confirma estoque, reserva ou pagamento.

### `/cinema/filmes`

**Situação:** Catálogo, detalhes e consulta de sessões integrados.

**Página:** [page.jsx](../frontend/src/app/cinema/filmes/page.jsx).

**Componentes de entrada:** [cinema-movies.jsx](../frontend/src/components/cinema/filmes/cinema-movies.jsx).

**Hooks existentes:** [use-cinema-movies.js](../frontend/src/hooks/cinema/filmes/use-cinema-movies.js), [use-movie-poster.js](../frontend/src/hooks/cinema/filmes/use-movie-poster.js).

| Model | Controller | Router |
|---|---|---|
| [catalogModel.js](../backend/src/models/catalogModel.js) | [catalogController.js](../backend/src/controllers/catalogController.js) | [catalogRoutes.js](../backend/src/routes/catalogRoutes.js) |
| [filmGalleryModel.js](../backend/src/models/filmGalleryModel.js) | [filmGalleryController.js](../backend/src/controllers/filmGalleryController.js) | [filmGalleryRoutes.js](../backend/src/routes/filmGalleryRoutes.js) |
| [sessionModel.js](../backend/src/models/sessionModel.js) | [sessionController.js](../backend/src/controllers/sessionController.js) | [sessionRoutes.js](../backend/src/routes/sessionRoutes.js) |
| [venueModel.js](../backend/src/models/venueModel.js) | [venueController.js](../backend/src/controllers/venueController.js) | [venueRoutes.js](../backend/src/routes/venueRoutes.js) |

**Endpoints para esta página:**

- `GET /api/films`
- `GET /api/genres`
- `GET /api/films/{id}`
- `GET /api/films/{id}/images`
- `GET /api/sessions`

**Integração e pendências:** Catálogo público com busca por título e gênero no servidor, paginação, detalhes/galeria e consulta de sessões por cinema/data. Em cartaz e Em breve usam a data de lançamento; não há pré-venda no contrato. Cinema é escolhido na consulta de sessões, não como filtro fictício do catálogo. Falta ligar sessão ao checkout real; ver FILMES-CINEMA-INTEGRACAO.md.

### `/cinema/localizacoes`

**Situação:** Consulta de cinemas, salas e sessões integrada.

**Página:** [page.jsx](../frontend/src/app/cinema/localizacoes/page.jsx).

**Componentes de entrada:** [cinema-locations.jsx](../frontend/src/components/cinema/localizacoes/cinema-locations.jsx).

**Hooks existentes:** [use-cinema-locations.js](../frontend/src/hooks/cinema/localizacoes/use-cinema-locations.js), [use-location-image.js](../frontend/src/hooks/cinema/localizacoes/use-location-image.js), [use-location-panel.js](../frontend/src/hooks/cinema/localizacoes/use-location-panel.js), [use-session-timetable.js](../frontend/src/hooks/cinema/localizacoes/use-session-timetable.js).

| Model | Controller | Router |
|---|---|---|
| [venueModel.js](../backend/src/models/venueModel.js) | [venueController.js](../backend/src/controllers/venueController.js) | [venueRoutes.js](../backend/src/routes/venueRoutes.js) |
| [sessionModel.js](../backend/src/models/sessionModel.js) | [sessionController.js](../backend/src/controllers/sessionController.js) | [sessionRoutes.js](../backend/src/routes/sessionRoutes.js) |
| [catalogModel.js](../backend/src/models/catalogModel.js) | [catalogController.js](../backend/src/controllers/catalogController.js) | [catalogRoutes.js](../backend/src/routes/catalogRoutes.js) |

**Endpoints para esta página:**

- `GET /api/locations`
- `GET /api/locations/{localId}/rooms`
- `GET /api/sessions`

**Integração e pendências:** Lista e detalhe de cinemas, endereço, salas e programação por data conectados à API. Pesquisa na parte carregada, paginação e erros com retentativa. Horários em UTC, sem dados fictícios de abertura/fotos/comodidades. Compra permanece para a etapa de checkout. Ver LOCALIZACOES-CINEMA-INTEGRACAO.md.

### `/cinema/astrasnack`

**Situação:** Catálogo por cinema, detalhe e cotação integrados; checkout pendente.

**Página:** [page.jsx](../frontend/src/app/cinema/astrasnack/page.jsx).

**Componentes de entrada:** [astra-snack.jsx](../frontend/src/components/cinema/astrasnack/astra-snack.jsx).

**Hooks existentes:** [use-astra-snack.js](../frontend/src/hooks/cinema/astrasnack/use-astra-snack.js), [use-snack-banner.js](../frontend/src/hooks/cinema/astrasnack/use-snack-banner.js).

| Model | Controller | Router |
|---|---|---|
| [snackCatalogModel.js](../backend/src/models/snackCatalogModel.js) | [snackCatalogController.js](../backend/src/controllers/snackCatalogController.js) | [snackCatalogRoutes.js](../backend/src/routes/snackCatalogRoutes.js) |
| [comboModel.js](../backend/src/models/comboModel.js) | [comboController.js](../backend/src/controllers/comboController.js) | [comboRoutes.js](../backend/src/routes/comboRoutes.js) |
| [commerceGalleryModel.js](../backend/src/models/commerceGalleryModel.js) | [commerceGalleryController.js](../backend/src/controllers/commerceGalleryController.js) | [commerceGalleryRoutes.js](../backend/src/routes/commerceGalleryRoutes.js) |
| [pricingModel.js](../backend/src/models/pricingModel.js) | [pricingController.js](../backend/src/controllers/pricingController.js) | [pricingRoutes.js](../backend/src/routes/pricingRoutes.js) |
| [orderModel.js](../backend/src/models/orderModel.js) | [orderController.js](../backend/src/controllers/orderController.js) | [orderRoutes.js](../backend/src/routes/orderRoutes.js) |
| [venueModel.js](../backend/src/models/venueModel.js) | [venueController.js](../backend/src/controllers/venueController.js) | [venueRoutes.js](../backend/src/routes/venueRoutes.js) |

**Endpoints para esta página:**

- `GET /api/locations/{localId}/snacks`
- `GET /api/combos`
- `POST /api/pricing/quote`
- `POST /api/orders/quote`
- `POST /api/orders/checkout`

**Integração e pendências:** Produtos avulsos/combos, composição, galerias, paginação, busca e cotação autenticada conectados. POST /api/snacks/quote no Next usa cookie HttpOnly e retorna somente resumo do preço. O carrinho preserva IDs reais e continua local; reserva/pagamento dependem do checkout posterior. Ver ASTRASNACK-INTEGRACAO.md.

### `/cinema/experiencias`

**Situação:** Conteúdo publicado e solicitação ao suporte integrados.

**Página:** [page.jsx](../frontend/src/app/cinema/experiencias/page.jsx).

**Componentes de entrada:** [cinema-experiences.jsx](../frontend/src/components/cinema/experiencias/cinema-experiences.jsx).

**Hooks existentes:** [use-cinema-experiences.js](../frontend/src/hooks/cinema/experiencias/use-cinema-experiences.js).

| Model | Controller | Router |
|---|---|---|
| [promotionalModel.js](../backend/src/models/promotionalModel.js) | [promotionalController.js](../backend/src/controllers/promotionalController.js) | [promotionalRoutes.js](../backend/src/routes/promotionalRoutes.js) |
| [venueModel.js](../backend/src/models/venueModel.js) | [venueController.js](../backend/src/controllers/venueController.js) | [venueRoutes.js](../backend/src/routes/venueRoutes.js) |
| [sessionModel.js](../backend/src/models/sessionModel.js) | [sessionController.js](../backend/src/controllers/sessionController.js) | [sessionRoutes.js](../backend/src/routes/sessionRoutes.js) |

**Endpoints para esta página:**

- `GET /api/experiences`
- `GET /api/locations/{localId}/rooms`
- `GET /api/sessions`

**Integração e pendências:** Lista/detalhe de experiências publicados na API, com paginação e links seguros. Formulário cria chamado real via POST /api/experiences/inquiry no Next → POST /api/support para CLIENTE; não cria reserva de evento. Módulos adicionais usados: identity para sessão/role e support para solicitação. Acompanhamento geral de suporte e vínculo estruturado com reservas permanecem fora desta página. Ver EXPERIENCIAS-CINEMA-INTEGRACAO.md.

### `/cinema/planos`

**Situação:** Catálogo público, resumo/aceite, criação do contrato e consulta de assinaturas integrados. Pagamento e gestão pendentes.

**Página:** [page.jsx](../frontend/src/app/cinema/planos/page.jsx).

**Componentes de entrada:** [cinema-plans.jsx](../frontend/src/components/cinema/planos/cinema-plans.jsx).

**Hooks existentes:** [use-cinema-plans.js](../frontend/src/hooks/cinema/planos/use-cinema-plans.js).

| Model | Controller | Router |
|---|---|---|
| [planModel.js](../backend/src/models/planModel.js) | [planController.js](../backend/src/controllers/planController.js) | [planRoutes.js](../backend/src/routes/planRoutes.js) |
| [participationModel.js](../backend/src/models/participationModel.js) | [participationController.js](../backend/src/controllers/participationController.js) | [participationRoutes.js](../backend/src/routes/participationRoutes.js) |
| [contentModel.js](../backend/src/models/contentModel.js) | [contentController.js](../backend/src/controllers/contentController.js) | [contentRoutes.js](../backend/src/routes/contentRoutes.js) |
| [paymentModel.js](../backend/src/models/paymentModel.js) | [paymentController.js](../backend/src/controllers/paymentController.js) | [paymentRoutes.js](../backend/src/routes/paymentRoutes.js) |
| [paymentMethodModel.js](../backend/src/models/paymentMethodModel.js) | [paymentMethodController.js](../backend/src/controllers/paymentMethodController.js) | [paymentMethodRoutes.js](../backend/src/routes/paymentMethodRoutes.js) |
| [refundModel.js](../backend/src/models/refundModel.js) | [refundController.js](../backend/src/controllers/refundController.js) | [refundRoutes.js](../backend/src/routes/refundRoutes.js) |

**Endpoints para esta página:**

- `GET /api/plans`
- `POST /api/subscriptions/summary`
- `POST /api/subscriptions`
- `GET /api/subscriptions/me`
- `POST /api/payments`
- `POST /api/subscriptions/{id}/cancel`

**Integração e pendências:** Catálogo e condições vêm da API; contratação exige resumo oficial e aceite, com chave de idempotência. A interface exibe o estado real, sem ativar benefícios pelo clique. Pagamento, participantes, divisão igual, cancelamento e resgate de benefícios permanecem pendentes. Veja [PLANOS-CINEMA-INTEGRACAO.md](PLANOS-CINEMA-INTEGRACAO.md).

### `/cinema/parcerias`

**Situação:** Publicações integradas à API, com paginação e filtros por categoria carregada.

**Página:** [page.jsx](../frontend/src/app/cinema/parcerias/page.jsx).

**Componentes de entrada:** [cinema-partnerships.jsx](../frontend/src/components/cinema/parcerias/cinema-partnerships.jsx).

**Hooks existentes:** [use-cinema-partnerships.js](../frontend/src/hooks/cinema/parcerias/use-cinema-partnerships.js).

| Model | Controller | Router |
|---|---|---|
| [promotionalModel.js](../backend/src/models/promotionalModel.js) | [promotionalController.js](../backend/src/controllers/promotionalController.js) | [promotionalRoutes.js](../backend/src/routes/promotionalRoutes.js) |
| [pricingModel.js](../backend/src/models/pricingModel.js) | [pricingController.js](../backend/src/controllers/pricingController.js) | [pricingRoutes.js](../backend/src/routes/pricingRoutes.js) |

**Endpoints para esta página:**

- `GET /api/partners`
- `POST /api/pricing/quote`

**Integração e pendências:** Título, resumo, condições, imagens e links vêm de partners. Os cupons simulados não são renderizados; a API pública não fornece códigos nem percentuais. A aplicação de cupons deve ser validada na cotação do checkout. Veja [PARCERIAS-CINEMA-INTEGRACAO.md](PARCERIAS-CINEMA-INTEGRACAO.md).

### `/cinema/suporte`

**Situação:** FAQ publicado, chamados assíncronos e assistente integrados.

**Página:** [page.jsx](../frontend/src/app/cinema/suporte/page.jsx).

**Componentes de entrada:** [support-center.jsx](../frontend/src/components/support/support-center.jsx).

**Hooks existentes:** [use-support-center.js](../frontend/src/hooks/cinema/suporte/use-support-center.js).

| Model | Controller | Router |
|---|---|---|
| [supportModel.js](../backend/src/models/supportModel.js) | [supportController.js](../backend/src/controllers/supportController.js) | [supportRoutes.js](../backend/src/routes/supportRoutes.js) |
| [contentModel.js](../backend/src/models/contentModel.js) | [contentController.js](../backend/src/controllers/contentController.js) | [contentRoutes.js](../backend/src/routes/contentRoutes.js) |

**Endpoints para esta página:**

- `GET /api/content/faq`
- `GET /api/support`
- `POST /api/support`
- `GET /api/support/{id}`
- `GET /api/support/{id}/messages`
- `POST /api/support/{id}/messages`
- `POST /api/support/{id}/close`
- `POST /api/assistant/messages`
- `POST /api/assistant/handoff`

**Integração e pendências:** Abertura, listagem, detalhe, histórico paginado, mensagens e encerramento após resolução conectados. Assistente e encaminhamento humano conectados, com indisponibilidade explícita do provider. Atualização manual; LIVE/admin não são expostos. Veja [SUPORTE-CINEMA-INTEGRACAO.md](SUPORTE-CINEMA-INTEGRACAO.md).

### `/cinema/perfil`

**Situação:** Perfil, senha, endereços, contatos e métodos de pagamento existentes integrados.

**Página:** [page.jsx](../frontend/src/app/cinema/perfil/page.jsx).

**Componentes de entrada:** [cinema-profile.jsx](../frontend/src/components/cinema/perfil/cinema-profile.jsx).

**Hooks existentes:** [use-add-card.js](../frontend/src/hooks/cinema/perfil/use-add-card.js), [use-cinema-profile.js](../frontend/src/hooks/cinema/perfil/use-cinema-profile.js), [use-edit-profile.js](../frontend/src/hooks/cinema/perfil/use-edit-profile.js), [use-profile-password.js](../frontend/src/hooks/cinema/perfil/use-profile-password.js), [use-profile-poster.js](../frontend/src/hooks/cinema/perfil/use-profile-poster.js).

| Model | Controller | Router |
|---|---|---|
| [identityModel.js](../backend/src/models/identityModel.js) | [identityController.js](../backend/src/controllers/identityController.js) | [identityRoutes.js](../backend/src/routes/identityRoutes.js) |
| [paymentMethodModel.js](../backend/src/models/paymentMethodModel.js) | [paymentMethodController.js](../backend/src/controllers/paymentMethodController.js) | [paymentMethodRoutes.js](../backend/src/routes/paymentMethodRoutes.js) |

**Endpoints para esta página:**

- `GET /api/users/me`
- `PATCH /api/users/me`
- `GET /api/users/me/addresses`
- `POST /api/users/me/addresses`
- `GET /api/users/me/contacts`
- `GET /api/users/me/preferences`
- `PATCH /api/users/me/preferences`
- `GET /api/users/me/payment-methods`
- `POST /api/users/me/payment-methods`

**Integração e pendências:** Perfil completo, edição de nome/telefone, troca de senha com nova autenticação, CRUD de endereços/contatos e listagem/principal/remoção de métodos conectados. E-mail confirmado, novo cartão tokenizado, preferências e favoritos de streaming ainda dependem de fluxos próprios. Dados de demonstração não são renderizados. Veja [PERFIL-CINEMA-INTEGRACAO.md](PERFIL-CINEMA-INTEGRACAO.md).

### `/cinema/minhascompras`

**Situação:** Histórico paginado, detalhes, ingressos, contrato e cancelamento de pedido pendente integrados.

**Página:** [page.jsx](../frontend/src/app/cinema/minhascompras/page.jsx).

**Componentes de entrada:** [PurchaseHistory.jsx](../frontend/src/components/purchases/PurchaseHistory.jsx).

**Hooks existentes:** [use-order-details.js](../frontend/src/hooks/cinema/minhascompras/use-order-details.js), [use-purchase-history.js](../frontend/src/hooks/cinema/minhascompras/use-purchase-history.js), [use-purchase-poster.js](../frontend/src/hooks/cinema/minhascompras/use-purchase-poster.js).

| Model | Controller | Router |
|---|---|---|
| [orderModel.js](../backend/src/models/orderModel.js) | [orderController.js](../backend/src/controllers/orderController.js) | [orderRoutes.js](../backend/src/routes/orderRoutes.js) |
| [ticketModel.js](../backend/src/models/ticketModel.js) | [ticketController.js](../backend/src/controllers/ticketController.js) | [ticketRoutes.js](../backend/src/routes/ticketRoutes.js) |
| [contentModel.js](../backend/src/models/contentModel.js) | [contentController.js](../backend/src/controllers/contentController.js) | [contentRoutes.js](../backend/src/routes/contentRoutes.js) |
| [refundModel.js](../backend/src/models/refundModel.js) | [refundController.js](../backend/src/controllers/refundController.js) | [refundRoutes.js](../backend/src/routes/refundRoutes.js) |
| [paymentModel.js](../backend/src/models/paymentModel.js) | [paymentController.js](../backend/src/controllers/paymentController.js) | [paymentRoutes.js](../backend/src/routes/paymentRoutes.js) |

**Endpoints para esta página:**

- `GET /api/orders`
- `GET /api/orders/{orderId}`
- `GET /api/orders/{orderId}/tickets`
- `GET /api/orders/{orderId}/receipt`
- `POST /api/orders/{orderId}/cancel`
- `POST /api/payments/{id}/refunds`
- `GET /api/refunds/{id}`

**Integração e pendências:** Pedidos, detalhes operacionais, ingressos e contrato consultam o backend. Download usa dados reais sem valor fiscal. Cancelamento pendente exige confirmação. Reembolso ainda depende de expor o vínculo paymentId/refundId no pedido; os endpoints atuais não o retornam. Veja [COMPRAS-CINEMA-INTEGRACAO.md](COMPRAS-CINEMA-INTEGRACAO.md).

### `/cinema/notificacao`

**Situação:** Listagem paginada e leitura integradas à API, também no sino do header.

**Página:** [page.jsx](../frontend/src/app/cinema/notificacao/page.jsx).

**Componentes de entrada:** [notification-center.jsx](../frontend/src/components/notifications/notification-center.jsx).

**Hooks existentes:** [use-notification-center.js](../frontend/src/hooks/cinema/notificacao/use-notification-center.js), [use-notification-dialog.js](../frontend/src/hooks/cinema/notificacao/use-notification-dialog.js), [use-notifications.js](../frontend/src/hooks/cinema/notificacao/use-notifications.js).

| Model | Controller | Router |
|---|---|---|
| [notificationModel.js](../backend/src/models/notificationModel.js) | [notificationController.js](../backend/src/controllers/notificationController.js) | [notificationRoutes.js](../backend/src/routes/notificationRoutes.js) |

**Endpoints para esta página:**

- `GET /api/notifications/me`
- `PATCH /api/notifications/me/{id}/read`

**Integração e pendências:** Sem localStorage de demonstração; confirmação de leitura depende do backend. Troca de conta isola os avisos e leitura confirmada sincroniza página/header. Contadores limitados aos registros carregados; API não possui total de não lidas, exclusão ou desfazer leitura. Veja [NOTIFICACOES-CINEMA-INTEGRACAO.md](NOTIFICACOES-CINEMA-INTEGRACAO.md).

### `/cinema/carrinho`

**Situação:** Rascunho local com cotação autenticada de produtos AstraSnack integrada.

**Página:** [page.jsx](../frontend/src/app/cinema/carrinho/page.jsx).

**Componentes de entrada:** [cinema-cart.jsx](../frontend/src/components/cinema/carrinho/cinema-cart.jsx).

**Hooks existentes:** [use-cinema-cart.js](../frontend/src/hooks/cinema/carrinho/use-cinema-cart.js).

| Model | Controller | Router |
|---|---|---|
| [orderModel.js](../backend/src/models/orderModel.js) | [orderController.js](../backend/src/controllers/orderController.js) | [orderRoutes.js](../backend/src/routes/orderRoutes.js) |
| [pricingModel.js](../backend/src/models/pricingModel.js) | [pricingController.js](../backend/src/controllers/pricingController.js) | [pricingRoutes.js](../backend/src/routes/pricingRoutes.js) |
| [comboModel.js](../backend/src/models/comboModel.js) | [comboController.js](../backend/src/controllers/comboController.js) | [comboRoutes.js](../backend/src/routes/comboRoutes.js) |
| [sessionModel.js](../backend/src/models/sessionModel.js) | [sessionController.js](../backend/src/controllers/sessionController.js) | [sessionRoutes.js](../backend/src/routes/sessionRoutes.js) |

**Endpoints para esta página:**

- `POST /api/orders/quote`
- `POST /api/orders/checkout`
- `POST /api/pricing/quote`

**Integração e pendências:** Cotação usa IDs/quantidades/cinema/cupom, valida estoque no backend e invalida o resultado após alterações. Checkout/aceite e itens de ingresso/streaming permanecem pendentes. Veja [CARRINHO-CINEMA-INTEGRACAO.md](CARRINHO-CINEMA-INTEGRACAO.md).

### `/cinema/pagamento`

**Situação:** Interface local; integração pendente.

**Página:** [page.jsx](../frontend/src/app/cinema/pagamento/page.jsx).

**Componentes de entrada:** [cinema-payment.jsx](../frontend/src/components/cinema/pagamento/cinema-payment.jsx).

**Hooks existentes:** [use-payment.js](../frontend/src/hooks/cinema/pagamento/use-payment.js).

| Model | Controller | Router |
|---|---|---|
| [identityModel.js](../backend/src/models/identityModel.js) | [identityController.js](../backend/src/controllers/identityController.js) | [identityRoutes.js](../backend/src/routes/identityRoutes.js) |
| [orderModel.js](../backend/src/models/orderModel.js) | [orderController.js](../backend/src/controllers/orderController.js) | [orderRoutes.js](../backend/src/routes/orderRoutes.js) |
| [paymentMethodModel.js](../backend/src/models/paymentMethodModel.js) | [paymentMethodController.js](../backend/src/controllers/paymentMethodController.js) | [paymentMethodRoutes.js](../backend/src/routes/paymentMethodRoutes.js) |
| [paymentModel.js](../backend/src/models/paymentModel.js) | [paymentController.js](../backend/src/controllers/paymentController.js) | [paymentRoutes.js](../backend/src/routes/paymentRoutes.js) |
| [contentModel.js](../backend/src/models/contentModel.js) | [contentController.js](../backend/src/controllers/contentController.js) | [contentRoutes.js](../backend/src/routes/contentRoutes.js) |

**Endpoints para esta página:**

- `GET /api/users/me`
- `GET /api/users/me/addresses`
- `GET /api/users/me/payment-methods`
- `POST /api/orders/checkout`
- `POST /api/payments`
- `GET /api/payments/{id}`
- `POST /api/payments/{id}/reconcile`

**Integração e pendências:** Substituir dados/cartões locais, obter pedido do checkout e pagar usando o contrato real. Confirmar aprovação pelo servidor e reconciliar quando necessário. Implementar idempotência conforme validators, estado pendente/erro e recibo; nunca tratar clique como pagamento aprovado.

### `/cinema/sessao/ingressos`

**Situação:** Seleção local; integração pendente.

**Página:** [page.jsx](../frontend/src/app/cinema/sessao/ingressos/page.jsx).

**Componentes de entrada:** [cinema-tickets.jsx](../frontend/src/components/checkout/cinema-tickets.jsx).

**Hooks existentes:** [use-seat-map.js](../frontend/src/hooks/cinema/sessao/use-seat-map.js), [use-seat-selection.js](../frontend/src/hooks/cinema/sessao/use-seat-selection.js), [use-ticket-checkout.js](../frontend/src/hooks/cinema/sessao/use-ticket-checkout.js), [use-ticket-selection.js](../frontend/src/hooks/cinema/sessao/use-ticket-selection.js).

| Model | Controller | Router |
|---|---|---|
| [sessionModel.js](../backend/src/models/sessionModel.js) | [sessionController.js](../backend/src/controllers/sessionController.js) | [sessionRoutes.js](../backend/src/routes/sessionRoutes.js) |
| [catalogModel.js](../backend/src/models/catalogModel.js) | [catalogController.js](../backend/src/controllers/catalogController.js) | [catalogRoutes.js](../backend/src/routes/catalogRoutes.js) |
| [venueModel.js](../backend/src/models/venueModel.js) | [venueController.js](../backend/src/controllers/venueController.js) | [venueRoutes.js](../backend/src/routes/venueRoutes.js) |
| [pricingModel.js](../backend/src/models/pricingModel.js) | [pricingController.js](../backend/src/controllers/pricingController.js) | [pricingRoutes.js](../backend/src/routes/pricingRoutes.js) |
| [orderModel.js](../backend/src/models/orderModel.js) | [orderController.js](../backend/src/controllers/orderController.js) | [orderRoutes.js](../backend/src/routes/orderRoutes.js) |

**Endpoints para esta página:**

- `GET /api/sessions/{id}`
- `GET /api/films/{id}`
- `GET /api/locations/{localId}/rooms`
- `POST /api/pricing/quote`
- `POST /api/orders/quote`

**Integração e pendências:** Substituir DEMO_SESSION/TICKET_TYPES por sessão e regras reais; manter sessionId, tipos e quantidades no rascunho. Ligar à seleção de assentos e à cotação sem recalcular preço final apenas no cliente.

### `/cinema/sessao/assentos`

**Situação:** Mapa local; integração pendente.

**Página:** [page.jsx](../frontend/src/app/cinema/sessao/assentos/page.jsx).

**Componentes de entrada:** [seat-selection.jsx](../frontend/src/components/cinema/assentos/seat-selection.jsx).

**Hooks existentes:** [use-seat-map.js](../frontend/src/hooks/cinema/sessao/use-seat-map.js), [use-seat-selection.js](../frontend/src/hooks/cinema/sessao/use-seat-selection.js), [use-ticket-checkout.js](../frontend/src/hooks/cinema/sessao/use-ticket-checkout.js), [use-ticket-selection.js](../frontend/src/hooks/cinema/sessao/use-ticket-selection.js).

| Model | Controller | Router |
|---|---|---|
| [sessionModel.js](../backend/src/models/sessionModel.js) | [sessionController.js](../backend/src/controllers/sessionController.js) | [sessionRoutes.js](../backend/src/routes/sessionRoutes.js) |
| [venueModel.js](../backend/src/models/venueModel.js) | [venueController.js](../backend/src/controllers/venueController.js) | [venueRoutes.js](../backend/src/routes/venueRoutes.js) |
| [orderModel.js](../backend/src/models/orderModel.js) | [orderController.js](../backend/src/controllers/orderController.js) | [orderRoutes.js](../backend/src/routes/orderRoutes.js) |

**Endpoints para esta página:**

- `GET /api/sessions/{id}/seats`
- `GET /api/locations/{localId}/rooms/{roomId}/seats`
- `POST /api/orders/checkout`

**Integração e pendências:** Substituir SEATS/COLUMNS pelo mapa e ocupação da sessão. A lista da sala sozinha não informa disponibilidade por sessão. Não marcar assento como reservado só por seleção local; checkout faz a reserva e exige tratamento de conflito/expiração. seatOccupancyModel/Service são internos, sem router próprio.

### `/streaming/home`

**Situação:** Catálogo local; integração pendente.

**Página:** [page.jsx](../frontend/src/app/streaming/home/page.jsx).

**Componentes de entrada:** [streaming-home.jsx](../frontend/src/components/streaming/home/streaming-home.jsx).

**Hooks existentes:** [use-escape.js](../frontend/src/hooks/streaming/home/use-escape.js), [use-film-art.js](../frontend/src/hooks/streaming/home/use-film-art.js), [use-stream-hero.js](../frontend/src/hooks/streaming/home/use-stream-hero.js), [use-stream-row.js](../frontend/src/hooks/streaming/home/use-stream-row.js), [use-streaming-home.js](../frontend/src/hooks/streaming/home/use-streaming-home.js).

| Model | Controller | Router |
|---|---|---|
| [catalogModel.js](../backend/src/models/catalogModel.js) | [catalogController.js](../backend/src/controllers/catalogController.js) | [catalogRoutes.js](../backend/src/routes/catalogRoutes.js) |
| [filmGalleryModel.js](../backend/src/models/filmGalleryModel.js) | [filmGalleryController.js](../backend/src/controllers/filmGalleryController.js) | [filmGalleryRoutes.js](../backend/src/routes/filmGalleryRoutes.js) |
| [streamingModel.js](../backend/src/models/streamingModel.js) | [streamingController.js](../backend/src/controllers/streamingController.js) | [streamingRoutes.js](../backend/src/routes/streamingRoutes.js) |
| [streamingProfileModel.js](../backend/src/models/streamingProfileModel.js) | [streamingProfileController.js](../backend/src/controllers/streamingProfileController.js) | [streamingProfileRoutes.js](../backend/src/routes/streamingProfileRoutes.js) |
| [streamingFavoriteModel.js](../backend/src/models/streamingFavoriteModel.js) | [streamingFavoriteController.js](../backend/src/controllers/streamingFavoriteController.js) | [streamingFavoriteRoutes.js](../backend/src/routes/streamingFavoriteRoutes.js) |
| [streamingProgressModel.js](../backend/src/models/streamingProgressModel.js) | [streamingProgressController.js](../backend/src/controllers/streamingProgressController.js) | [streamingProgressRoutes.js](../backend/src/routes/streamingProgressRoutes.js) |
| [planModel.js](../backend/src/models/planModel.js) | [planController.js](../backend/src/controllers/planController.js) | [planRoutes.js](../backend/src/routes/planRoutes.js) |

**Endpoints para esta página:**

- `GET /api/films`
- `GET /api/streaming/my-accesses`
- `POST /api/streaming/{accessId}/play`
- `POST /api/streaming/films/{filmId}/play`
- `GET /api/streaming/profiles`
- `GET /api/streaming/profiles/{profileId}/favorites`
- `GET /api/streaming/profiles/{profileId}/continue-watching`

**Integração e pendências:** Consultar catálogo com streaming=true, perfil selecionado e acessos. Minha lista usa favorites; continuar assistindo usa progress. Reprodução exige autorização/provider e não deve expor url_reproducao privada. Recomendações personalizadas não têm contrato específico confirmado.

### `/streaming/perfis`

**Situação:** Perfis locais; integração pendente.

**Página:** [page.jsx](../frontend/src/app/streaming/perfis/page.jsx).

**Componentes de entrada:** [ProfilesClient.jsx](../frontend/src/components/streaming/profiles/ProfilesClient.jsx).

**Hooks existentes:** [use-profile-editor.js](../frontend/src/hooks/streaming/profiles/use-profile-editor.js), [use-streaming-profiles.js](../frontend/src/hooks/streaming/profiles/use-streaming-profiles.js).

| Model | Controller | Router |
|---|---|---|
| [streamingProfileModel.js](../backend/src/models/streamingProfileModel.js) | [streamingProfileController.js](../backend/src/controllers/streamingProfileController.js) | [streamingProfileRoutes.js](../backend/src/routes/streamingProfileRoutes.js) |
| [streamingPhotoModel.js](../backend/src/models/streamingPhotoModel.js) | [streamingPhotoController.js](../backend/src/controllers/streamingPhotoController.js) | [streamingPhotoRoutes.js](../backend/src/routes/streamingPhotoRoutes.js) |

**Endpoints para esta página:**

- `GET /api/streaming/profiles`
- `POST /api/streaming/profiles`
- `PATCH /api/streaming/profiles/{id}`
- `DELETE /api/streaming/profiles/{id}`
- `POST /api/streaming/profiles/{id}/select`
- `PUT /api/streaming/profiles/{id}/photo`
- `GET /api/streaming/profiles/{id}/photo`

**Integração e pendências:** Substituir perfis/localStorage por IDs reais, CRUD e seleção no backend. Foto é recurso privado: respeitar contrato binário/multipart do router e limites; não é um upload público genérico. Essas rotas exigem CLIENTE.

### `/streaming/meuperfil`

**Situação:** Persistência local; integração pendente.

**Página:** [page.jsx](../frontend/src/app/streaming/meuperfil/page.jsx).

**Componentes de entrada:** [streaming-profile.jsx](../frontend/src/components/streaming/meuperfil/streaming-profile.jsx).

**Hooks existentes:** [use-profile-form.js](../frontend/src/hooks/streaming/meuperfil/use-profile-form.js), [use-streaming-profile.js](../frontend/src/hooks/streaming/meuperfil/use-streaming-profile.js).

| Model | Controller | Router |
|---|---|---|
| [streamingProfileModel.js](../backend/src/models/streamingProfileModel.js) | [streamingProfileController.js](../backend/src/controllers/streamingProfileController.js) | [streamingProfileRoutes.js](../backend/src/routes/streamingProfileRoutes.js) |
| [streamingPhotoModel.js](../backend/src/models/streamingPhotoModel.js) | [streamingPhotoController.js](../backend/src/controllers/streamingPhotoController.js) | [streamingPhotoRoutes.js](../backend/src/routes/streamingPhotoRoutes.js) |
| [streamingFavoriteModel.js](../backend/src/models/streamingFavoriteModel.js) | [streamingFavoriteController.js](../backend/src/controllers/streamingFavoriteController.js) | [streamingFavoriteRoutes.js](../backend/src/routes/streamingFavoriteRoutes.js) |
| [streamingProgressModel.js](../backend/src/models/streamingProgressModel.js) | [streamingProgressController.js](../backend/src/controllers/streamingProgressController.js) | [streamingProgressRoutes.js](../backend/src/routes/streamingProgressRoutes.js) |
| [catalogModel.js](../backend/src/models/catalogModel.js) | [catalogController.js](../backend/src/controllers/catalogController.js) | [catalogRoutes.js](../backend/src/routes/catalogRoutes.js) |

**Endpoints para esta página:**

- `GET /api/streaming/profiles`
- `PATCH /api/streaming/profiles/{id}`
- `GET /api/streaming/profiles/{profileId}/favorites`
- `PUT /api/streaming/profiles/{profileId}/favorites/{filmId}`
- `DELETE /api/streaming/profiles/{profileId}/favorites/{filmId}`
- `GET /api/streaming/profiles/{profileId}/history`
- `PUT /api/streaming/profiles/{profileId}/progress/{filmId}`

**Integração e pendências:** Distinguir conta do usuário de perfil de visualização. Persistir edição/foto, favoritos e progresso por profileId. Direitos de acesso não são histórico. Escrita de progresso deve corresponder à reprodução real, não a uma ação simulada.

### `/admin/dashboard`

**Situação:** Gráficos locais; integração pendente.

**Página:** [page.jsx](../frontend/src/app/admin/dashboard/page.jsx).

**Componentes de entrada:** [dashboard.jsx](../frontend/src/components/admin/dashboard/dashboard.jsx).

**Hooks existentes:** [use-dashboard.js](../frontend/src/hooks/use-dashboard.js).

| Model | Controller | Router |
|---|---|---|
| [dashboardModel.js](../backend/src/models/dashboardModel.js) | [dashboardController.js](../backend/src/controllers/dashboardController.js) | [dashboardRoutes.js](../backend/src/routes/dashboardRoutes.js) |
| [reportModel.js](../backend/src/models/reportModel.js) | [reportController.js](../backend/src/controllers/reportController.js) | [reportRoutes.js](../backend/src/routes/reportRoutes.js) |

**Endpoints para esta página:**

- `GET /api/admin/reports/dashboard`
- `GET /api/admin/reports/finance`
- `GET /api/admin/reports/social-allocation`

**Integração e pendências:** Usar dashboardModel/Controller/Routes para os gráficos principais; report é complementar. Enviar filtros suportados e substituir métricas locais; dados financeiros/ocupação são calculados no servidor. Requer ADMIN, inclusive quando o layout já protege a página.

### `/admin/tabelaexemplo`

**Situação:** CRUD local demonstrativo; entidade ainda não definida.

**Página:** [page.jsx](../frontend/src/app/admin/tabelaexemplo/page.jsx).

**Componentes de entrada:** [example-table.jsx](../frontend/src/components/admin/tabelaexemplo/example-table.jsx).

**Hooks existentes:** [use-example-table.js](../frontend/src/hooks/use-example-table.js).

| Model | Controller | Router |
|---|---|---|
| [catalogModel.js](../backend/src/models/catalogModel.js) | [catalogController.js](../backend/src/controllers/catalogController.js) | [catalogRoutes.js](../backend/src/routes/catalogRoutes.js) |
| [filmGalleryModel.js](../backend/src/models/filmGalleryModel.js) | [filmGalleryController.js](../backend/src/controllers/filmGalleryController.js) | [filmGalleryRoutes.js](../backend/src/routes/filmGalleryRoutes.js) |

**Endpoints para esta página:**

- `GET /api/admin/films`
- `POST /api/films`
- `PATCH /api/films/{id}`
- `DELETE /api/films/{id}`

**Integração e pendências:** O mapeamento para catalog é condicional: usar somente se a tabela passar a gerenciar filmes. Não existe tabelaexemploModel/Controller/Routes. Manter modais de criar/editar/remover, trocar arrays locais por API e respeitar semântica real de exclusão/inativação. Não implementar endpoints novos só pelo nome da tela.

### `/`

**Situação:** Redirecionamento.

**Página:** [page.jsx](../frontend/src/app/page.jsx).

**Integração e pendências:** Redireciona para /cinema/home. Sem model/controller/router próprio; a integração pertence à página de destino.

### `/auth`

**Situação:** Redirecionamento.

**Página:** [page.jsx](../frontend/src/app/auth/page.jsx).

**Integração e pendências:** Redireciona para /auth/login. Sem model/controller/router próprio; a integração pertence à página de destino.

### `/admin`

**Situação:** Redirecionamento.

**Página:** [page.jsx](../frontend/src/app/admin/page.jsx).

**Integração e pendências:** Redireciona para /admin/dashboard. Sem model/controller/router próprio; a integração pertence à página de destino.

### `/streaming`

**Situação:** Redirecionamento.

**Página:** [page.jsx](../frontend/src/app/streaming/page.jsx).

**Integração e pendências:** Redireciona para /streaming/perfis. Sem model/controller/router próprio; a integração pertence à página de destino.

### `/cinema/ingressos`

**Situação:** Redirecionamento.

**Página:** [page.jsx](../frontend/src/app/cinema/ingressos/page.jsx).

**Integração e pendências:** Redireciona para /cinema/sessao/ingressos (preserva query string). Sem model/controller/router próprio; a integração pertence à página de destino.

## Headers e componentes compartilhados

| Componente/fluxo | Situação | Arquivos de backend |
|---|---|---|
| Header cinema (`header.jsx`, `header-nav.jsx`) | Integrado: mostra usuário/Entrar/Criar conta/Sair, desktop e celular | `identityModel.js` → `identityController.js` → `identityRoutes.js` |
| Header streaming (`streamming-header.jsx`) | Usa os mesmos controles de sessão e logout | `identityModel.js` → `identityController.js` → `identityRoutes.js` |
| `components/auth/session-controls.jsx` + `hooks/auth/use-session.js` | GET `/api/session/me` e POST `/api/session/logout` no Next; upstream GET `/api/users/me`, POST `/api/auth/logout` | identity; cookie em `lib/auth/session-cookie.mjs` |
| Sino de notificações | A sessão do header está integrada, mas as notificações ainda usam estado local | `notificationModel.js` → `notificationController.js` → `notificationRoutes.js` |
| Carrinho/drawer | Compartilha rascunho local; precisa da cotação e checkout reais | order, pricing, combo, session |
| Player/Minha lista | Deve compartilhar profileId selecionado, acessos, favoritos e progresso | streaming, streamingProfile, streamingFavorite, streamingProgress |

O logout limpa o cookie local mesmo quando a revogação remota falha; nesse caso o backend pode manter a sessão até expirar. Atualização visual não substitui autorização do servidor. A validade atual da sessão acompanha o backend, limitada a 900 segundos no intermediário Next; não existe refresh token neste contrato.

## Interfaces que ainda faltam

Os nomes abaixo são **áreas sugeridas**, não páginas já criadas. Podem ser páginas, abas ou modais. Não criar uma página por tabela do banco; seguir o fluxo de uso. Os módulos citados estão no catálogo de arquivos abaixo.

| Área faltante | O que integrar | Módulos necessários |
|---|---|---|
| Admin: usuários e acessos | Listagem/filtros, detalhes, criação de contas administrativas e alteração de acesso | adminDirectory + identity |
| Admin: catálogo/galerias/gêneros | CRUD de filmes/gêneros, uploads e imagens | catalog + filmGallery + imageUpload |
| Admin: cinemas/salas/assentos/sessões | Cadastros, mapa da sala, programação/cancelamento | venue + session |
| Admin: suporte/chatbot | Fila, atribuição, atendimento ao vivo e resolução; cliente conversa em support | support + content (assistantService/provider) |
| Admin: pedidos/pagamentos/reembolsos/ingressos | Inspecionar/reconciliar operações e validar ingressos conforme permissões | order + payment + refund + ticket + adminDirectory |
| Admin: planos/assinaturas | Planos, assinaturas, benefícios e participantes | plan + participation + refund |
| Admin: fornecedores | Cadastro, acesso e relacionamento com unidades | supplier + identity |
| Admin: produtos/combos/preços/cupons | Insumos/equipamentos, composição de combos, preços e regras | product + combo + pricing + commerceGallery + imageUpload |
| Admin: estoque e logística | Inventário, movimentos, solicitações e remessas | inventory + supply + product |
| Admin: equipes e tarefas | Vínculos, agenda/atribuições e execução | team + task |
| Admin: banners/experiências/parceiros | Publicação e gerenciamento do conteúdo da home e páginas promocionais | promotional |
| Admin: termos/privacidade/institucional | Publicar conteúdo versionado | content |
| Admin: campanhas/newsletter | Inscritos, campanhas, entregas e resultados | newsletter + newsletterCampaign + newsletterDelivery |
| Admin: relatórios adicionais e auditoria | Financeiro, alocação social e consulta administrativa prevista no contrato | report + dashboard |
| Cliente: detalhes/conversa de suporte | Pode ser integrado à página de suporte atual, sem nova rota obrigatória | support + content |
| Cliente: assinatura/convites/cobranças | Ver assinatura, participantes, convite, divisão, próximos ciclos e cancelamento | plan + participation + payment + refund |
| Cliente: resultado do pagamento/reembolso | Acompanhar pendência/aprovação/falha e devolução | payment + refund + order |
| Cliente: privacidade/dependentes | Exportação/exclusão, responsáveis e controles parentais | identity (profileService) |
| Cliente: biblioteca/player | Reproduzir somente acessos autorizados e salvar progresso real | streaming + streamingProfile + streamingProgress |
| Newsletter pública | Inscrição, confirmação e preferências/descadastro por token | newsletter |
| Termos e privacidade publicados | Exibir conteúdo versionado da API; hoje o cadastro de teste usa os PDFs locais | content |
| Supervisor | Navegação e funcionalidades ainda não definidas como interface | Definir escopo/roles antes de mapear; não redirecionar automaticamente ao admin |

## Catálogo completo de módulos HTTP

Referência para implementar as páginas atuais e as áreas faltantes. Os arquivos abaixo existem no código. O router é a fonte de métodos e permissões; o [OpenAPI](../backend/src/docs/openapi.json) fornece os schemas dos corpos/respostas. Services e validators ficam em `backend/src/services` e `backend/src/validators`, respectivamente.

| Módulo | Model/armazenamento | Controller | Router |
|---|---|---|---|
| adminDirectory | [adminDirectoryModel.js](../backend/src/models/adminDirectoryModel.js) | [adminDirectoryController.js](../backend/src/controllers/adminDirectoryController.js) | [adminDirectoryRoutes.js](../backend/src/routes/adminDirectoryRoutes.js) |
| catalog | [catalogModel.js](../backend/src/models/catalogModel.js) | [catalogController.js](../backend/src/controllers/catalogController.js) | [catalogRoutes.js](../backend/src/routes/catalogRoutes.js) |
| combo | [comboModel.js](../backend/src/models/comboModel.js) | [comboController.js](../backend/src/controllers/comboController.js) | [comboRoutes.js](../backend/src/routes/comboRoutes.js) |
| commerceGallery | [commerceGalleryModel.js](../backend/src/models/commerceGalleryModel.js) | [commerceGalleryController.js](../backend/src/controllers/commerceGalleryController.js) | [commerceGalleryRoutes.js](../backend/src/routes/commerceGalleryRoutes.js) |
| content | [contentModel.js](../backend/src/models/contentModel.js) | [contentController.js](../backend/src/controllers/contentController.js) | [contentRoutes.js](../backend/src/routes/contentRoutes.js) |
| dashboard | [dashboardModel.js](../backend/src/models/dashboardModel.js) | [dashboardController.js](../backend/src/controllers/dashboardController.js) | [dashboardRoutes.js](../backend/src/routes/dashboardRoutes.js) |
| filmGallery | [filmGalleryModel.js](../backend/src/models/filmGalleryModel.js) | [filmGalleryController.js](../backend/src/controllers/filmGalleryController.js) | [filmGalleryRoutes.js](../backend/src/routes/filmGalleryRoutes.js) |
| identity | [identityModel.js](../backend/src/models/identityModel.js) | [identityController.js](../backend/src/controllers/identityController.js) | [identityRoutes.js](../backend/src/routes/identityRoutes.js) |
| imageUpload | [imageStorage.js](../backend/src/models/imageStorage.js) | [imageUploadController.js](../backend/src/controllers/imageUploadController.js) | [imageUploadRoutes.js](../backend/src/routes/imageUploadRoutes.js) |
| infrastructure | Sem model de negócio próprio; probes verificam dependências | [healthController.js](../backend/src/controllers/healthController.js) | [infrastructureRoutes.js](../backend/src/routes/infrastructureRoutes.js) |
| inventory | [inventoryModel.js](../backend/src/models/inventoryModel.js) | [inventoryController.js](../backend/src/controllers/inventoryController.js) | [inventoryRoutes.js](../backend/src/routes/inventoryRoutes.js) |
| newsletterCampaign | [newsletterCampaignModel.js](../backend/src/models/newsletterCampaignModel.js) | [newsletterCampaignController.js](../backend/src/controllers/newsletterCampaignController.js) | [newsletterCampaignRoutes.js](../backend/src/routes/newsletterCampaignRoutes.js) |
| newsletterDelivery | [newsletterDeliveryModel.js](../backend/src/models/newsletterDeliveryModel.js) | [newsletterDeliveryController.js](../backend/src/controllers/newsletterDeliveryController.js) | [newsletterDeliveryRoutes.js](../backend/src/routes/newsletterDeliveryRoutes.js) |
| newsletter | [newsletterModel.js](../backend/src/models/newsletterModel.js) | [newsletterController.js](../backend/src/controllers/newsletterController.js) | [newsletterRoutes.js](../backend/src/routes/newsletterRoutes.js) |
| notification | [notificationModel.js](../backend/src/models/notificationModel.js) | [notificationController.js](../backend/src/controllers/notificationController.js) | [notificationRoutes.js](../backend/src/routes/notificationRoutes.js) |
| order | [orderModel.js](../backend/src/models/orderModel.js) | [orderController.js](../backend/src/controllers/orderController.js) | [orderRoutes.js](../backend/src/routes/orderRoutes.js) |
| participation | [participationModel.js](../backend/src/models/participationModel.js) | [participationController.js](../backend/src/controllers/participationController.js) | [participationRoutes.js](../backend/src/routes/participationRoutes.js) |
| paymentMethod | [paymentMethodModel.js](../backend/src/models/paymentMethodModel.js) | [paymentMethodController.js](../backend/src/controllers/paymentMethodController.js) | [paymentMethodRoutes.js](../backend/src/routes/paymentMethodRoutes.js) |
| payment | [paymentModel.js](../backend/src/models/paymentModel.js) | [paymentController.js](../backend/src/controllers/paymentController.js) | [paymentRoutes.js](../backend/src/routes/paymentRoutes.js) |
| plan | [planModel.js](../backend/src/models/planModel.js) | [planController.js](../backend/src/controllers/planController.js) | [planRoutes.js](../backend/src/routes/planRoutes.js) |
| pricing | [pricingModel.js](../backend/src/models/pricingModel.js) | [pricingController.js](../backend/src/controllers/pricingController.js) | [pricingRoutes.js](../backend/src/routes/pricingRoutes.js) |
| product | [productModel.js](../backend/src/models/productModel.js) | [productController.js](../backend/src/controllers/productController.js) | [productRoutes.js](../backend/src/routes/productRoutes.js) |
| promotional | [promotionalModel.js](../backend/src/models/promotionalModel.js) | [promotionalController.js](../backend/src/controllers/promotionalController.js) | [promotionalRoutes.js](../backend/src/routes/promotionalRoutes.js) |
| refund | [refundModel.js](../backend/src/models/refundModel.js) | [refundController.js](../backend/src/controllers/refundController.js) | [refundRoutes.js](../backend/src/routes/refundRoutes.js) |
| report | [reportModel.js](../backend/src/models/reportModel.js) | [reportController.js](../backend/src/controllers/reportController.js) | [reportRoutes.js](../backend/src/routes/reportRoutes.js) |
| session | [sessionModel.js](../backend/src/models/sessionModel.js) | [sessionController.js](../backend/src/controllers/sessionController.js) | [sessionRoutes.js](../backend/src/routes/sessionRoutes.js) |
| snackCatalog | [snackCatalogModel.js](../backend/src/models/snackCatalogModel.js) | [snackCatalogController.js](../backend/src/controllers/snackCatalogController.js) | [snackCatalogRoutes.js](../backend/src/routes/snackCatalogRoutes.js) |
| streamingFavorite | [streamingFavoriteModel.js](../backend/src/models/streamingFavoriteModel.js) | [streamingFavoriteController.js](../backend/src/controllers/streamingFavoriteController.js) | [streamingFavoriteRoutes.js](../backend/src/routes/streamingFavoriteRoutes.js) |
| streamingPhoto | [streamingPhotoModel.js](../backend/src/models/streamingPhotoModel.js) | [streamingPhotoController.js](../backend/src/controllers/streamingPhotoController.js) | [streamingPhotoRoutes.js](../backend/src/routes/streamingPhotoRoutes.js) |
| streamingProfile | [streamingProfileModel.js](../backend/src/models/streamingProfileModel.js) | [streamingProfileController.js](../backend/src/controllers/streamingProfileController.js) | [streamingProfileRoutes.js](../backend/src/routes/streamingProfileRoutes.js) |
| streamingProgress | [streamingProgressModel.js](../backend/src/models/streamingProgressModel.js) | [streamingProgressController.js](../backend/src/controllers/streamingProgressController.js) | [streamingProgressRoutes.js](../backend/src/routes/streamingProgressRoutes.js) |
| streaming | [streamingModel.js](../backend/src/models/streamingModel.js) | [streamingController.js](../backend/src/controllers/streamingController.js) | [streamingRoutes.js](../backend/src/routes/streamingRoutes.js) |
| supplier | [supplierModel.js](../backend/src/models/supplierModel.js) | [supplierController.js](../backend/src/controllers/supplierController.js) | [supplierRoutes.js](../backend/src/routes/supplierRoutes.js) |
| supply | [supplyModel.js](../backend/src/models/supplyModel.js) | [supplyController.js](../backend/src/controllers/supplyController.js) | [supplyRoutes.js](../backend/src/routes/supplyRoutes.js) |
| support | [supportModel.js](../backend/src/models/supportModel.js) | [supportController.js](../backend/src/controllers/supportController.js) | [supportRoutes.js](../backend/src/routes/supportRoutes.js) |
| task | [taskModel.js](../backend/src/models/taskModel.js) | [taskController.js](../backend/src/controllers/taskController.js) | [taskRoutes.js](../backend/src/routes/taskRoutes.js) |
| team | [teamModel.js](../backend/src/models/teamModel.js) | [teamController.js](../backend/src/controllers/teamController.js) | [teamRoutes.js](../backend/src/routes/teamRoutes.js) |
| ticket | [ticketModel.js](../backend/src/models/ticketModel.js) | [ticketController.js](../backend/src/controllers/ticketController.js) | [ticketRoutes.js](../backend/src/routes/ticketRoutes.js) |
| venue | [venueModel.js](../backend/src/models/venueModel.js) | [venueController.js](../backend/src/controllers/venueController.js) | [venueRoutes.js](../backend/src/routes/venueRoutes.js) |

### Dependências internas importantes

Essas dependências são chamadas pelo backend, não pelo navegador. Não precisam de endpoints inventados para serem usadas.

| Arquivo | Papel e integração |
|---|---|
| `services/profileService.js` | Conta, preferências, contatos, endereços e dependentes; exposto por identityController/Routes, com identityModel |
| `models/seatOccupancyModel.js`, `services/seatOccupancyService.js` | Reserva/liberação transacional de assentos dentro de checkout/pagamento; mapa público por sessionRoutes |
| `models/subscriptionBillingModel.js` | Cobrança de assinatura e participação; não é uma API pública independente |
| `models/userAccessModel.js` | Regras internas de acesso do usuário |
| `services/assistantService.js` | Chatbot e transferência; usa provider e support; exposto por contentController/Routes |
| `models/imageStorage.js`, `models/galleryStorage.js` | Armazenamento de imagens; usados pelos módulos de upload e galerias |
| `models/auditModel.js`, `models/logModel.js` | Auditoria/logs transversais; não importar no frontend |

Backend de pagamento, vídeo, e-mail e IA depende de providers reais. A existência de router/controller/model não significa que o provider esteja configurado ou que uma operação financeira tenha sido executada. Webhooks, healthchecks e jobs são integrações técnicas; não exigem uma página para cada endpoint.

## Sequência de implementação

1. Manter auth/header funcionando e criar a ponte autenticada no Next para a página privada escolhida, sem proxy irrestrito.
2. Catálogo, cinemas/salas/sessões: substituir dados locais e manter IDs reais de ponta a ponta.
3. Ingressos → assentos → carrinho → checkout → pagamento → compras/recibo.
4. Perfil, notificações e suporte (cliente/admin), incluindo estados reais de providers.
5. Planos/assinaturas/participantes e perfis/player de streaming.
6. Áreas administrativas restantes, com autorização no backend e auditoria.

A ordem é uma proposta de execução. Este documento não autoriza implementar tudo de uma vez, nem fazer commit/push automaticamente.

## Conferência desta documentação

- Todas as 28 rotas `page.jsx` existentes foram contabilizadas, incluindo aliases/redirecionamentos.
- Métodos e caminhos listados por página foram comparados com o OpenAPI local; nomes dos arquivos e links foram verificados no repositório.
- Chamadas de auth/home e dados locais dos demais hooks foram inspecionados. Não foi realizado teste de produção de cada página.
- O mapa antigo permanece como histórico. Para estado atual e arquivos por página, usar este guia. Contratos específicos em outros documentos complementam detalhes, mas devem ser conferidos com os routers/validators atuais.
