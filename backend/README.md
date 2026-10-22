# CineAstra — backend

API JavaScript ESM com Node.js 24, Express 5 e MySQL 8.0.16+. Fluxo: rotas → middlewares/validators → controllers → services → models. Services controlam transações; models usam a mesma conexão.

## Organização

O código de execução está em `src/`, incluindo `src/docs/openapi.json`, para manter compatibilidade com a estrutura de empacotamento existente. Ferramentas ficam em `scripts/`, testes em `tests/` e SQL em `../database/migrations/`. Não há uma segunda cópia de migrations no backend.

## Configuração local

1. Execute `npm ci` nesta pasta.
2. Copie `.env.example` para `.env` apenas se ainda não existir. Preencha `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME` com o banco de desenvolvimento. O exemplo usa `cineastra`, separado do `app_db` legado.
3. O servidor gera automaticamente `JWT_SECRET` se não for fornecido e o guarda em `.storage/auth/jwt-secret`, com permissão `0600`. Uma chave explícita no ambiente tem precedência. `JWT_ISSUER` e `JWT_AUDIENCE` têm valores padrão. Para habilitar 2FA, configure separadamente `TWO_FACTOR_ENCRYPTION_KEY` (32 bytes aleatórios em Base64), preservando essa chave de criptografia entre implantações. Nunca versione segredos.
4. Use `CORS_ORIGINS=http://localhost:3000`, `PUBLIC_ORIGIN=http://localhost:8080`, `HOST=0.0.0.0` e `PORT=8080`. `FRONTEND_URL` é aceito quando `CORS_ORIGINS` não foi definido. HTTP e HTTPS são aceitos em origens explícitas, mantendo compatibilidade com o endereço interno do Coolify. A documentação continua desabilitada em produção.
5. O padrão é `LOG_RETENTION_MODE=worker` para a retenção de logs. O modo `event` exige um evento MySQL configurado por um administrador; o runner não cria esse evento automaticamente.
6. Aplique o plano conforme [database/README.md](../database/README.md).
7. Execute `npm run dev` ou `npm start`.

`TERMS_VERSION`, `PRIVACY_VERSION` e a base legal devem refletir documentos oficiais antes de habilitar os fluxos que os exigem. Diretórios privados de imagens são separados em `.storage/images` e `.storage/gallery` no desenvolvimento; configure caminhos absolutos em produção.

## API

- `GET /health`: processo ativo.
- `GET /ready`: conexão com banco e condições de retenção de logs.
- `GET /api/health`: contrato compatível com o projeto base (`status`, `database`, `timestamp`), verifica a conexão MySQL como no backend anterior; use `/ready` para verificar também schema e retenção.
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

## Compatibilidade com a configuração anterior do Coolify

A API mantém `HOST=0.0.0.0`, porta padrão `8080` e os mesmos `DB_*`. Aceita `FRONTEND_URL` quando `CORS_ORIGINS` não foi informado, inclusive URLs HTTP da rede interna. `JWT_ISSUER` e `JWT_AUDIENCE` usam respectivamente `cineastra` e `cineastra-web` quando ausentes. `PUBLIC_ORIGIN` é opcional; seu padrão é localhost na porta configurada, e não é usado para escolher a interface de escuta.

Se `JWT_SECRET` não estiver configurado, o startup gera uma chave criptograficamente aleatória e a salva em `.storage/auth/jwt-secret` (no container: `/app/.storage/auth/jwt-secret`). A publicação do arquivo é atômica e inicializações concorrentes reutilizam a mesma chave. O servidor recusa arquivos inválidos ou com permissões públicas, em vez de sobrescrevê-los. `JWT_SECRET_FILE` permite escolher um caminho absoluto em armazenamento privado persistente. Configuração inválida é reportada no log somente pelos nomes dos campos, nunca pelos valores.

Uma reinicialização que preserve o arquivo mantém a chave. Uma recriação do container sem esse arquivo gera outra chave e invalida os tokens emitidos anteriormente: os usuários devem entrar novamente. Para múltiplas instâncias, configure explicitamente a mesma chave estável em todas. A geração automática não cria nem substitui a chave de criptografia 2FA.

`/api/health` confirma somente a conexão MySQL, mantendo o comportamento anterior. `/ready` também verifica a tabela de logs e a retenção: um health check básico aprovado não prova que as migrations do domínio foram aplicadas. O schema do Coolify precisa ser preparado separadamente; o código não aplica DDL automaticamente no startup.

Validação da compatibilidade Coolify: testes de origens HTTP em produção, contrato legado de health, diagnósticos sem valores, persistência/rotação da chave e inicialização concorrente. Nenhum deploy remoto é executado por esses testes.
