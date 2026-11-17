# CineAstra · Grupo 12

## 12.1 e 12.2 · Interface, responsividade e acesso por teclado

- A paginação compartilhada ganhou controles de 44 px e uma mensagem própria para páginas vazias.
- Os destaques do Cinema passam a iniciar pausados. A rotação pode ser ligada no controle do carrossel e respeita o movimento reduzido e a visibilidade da aba. Os seletores dos filmes podem quebrar linha e indicam o item atual ao teclado e ao leitor de tela.
- No Chrome, as entradas de Cliente, Fornecedor, Colaborador, Supervisor e Admin passaram nas larguras de 390, 768, 1024 e 1440 px sem rolagem horizontal da página. Em 390 px, os menus móveis e de acessibilidade foram abertos com Enter e fechados com Escape. O foco retornou ao acionador de acessibilidade.
- Escopo da inspeção visual: entradas dos cinco portais e os menus comuns. As páginas individuais de cada área não foram verificadas em todas as larguras.

## 12.3 · Regressão

| Verificação | Resultado |
| --- | --- |
| Suíte do backend | 320 aprovados, 4 ignorados conforme a configuração, 0 falhas |
| Suíte do frontend | 53 aprovados, 0 falhas |
| OpenAPI | Especificação validada |
| Permissões HTTP com contas de QA | 152 verificações no backend e 52 no frontend, com acesso por perfil, titular, fornecedor e unidade |
| MySQL integrado, instalação e atualização | 26 testes aprovados, incluindo catálogo, sessões, concorrência de estoque e assentos, assinatura, pagamento, consumo de ingresso e suporte |
| MySQL básico e fila da newsletter | 2 testes aprovados |
| Compra simulada e reembolso em MySQL | Pagamento repetido sem duplicar destinação, estorno parcial e integral, saldo de R$ 0,09 para R$ 0,00 e pedido anterior sem destinação |

O teste de localizações voltou a passar com a representação esperada de imagem ausente. Os testes de promoções foram alinhados com os filtros atuais do catálogo público. A fixture do detalhe de reembolso passou a fornecer o saldo e os itens elegíveis exigidos pelo serviço.

A verificação HTTP também exercitou logout, sessão rejeitada após revogação e respostas de permissão. Um teste recebeu o limite esperado de requisições e aguardou o prazo informado antes de tentar novamente. O roteiro do navegador usado para comparar a quantidade de chamadas não recebeu 429. A suíte MySQL ganhou uma ordem de execução que aplica as migrações antes de testar os contratos HTTP atuais, preservando o teste de atualização com dados históricos.

## 12.5 · Auditoria e redução das requisições autenticadas

Primeira e segunda medições com a aplicação compilada no Docker, Chrome headless em 1440 × 900 e uma sessão local separada por papel. Em cada sessão, foram observados a entrada, 15 segundos em repouso, uma navegação interna e oito eventos de foco em sequência. A contagem considera requisições do navegador às origens locais, exclui o login e separa chamadas de API dos pré-carregamentos do Next.js. Recursos estáticos e terceiros ficam fora da tabela. Uma requisição adicional de renderização (RSC) por clique permaneceu em todos os perfis.

| Perfil e páginas | Pré-carregamentos antes → depois | Chamadas de API antes → depois |
| --- | ---: | ---: |
| Cliente · Cinema → Filmes | 17 → 3 | 16 → 13 |
| Fornecedor · Portal → Estoque | 13 → 0 | 16 → 8 |
| Colaborador · Unidade → Chamados | 17 → 0 | 6 → 6 |
| Supervisor · Unidade → Experiências | 19 → 0 | 4 → 4 |
| Admin · Painel → Relatórios | 32 → 0 | 2 → 2 |
| **Total** | **98 → 3** | **44 → 33** |

As duas medições não registraram erros HTTP de API nos roteiros acima. No repouso de 15 segundos, apareceram duas chamadas de banners no Cinema antes da mudança e nenhuma chamada de API em qualquer perfil depois. Nenhum dos roteiros de 15 segundos disparou consulta a `/api/session/me`.

