# Inserts de demonstração — usuários e filmes

Arquivo: [usuarios-filmes.sql](../database/examples/usuarios-filmes.sql).

Cria **5 usuários (1 ADMIN e 4 CLIENTES)** e **5 filmes**, se ainda não existirem. Execute depois das migrations; não reinstale o banco. Nenhum comando foi executado no Coolify.

## Usuários e senhas

Estas são credenciais públicas de teste. Troque a senha do admin antes de usar a conta com dados reais. Os e-mails usam domínio reservado de exemplo e não recebem mensagens.

| Perfil | E-mail | Senha | CPF de teste |
|---|---|---|---|
| ADMIN | admin.demo@cineastra.example | `CineAstraAdmin2026!` | 90000000001 |
| CLIENTE | ana.demo@cineastra.example | `CineAstraAna2026!` | 90000000002 |
| CLIENTE | bruno.demo@cineastra.example | `CineAstraBruno2026!` | 90000000003 |
| CLIENTE | carla.demo@cineastra.example | `CineAstraCarla2026!` | 90000000004 |
| CLIENTE | diego.demo@cineastra.example | `CineAstraDiego2026!` | 90000000005 |

As senhas são armazenadas no SQL como hashes bcrypt de custo 12, gerados e conferidos com as funções do backend. Os usuários ficam ATIVOS. Os CPFs são fictícios e dependem da regra atual de 11 números, sem cálculo verificador. Não são criados registros falsos de consentimento, idade verificada ou 2FA. Com CAPTCHA/2FA em standby, o admin pode entrar pelo login normal e é encaminhado ao dashboard.

Se um e-mail ou CPF já existir, o registro é preservado: o script não redefine sua senha nem transforma uma conta existente em admin. Nesse caso, a senha desta tabela pode não ser a senha existente.

## Filmes

| Título | Minutos | Classificação |
|---|---:|---|
| Interestelar | 169 | 10 |
| Soul | 100 | L |
| A Viagem de Chihiro | 125 | L |
| Whiplash | 107 | 12 |
| Meu Amigo Totoro | 86 | L |

Os filmes ficam ATIVOS e disponíveis no catálogo do cinema. As imagens apontam para arquivos existentes no frontend em seu domínio atual; ajuste o domínio se ele mudar. Não inclui gêneros, salas, sessões, ingressos ou vídeos de streaming. Um título já existente é preservado.

## Importação no Coolify

Disponibilize o arquivo SQL no contêiner do MySQL e execute no terminal Bash:

```bash
mysql --default-character-set=utf8mb4 -u root -p cineastra < /caminho/usuarios-filmes.sql
```

Troque o caminho e, se necessário, o nome do banco. A senha solicitada pelo comando é a do **MySQL**, não a do admin do site. O arquivo usa uma transação e não precisa ser executado tabela por tabela. Não use `--force`. Se estiver usando o prompt interativo e houver erro, execute `ROLLBACK;`.

## Validação

Validado em MySQL 8.0.46 isolado, após aplicar o instalador completo (176 etapas). O SQL foi executado duas vezes e manteve 5 usuários, 1 admin e 5 filmes elegíveis para a home, sem duplicação. Os cinco hashes foram conferidos com o verificador de senha do backend.

A home consulta `GET /api/films?cinema=true&limit=20` e separa os filmes pela data de lançamento. Estes cinco entram em “Em cartaz”. Se o banco já tiver outros filmes, a paginação pode deixá-los nas próximas páginas. A API precisa estar acessível pelo frontend. Não foram criados horários/sessões; comprar ingressos depende desse cadastro posterior.
