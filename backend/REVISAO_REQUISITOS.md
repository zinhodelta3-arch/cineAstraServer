# Revisão dos requisitos CineAstra — 03/11/2026

Análise estática; aplicação e banco não foram iniciados nem consultados. Não foram executados testes, build, lint, migrations, instalação de dependências, commit, push ou pull. Arquivos de ambiente, YAML, Docker e front-end não foram alterados. Esta entrega é parcial: não equivale à resolução de todos os sintomas do ambiente.

## Alterações implementadas

- Novas compras de filmes são rejeitadas na cotação, no pedido e na verificação de comercialização (`STREAMING_PURCHASE_DISABLED`, HTTP 409). Aluguéis, ingressos e acessos históricos permanecem nos fluxos existentes; pedidos antigos não são apagados.
- Publicação de preços de combos e sessões deixa de ser bloqueada apenas por existirem vendas anteriores. Valores dos itens e snapshots históricos não são atualizados. A exigência de sincronização entre preço calculado e publicado continua ativa.
- Checkout distingue `CATALOG_PRICE_OUT_OF_SYNC` (409) e `GUARDIAN_AUTHORIZATION_REQUIRED` (403); estoque insuficiente na cotação usa `INSUFFICIENT_STOCK` (409), separado de indisponibilidade do produto.
- Emissão rejeita item de sessão com quantidade diferente de um, evitando múltiplos ingressos para um único assento em pedidos inconsistentes. O corpo de criação já exigia um item por assento e rejeitava duplicações; tickets de retirada continuam seguindo a quantidade de produtos.
- Consulta administrativa do suporte aceita filtro de encerrados, preservando a fila aberta como padrão.
- Administrador pode editar nome e telefone pelo endpoint de perfil administrativo. Permissões, estados, e-mail e documentos continuam em fluxos específicos; nenhuma reativação foi acrescentada.
- Catálogo aceita filtro explícito de lançamentos futuros, aplicado antes da paginação.
- Categorias já presentes nos produtos podem ser consultadas para seleção, sem expor categorias de outros fornecedores ao fornecedor autenticado. Não foi criado um cadastro mestre nem proibida a classificação textual existente.
- Equipes listadas para colaboradores incluem `myFunction`, com a função da própria associação ativa, ou `null` para ausência de vínculo ativo.
- Erros de duplicidade e integridade referencial do MySQL recebem códigos e mensagens públicos sem SQL ou nomes de constraints.

## Contratos novos ou ampliados

As respostas usam o envelope `success` existente; abaixo está o conteúdo de dados.

| Rota | Contrato |
| --- | --- |
| `PATCH /api/admin/users/:id` | ADMIN; corpo não vazio com `name` e/ou `phone` (telefone pode ser null); retorna o DTO de usuário existente. Perfil/status continuam em `PATCH /api/admin/users/:id/access`. |
| `GET /api/admin/support` | ADMIN; `limit` de 1 a 100, padrão 20; `cursor` inicial `0`; `status=ABERTO, EM_ATENDIMENTO, RESOLVIDO, FECHADO` (um valor) ou `ALL`. Sem status mantém abertos/em atendimento. Ordem crescente de ID. |
| `GET /api/films` e listagem administrativa de filmes | `upcoming=true` exige lançamento posterior à data UTC atual; `false` inclui lançados e sem data. Filtros existentes e ordem de ID são mantidos. Não cria títulos fictícios. |
| `GET /api/inputs/categories`, `GET /api/equipment/categories` | ADMIN ou FORNECEDOR; `limit` de 1 a 100, padrão 20; `cursor` opcional é o nome da última categoria; ordenação pela categoria conforme a collation do banco. Retorno `{items:[{name}],pagination:{limit,nextCursor}}`. ADMIN vê categorias cadastradas em todos os produtos; fornecedor vê somente as suas. |
| `GET /api/teams` | DTO de cada equipe do colaborador inclui `myFunction`. Tarefas já estão em `GET /api/teams/:id/chamados?assigned=me`, com filtros e paginação existentes. |

