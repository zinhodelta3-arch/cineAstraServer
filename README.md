# CineAstra

Frontend Next.js 16, backend Express 5 / Node.js 24 e banco MySQL 8.0.16+ (validado localmente com MySQL 8.4).

## Estrutura

- `frontend/`: interface existente.
- `backend/src/`: aplicação, controllers, rotas, serviços, models, validações, jobs e provedores.
- `backend/src/docs/openapi.json`: contrato da API, incluído junto ao código de runtime.
- `backend/scripts/`: migrations, bootstrap do administrador e ferramentas de documentação.
- `backend/tests/`: testes unitários, HTTP e integração MySQL.
- `database/migrations/`: 36 arquivos SQL recebidos; o runner seleciona e ordena os statements aprovados.
- `database/init/`: inicialização legada do projeto base; não substitui as migrations da aplicação.

## Desenvolvimento

Use Node.js 24 e npm 11. Instale com `npm ci` na raiz, em `backend` e em `frontend`.

Prepare `backend/.env` a partir de `backend/.env.example`, preservando qualquer configuração local existente. Configure a conexão com um schema de desenvolvimento, as chaves de autenticação e as origens conforme o [guia do backend](backend/README.md). O [guia do banco](database/README.md) explica como aplicar as migrations sem apagar dados.

Execute em terminais separados:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

O backend usa porta `8080`; o frontend, `3000`. Em `frontend/.env.local`, a configuração do projeto é `NEXT_PUBLIC_API_URL=http://localhost:8080/api`.

Endpoints de verificação: `GET /health`, `GET /ready` e `GET /api/health`. A documentação interativa está em `/api-docs/`, somente em desenvolvimento.

## Estado da integração

O backend recebido foi incorporado à estrutura `backend/src`, e suas migrations foram movidas para `database/migrations`. Os scripts e testes apontam para esses caminhos. A API aceita a origem do frontend via `CORS_ORIGINS`, com compatibilidade para `FRONTEND_URL`.

A importação não conecta automaticamente os formulários e dados estáticos das telas às novas rotas. Essas chamadas devem seguir os contratos OpenAPI. Provedores externos de pagamento, CAPTCHA, identidade, e-mail, streaming e IA exigem implementação/configuração próprias; os adaptadores indisponíveis da entrega foram preservados.

## Verificação

Na pasta `backend`:

```bash
npm test
npm run validate:openapi
npm run migrate -- --plan
```

Os testes MySQL requerem schema separado, vazio e terminado em `_test`; veja `backend/README.md`. Arquivos `.env` e mídia privada ficam fora do Git. Arquivos Docker e YAML foram preservados nesta integração.
