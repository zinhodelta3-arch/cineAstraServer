# Banco de dados CineAstra

O diretório `migrations/` contém **42 arquivos SQL**. O plano explícito em `backend/scripts/migrationPlan.js` seleciona **176 statements de 41 arquivos**, até `20261026_36_streaming_profile_photos.sql`. São **91 tabelas**, contando `schema_migrations`.

## Importação única: banco vazio

`cineastra-install.sql` consolida o plano completo, incluindo perfis, favoritos, progresso, publicação avulsa, conteúdo promocional e fotos de perfis (31–36). O schema precisa existir e estar **vazio**.

No Bash/terminal do MySQL no Coolify, após disponibilizar o arquivo no contêiner:

```bash
mysql --default-character-set=utf8mb4 -u root -p cineastra < /caminho/cineastra-install.sql
```

A senha é solicitada no terminal. Não precisa importar tabela por tabela. Substitua o nome do banco e o caminho pelos reais. Selecionar o banco neste mesmo comando evita o problema de `USE` executado numa conexão anterior.

Requer MySQL 8.0.16+ (CHECK constraints), permissões DDL, CREATE ROUTINE e EXECUTE. Validado nesta revisão em MySQL **8.0.46**. Não foi validado em MariaDB. O arquivo não cria banco/usuário, não remove tabelas e não inclui senhas ou dados de clientes.

**Não importar o consolidado em banco já preenchido.** Ele recusa schemas com tabelas. Não usar `--force`, não apagar o ledger, não remover tabelas para contornar erro. Se uma importação falhar, DDL pode já ter sido persistido: inspecione `schema_migrations` e a procedure auxiliar antes de repetir.

## Atualização incremental de banco existente

O runner compara nomes, checksums e estado do ledger. Em base antiga corretamente instalada até a migration 30, aplica somente as seis etapas novas, preservando os dados. A coluna `insumos.venda_avulsa` começa false inclusive nos registros existentes; publicar explicitamente os produtos desejados.

Para desenvolvimento/homologação, configure a conexão em `backend/.env` e execute a partir de `backend/`:

```bash
npm run migrate -- --plan
MIGRATION_CONFIRMED_NON_PRODUCTION=true MIGRATION_TARGET=cineastra npm run migrate -- --apply
```

`MIGRATION_TARGET` precisa coincidir com `DB_NAME`. O runner **recusa produção**, base existente sem ledger, ledger divergente e DDL interrompido. O comando acima não é um procedimento para atualizar produção no Coolify. Uma implantação produtiva exige procedimento próprio revisado, backup e validação no banco alvo; não altere o modo da aplicação para contornar essa proteção.

A imagem de runtime existente não inclui scripts/migrations; executar a partir do checkout ou preparar os arquivos por seu procedimento de implantação. Nenhum Docker/YAML foi alterado.

## O que manter e o que não executar diretamente

Não foi necessário remover ou reescrever migrations nesta revisão. As etapas antigas permanecem com os mesmos checksums.

- `20261001_01_create_database.sql`: fora do plano por conter criação/seleção de schema. Mantido como histórico; o alvo é selecionado pelo cliente/conexão.
- Os arquivos antigos contêm também seeds, consultas de referência e eventos administrativos. O plano seleciona somente os statements aprovados; **não executar todos os arquivos por ordem alfabética**.
- `init/01-schema.sql` é inicialização legada do template, não o domínio CineAstra. Não foi modificado. Não misture esse schema com uma instalação nova.
- Retenção deve seguir `LOG_RETENTION_MODE=worker` ou procedimento explícito de DBA; eventos históricos não são importados.

## Manter o consolidado sincronizado

Na raiz do projeto:

```bash
node backend/scripts/generateInstallSql.js
node --test backend/tests/migrationInstall.test.js
```

O gerador usa o mesmo plano e os mesmos checksums do runner. O teste detecta arquivo consolidado desatualizado e SQL esquecido no plano. Nunca edite manualmente o consolidado como substituto de uma migration incremental.

## Verificação realizada nesta revisão

MySQL 8.0.46 temporário, isolado por socket local, sem acesso ao Coolify ou ao banco remoto:

1. Plano completo aplicado em schema vazio: 176 entradas APPLIED.
2. Segunda execução do runner: nenhuma reaplicação.
3. Consolidado completo importado pelo cliente mysql: 176 entradas APPLIED.
4. Runner após consolidado: checksums compatíveis, nenhuma reaplicação.
5. Consolidado antigo do repositório (170 etapas, até migration 30), seguido pelo plano atual: atualização concluída e registro de teste preservado.
6. Comparação de `SHOW CREATE TABLE`: três esquemas equivalentes, com 91 tabelas.
7. Reimportação do consolidado em schema preenchido: recusada.
8. Unicidade de favoritos/conteúdo, CHECK de progresso e tamanho/dimensões da foto, cascata ao excluir perfil e publicação desativada por padrão: verificados no MySQL real.

Isso valida instalação e evolução dessa base de referência. Não garante que um banco remoto alterado manualmente ou com dados legados inconsistentes passe nos preflights; o banco real não foi alterado.