Em uma medição adicional de 60 segundos em repouso, todos os cinco perfis permaneceram com zero chamadas de API. Após esse repouso, oito eventos de foco em sequência dispararam uma revalidação de sessão por perfil. O Cinema também fez uma consulta de assinatura para atualizar o acesso ao Streaming. Não houve erros de API nesse roteiro.

Causas e correções:

- Os menus permanentes e as abas de Relatórios pré-carregavam rotas ao aparecer na tela. Os links alterados passam a solicitar a página na navegação.
- O Fornecedor fazia uma consulta adicional para cada cinema concedido. A listagem `GET /api/suppliers/me/locations` passa a retornar o nome de cada cinema ativo vinculado ao fornecedor. A mesma informação opcional é documentada na listagem administrativa de vínculos.
- A Home buscava a arte do próximo destaque a cada rotação automática. A rotação passa a depender da escolha da pessoa, e a Home aguarda a seleção principal antes de buscar o primeiro banner.

Para repetir, abra o painel Rede do Chrome com a mesma largura e as cinco contas da base QA, preserve o registro de rede durante a navegação e conte separadamente as rotas `/api/*` e os pedidos Next.js com `_rsc` e cabeçalho `next-router-prefetch`. Use a mesma janela de repouso e navegue entre as rotas da tabela em cada sessão. Para comparar a carga do servidor e do proxy, use a mesma janela **no servidor** e agrupe por rota, status e tipo de chamada. Os contadores do navegador não incluem todas as chamadas internas do servidor ao backend.

Snapshot do Docker pós-alteração, sem série histórica. Frontend aproximadamente 107 MiB, backend 153 MiB e MySQL 514 MiB. O snapshot não mede a economia de memória nem substitui um teste de carga.

## 12.4 · Entrega e pendências

- Arquivos centrais de interface: `app-sidebar.jsx`, `header-nav.jsx`, `streamming-header.jsx`, `unit-overview.jsx`, `supplier-overview.jsx`, `reports-layout.jsx`, `hero-section.jsx` e `table-pagination`.
- Arquivos centrais da API de fornecedores: `productModel.js`, `productService.js`, `use-supplier-data.js` e o contrato OpenAPI. Nenhum endpoint novo ou migração para este grupo.
- O teste de acessos continua limitado a localhost e aceita o nome da base local com sufixo `_test` ou `_qa_YYYYMMDD`. A conta, o estoque e os pagamentos testados são de QA.
- O pico de requisições registrado fora da base local continua sem causa confirmada. Para localizar sua origem, faltam as métricas do proxy no intervalo do pico, incluindo rotas e status. A validação da chamada externa à OpenAI continua pendente no ambiente local.
- Arquivos Docker, YAML e `.env` preservados. Nenhum commit ou push.

## Segunda verificação · Mesma página por 120 segundos

O teste foi ampliado para 14 combinações de página e perfil. Foram usados os cinco papéis autenticados com Chrome no ambiente local do Docker. O contador considerou todas as requisições observadas pelo navegador, incluindo imagens e origens externas. A janela de 120 segundos começou 6,5 segundos após o evento de carregamento, sem cliques, mudanças de rota ou eventos de foco simulados.

Antes da correção, a Home do Streaming adicionou três GETs a `/api/films/{id}/banners` conforme o carrossel avançava. As outras 13 combinações ficaram estáveis durante a janela. A rotação do Streaming passou a iniciar pausada, usando a lógica de visibilidade e movimento reduzido da Home do Cinema. Em 390 px, o teclado ainda selecionou um filme, iniciou a rotação e pausou o carrossel sem novas consultas depois da pausa.

Após reconstruir o frontend pelo Docker Compose, as 14 combinações abriram a rota esperada com HTTP 200 e registraram zero novas requisições durante os 120 segundos de repouso. A cobertura incluiu Cliente (Home do Cinema, Filmes, Home do Streaming, AstraSnack, Pagamento sem transação ativa e Suporte), Fornecedor (painel e Estoque), Colaborador (painel da unidade e Chamados), Supervisor (painel da unidade e Experiências) e Admin (Dashboard e Relatórios). Os 53 testes automatizados do frontend passaram.
