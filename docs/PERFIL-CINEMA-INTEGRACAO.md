# Integração de /cinema/perfil

## Implementado

- Perfil completo de `GET /api/users/me`, sem usar os dados resumidos da sessão como cadastro.
- Nome e telefone salvos por `PATCH /api/users/me`; sucesso somente após confirmação do backend. O header recebe evento para atualizar o nome.
- Senha alterada pelo mesmo endpoint com senha atual, nova senha e confirmação. Validação da política de 12 caracteres/complexidade e até 72 bytes. Código 2FA é opcional na interface e a exigência continua sob controle do backend.
- Ao confirmar a troca de senha, o backend revoga as sessões; o proxy limpa o cookie HttpOnly e o navegador volta ao login.
- Endereços e contatos: listagem paginada, inclusão/edição em modal, definição do principal e remoção com confirmação.
- Métodos de pagamento existentes: listagem, definição do principal e remoção com confirmação, exclusivamente para CLIENTE.
- Logout real, com confirmação. Visitantes não veem dados nem formulários privados.
- O espaço do perfil é remontado ao mudar de usuário; as leituras cancelam requisições anteriores e não reutilizam dados de outro usuário.

## Organização e endpoints

A página continua importando apenas o componente. Os hooks em `hooks/cinema/perfil` controlam leituras, paginação, formulários e mutações; os componentes preservam o estilo do perfil.

`/api/profile/[[...path]]` é um proxy restrito: somente os recursos usados, token do cookie HttpOnly, origem validada nas mutações, campos permitidos e sem cache. Não permite alterar papel/status, exportar/excluir conta, fornecer token de cartão ou acessar outro usuário.

| Fluxo | Model | Controller | Router |
|---|---|---|---|
| Perfil e senha | identityModel (profileService) | identityController | identityRoutes |
| Endereços e contatos | identityModel (profileService) | identityController | identityRoutes |
| Métodos existentes | paymentMethodModel | paymentMethodController | paymentMethodRoutes |

## Pendências explícitas

- Troca de e-mail depende de prova de confirmação do provedor; o campo é somente exibido nesta etapa.
- Adição de cartão depende de sessão hospedada/tokenização do provedor; não há formulário de cartão fictício.
- Preferências de aparência/acessibilidade permanecem no fluxo atual do site; sincronização com `GET/PATCH /users/me/preferences` ainda não foi integrada.
- Favoritos de streaming exigem perfil de streaming. Os favoritos, ingressos, compras e contagens de demonstração foram retirados da renderização. A página oferece acesso a compras, planos e suporte; não inventa um histórico de compras.
- Avatar persistente não existe no contrato atual; são exibidas as iniciais do nome.
- Nenhum arquivo Docker/YAML foi alterado. Sem alteração do backend.

## Validação

- Testes de validação do proxy: bloqueio de papel/e-mail/token de cartão, política da senha, IDs e formato dos registros.
- Build e ESLint dos arquivos alterados concluídos sem erros.
- Navegador: edição do perfil, inclusão/edição de endereço, inclusão de contato, método principal/remoção confirmada, layout móvel, rejeição de senha atual errada e troca bem-sucedida com limpeza do cookie e retorno ao login. Visitante sem dados privados.
- Testes com serviços isolados; produção/Coolify não verificados.
