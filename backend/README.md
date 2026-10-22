# CineAstra — backend

API JavaScript ESM com Node.js 24, Express 5 e MySQL 8.0.16+. Fluxo: rotas → middlewares/validators → controllers → services → models. Services controlam transações; models usam a mesma conexão.

## Organização

O código de execução está em `src/`, incluindo `src/docs/openapi.json`, para manter compatibilidade com a estrutura de empacotamento existente. Ferramentas ficam em `scripts/`, testes em `tests/` e SQL em `../database/migrations/`. Não há uma segunda cópia de migrations no backend.

## Configuração local

1. Execute `npm ci` nesta pasta.
2. Copie `.env.example` para `.env` apenas se ainda não existir. Preencha `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME` com o banco de desenvolvimento. O exemplo usa `cineastra`, separado do `app_db` legado.
3. Gere localmente `JWT_SECRET` aleatório (mínimo 32 bytes) e `TWO_FACTOR_ENCRYPTION_KEY` (32 bytes aleatórios em Base64). Salve somente no `.env` ignorado, nunca no repositório. Configure `JWT_ISSUER` e `JWT_AUDIENCE`.
4. Use `CORS_ORIGINS=http://localhost:3000`, `PUBLIC_ORIGIN=http://localhost:8080`, `HOST=0.0.0.0` e `PORT=8080`. `FRONTEND_URL` é aceito quando `CORS_ORIGINS` não foi definido. Em produção, as origens públicas devem usar HTTPS e a documentação fica desabilitada.
5. Use `LOG_RETENTION_MODE=worker` para a retenção local de logs. O modo `event` exige um evento MySQL configurado por um administrador; o runner não cria esse evento automaticamente.
6. Aplique o plano conforme [database/README.md](../database/README.md).
7. Execute `npm run dev` ou `npm start`.

`TERMS_VERSION`, `PRIVACY_VERSION` e a base legal devem refletir documentos oficiais antes de habilitar os fluxos que os exigem. Diretórios privados de imagens são separados em `.storage/images` e `.storage/gallery` no desenvolvimento; configure caminhos absolutos em produção.

## API

- `GET /health`: processo ativo.
- `GET /ready`: conexão com banco e condições de retenção de logs.
- `GET /api/health`: contrato compatível com o projeto base (`status`, `database`, `timestamp`), condicionado à prontidão real.
- `GET /api/films` e `GET /api/genres`: catálogo público.
- `/api-docs/` e `/openapi.json`: documentação disponível em desenvolvimento.

As demais respostas usam `{success:true,data,requestId}` ou `{success:false,code,message,requestId,details?}`. IDs BIGINT e valores DECIMAL são strings. Consulte `src/docs/openapi.json` para URLs, autenticação e DTOs; não deduza rotas apenas pelos nomes dos módulos.

O primeiro administrador pode ser criado com `npm run bootstrap:admin -- --apply`, `BOOTSTRAP_ADMIN_CONFIRMED=true` e JSON pela entrada padrão segura conforme `schemas.adminUser` em `src/validators/identityValidators.js`. O comando recusa administrador preexistente e exige enrollment/2FA no login. Nenhuma conta de administrador foi criada na integração.

## Testes

```bash
npm test
npm run validate:openapi
npm run migrate -- --plan
```

Para MySQL real, configure `TEST_DB_HOST`, `TEST_DB_PORT`, `TEST_DB_USER`, `TEST_DB_PASSWORD` e `TEST_DB_NAME`. O schema deve estar vazio, separado de `DB_NAME`, terminado em `_test` e com permissões DDL. Configure `TEST_DB_CONFIRMED_NON_PRODUCTION=true`, `RUN_MYSQL_TESTS=true` e `RUN_IDENTITY_MYSQL_TESTS=true`, depois execute `npm run test:integration`. A suíte de identidade cria tabelas e dados próprios e recusa reaproveitar um schema já populado. Sem as flags, os testes são explicitamente pulados.

Validação da integração: 224 testes locais/HTTP e 28 testes com MySQL real passaram, sem testes pulados. O plano aplicou 170 statements e sua segunda execução não repetiu o DDL. Os endpoints de prontidão, catálogo e proteção de rotas autenticadas foram verificados com a API em execução.

## Limites da entrega recebida

Pagamentos, CAPTCHA, identidade externa, envio de e-mail, mídia privada e IA têm adaptadores indisponíveis por padrão. Definir credenciais isoladamente não implementa esses provedores. Os testes usam fixtures para efeitos externos e não comprovam serviços de produção. As telas existentes ainda precisam de chamadas aos contratos da API.

A configuração local desta máquina usa o schema `cineastra`; o `app_db` anterior foi preservado. Ambientes de implantação precisam receber as variáveis e o schema próprios. As migrations são executadas a partir do checkout, antes do serviço, e não automaticamente no startup. Nenhum arquivo Docker ou YAML foi alterado.