Nas listagens, enviar o `nextCursor` recebido mantendo os mesmos filtros; `null` encerra a paginação. Suporte retorna `{items,pagination:{limit,nextCursor}}`. O catálogo conserva esse mesmo formato e o cursor de ID existente. Não foi aplicada paginação genérica a respostas agregadas como saldos e relatórios.

## Diagnóstico por requisito e pendências

| Item | Evidência / situação |
| --- | --- |
| 1.1 AstraSnack | Front-end obtém `/pricing/quote`; preço publicado divergente da base calculada torna a cotação não finalizável. Insumos já permitem republicação; combos eram bloqueados após venda. Sem dados do ambiente não é possível afirmar quais preços/custos, vínculos ou estoques estão incorretos. Não houve atualização automática de preços nem flexibilização das validações. |
| 1.2 Idade | Cadastro autodeclarado e verificação vigente são conceitos distintos. Já existe `POST /api/users/me/age-verification`; consulta exige expiração futura. Provedor padrão de identidade é indisponível; servidor aceita provedor injetado. Falta identificar o provedor real e a situação da conta afetada. CPF/data preenchidos não geram comprovação. |
| 1.3 Pix | `frontend/src/hooks/cinema/pagamento/use-payment.js` usa `crypto.randomUUID()` no navegador, inclusive novamente no catch. Back-end usa `node:crypto`. Correção no navegador é pendência fora do escopo; deve conservar chave idempotente por operação e sua reutilização em tentativas. Nenhuma identificação financeira foi substituída. |
| 1.4 Quantidades | Validação de um item por assento e emissão endurecida. Divergências de seleção no navegador não foram reproduzidas. Não houve correção de dados históricos. |
| 1.5 Complementos | Checkout já aceita SESSION, INPUT e COMBO juntos, com local, preço, composição e reserva de estoque. Combo exige `sessionId` de retirada e `localId`; não foi criada escolha automática de sessão. Uso pela interface precisa respeitar esse contrato. |
| 2.1 Usuários | Faltava PATCH de perfil administrativo; adicionados nome e telefone. Outros campos sensíveis aguardam definição. |
| 2.2 Fornecedores | Cadastro, listagem paginada, ativação e vínculo com vários locais já existem. Não existe filtro fixo de Aurora no código de produção inspecionado. Confirmar cadastros ativos, usuário FORNECEDOR ativo e `fornecedor_locais` ativo no ambiente; não cadastrar fornecedores fictícios. |
| 2.3 Encerrados | Suporte administrativo agora filtra resolvidos/fechados; chamados internos de equipe já aceitam filtro FECHADO/CANCELADO. |
| 2.4 Administração | Há rotas de vendas/pagamentos, reembolsos com decisão, assinaturas/acessos, privacidade, inventário, tickets/passagens, logística, equipes/entradas e usuários. Não foram concedidas novas permissões indiscriminadas. Operações adicionais e sua matriz de papéis precisam ser especificadas; auditoria funcional completa desses módulos permanece pendente. |
| 2.5 Erros | Acrescentados códigos descritos acima. Não foi revisado cada erro de todos os módulos nem reclassificado genericamente todo SIGNAL do banco. |
| 2.6 Paginação | Principais listagens inspecionadas já usam limit/cursor. Novas categorias e suporte ampliado conservam esse padrão. Precificação ainda tem listas com LIMIT fixo; cobertura de todas as tabelas administrativas permanece pendente. |
| 2.7 Retenção | `logModel` já prevê logs por 90 dias, lotes de 5.000 e EVENT a cada 15 minutos ou worker exclusivo. Confirmar EVENT/scheduler no ambiente; nenhum evento foi ativado. Para outros temporários faltam tipos e prazos. |
| 3.1–3.2 Imagens | Galerias já existem: filmes usam CAPA/BANNER/ALTERNATIVA, insumos e combos possuem galerias próprias. Não foram duplicadas tabelas ou rotas. |
| 3.3 Compras de filmes | Bloqueadas novas cotações e checkouts; históricos e concessão de pedidos antigos permanecem. Interface precisa remover a oferta de compra. |
| 3.4 Aluguel | Já existe prazo por filme, snapshot no item e expiração contada do pagamento confirmado. Cadastro tem padrão de 3 dias. Não foram redefinidos prazo, preços nem benefícios de assinatura; confirmação das regras foi solicitada. |
| 3.5 Em breve | Interface filtra datas dos filmes recebidos; a listagem é paginada e não tinha filtro próprio de futuro. Adicionado upcoming para consulta antes da paginação; interface precisa consumi-lo ou percorrer as páginas. Não há evidência de títulos futuros no banco. |
| 3.6 Assinantes | Serviço de reprodução verifica assinatura ativa, datas, benefício catalogAccess, participante e cobrança antes da entrega. Provedor de mídia assinado precisa estar disponível; análise estática não comprova configuração ou acesso real. |
| 4.1 Combo 404 | Rotas POST `/api/unit/combos` e proxy `/api/unidade/operacoes/combos` já existem, composição aceita dois ou mais insumos. Serviço busca local e detalhe após criar na mesma conexão. Sem URL/payload/resposta da falha não há causa demonstrada; não foi acrescentado alias especulativo. |
| 4.2 Chamados | Internos já permitem título/descrição/prioridade por gestor ou criador enquanto ABERTO; atribuição exige gestor e membro elegível. Suporte tem mensagens em histórico; edição de mensagens/assunto depende de definição. |
| 4.3 Visão geral | Função própria acrescentada à listagem de equipes; tarefas atribuídas já disponíveis pelo filtro assigned=me. Interface não foi alterada. |
| 4.4 Operação | Aguardando distinção entre vendas/aquisições e entrada/saída de pessoas, produtos ou valores. Tickets/passagens e movimentos de estoque já existem. |
| 4.5 Urgência | Chamados internos já têm prioridade URGENTE, responsável, aceite, resolução e fechamento com histórico. Fluxo específico de produção, se diferente, precisa ser definido. |
| 5.1 Estoque | Produtos/inventário já verificam fornecedor proprietário; fornecedor não pode selecionar outro supplierId. Não foi removido isolamento. |
| 5.2 Categorias | Seleção das categorias existentes disponibilizada; cadastro mestre, manutenção e migração de classificações legadas ainda não implementados. |
| 5.3 Solicitações | Fornecedor já consulta solicitações/entregas por seu ID em diferentes unidades e atende com vínculo autorizado; não restringe à unidade local como supervisor. Não foram expostos pedidos de outros fornecedores. |
| 5.4 Entregas | Aprovação de solicitação já cria logística; há envio, trânsito, recebimento, devolução e cancelamento, com histórico/estoque. Reprodução real e eventuais campos adicionais permanecem pendentes. |
| 5.5 Transporte próprio | Cadastro não implementado nesta entrega. Solicitados dados e tipos necessários antes de definir schema/contrato. |
| 5.6 Transporte CineAstra | Não implementado; aguardando preço, responsabilidades, disponibilidade e condições. |
| 6.1 Quedas | Middleware já oculta erros internos; banco tem prazo de execução e encerramento de conexão. Acrescentados erros seguros de integridade. Sem logs/requestId ou reprodução não é possível atribuir quedas a back-end ou front-end. |
| 6.2 IA | `assistantProvider` padrão só declara indisponibilidade. Serviço já oferece encaminhamento humano. Falta implementar/escolher provedor real e contrato de configuração; não basta inventar credencial ou remover fallback. |
| 7.1 Social | Aguardando descrição do problema e comportamento esperado; nenhuma alteração. |

## Migrations e validação

Nenhuma das mudanças realizadas exige schema novo; nenhuma migration criada ou executada. Galerias, snapshots, estoque, logística, identidade, assinaturas e supervisor/local dependem das migrations já existentes; a aplicação delas no ambiente não foi verificada. Transporte próprio e eventual cadastro mestre de categorias poderão exigir novas migrations após definição.

Revisados estaticamente os diffs, rotas, schemas, permissões, parâmetros SQL, envelope e preservação dos históricos. OpenAPI JSON e seus geradores ainda precisam refletir os contratos novos; não foram executados geradores ou verificações. Sem testes executáveis, não há comprovação de funcionamento em execução.
