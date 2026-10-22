# Banco de dados CineAstra

`migrations/` contém os 36 SQLs da entrega. O runner em `../backend/scripts/migrationPlan.js` seleciona 170 statements em ordem explícita e registra checksums por statement em `schema_migrations`.

## Aplicar no desenvolvimento

Crie um schema vazio de desenvolvimento (por exemplo, `cineastra`) com charset `utf8mb4` e conceda ao usuário da aplicação as permissões necessárias. Configure a conexão em `backend/.env`. O schema `app_db` com a tabela `health_checks` é legado e não deve ser apagado ou usado como baseline automático.

A partir de `backend/`:

```bash
npm run migrate -- --plan
MIGRATION_CONFIRMED_NON_PRODUCTION=true MIGRATION_TARGET=cineastra npm run migrate -- --apply
```

`MIGRATION_TARGET` deve corresponder exatamente ao `DB_NAME` configurado. O runner recusa produção, banco existente sem ledger, divergência de checksums e DDL interrompido. Uma segunda execução de um plano concluído não reaplica os statements. Em caso de falha parcial, inspecione antes de tentar novamente; não remova o ledger para forçar aplicação.

Não execute todos os arquivos por ordem alfabética nem coloque estes arquivos em `init/`: eles também contêm SQL histórico, seeds de referência e operações de administração que o runner exclui deliberadamente. A criação/seleção do schema (`CREATE DATABASE`/`USE`) e eventos de retenção ficam fora do plano. Para desenvolvimento, use `LOG_RETENTION_MODE=worker` no backend.

## Inicialização legada e implantação

`init/01-schema.sql` permanece como inicialização do template. Ele não cria o domínio CineAstra. Para uma implantação, prepare o schema e as variáveis do serviço por um procedimento próprio; execute as migrations a partir do checkout. A imagem de runtime do backend inclui `src/`, enquanto scripts e migrations ficam fora dela. Não houve alteração em arquivos Docker ou YAML.

## Validação realizada

Na máquina de desenvolvimento, foram criados os schemas separados `cineastra` e `cineastra_import_test`, preservando `app_db`. O plano foi aplicado no primeiro com 170 entradas concluídas no ledger e 86 tabelas. O segundo foi usado pelos testes reais de transações, constraints, autenticação e concorrência. Não contém dados de produção.
