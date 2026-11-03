# Integração do front-end — 03/11/2026

## Alterações

- Pagamento Pix/cartão, assinatura e cancelamento usam UUID criptográfico com alternativa por `crypto.getRandomValues` quando `randomUUID` não está disponível. Não há alternativa com Math.random ou horário. Pagamento mantém sua chave em memória mesmo quando sessionStorage falha, evitando criar outra chave a cada tentativa na mesma página; armazenamento disponível permite reutilização após recarregar a aba.
- Carrinho limita um ingresso por assento, evita somar a mesma seleção repetida e normaliza quantidades numéricas recuperadas do armazenamento. Itens de produto continuam limitados a 100 unidades e pedidos a 500 unidades. Cotação e resumo associam linhas pela ordem do pedido e identidade do assento, sem usar apenas o primeiro resultado da sessão.
- Mensagens de compra distinguem idade sem verificação, classificação etária, autorização do responsável, preço desatualizado e estoque insuficiente. O tratamento da resposta mantém status e código de erro. Nenhuma verificação foi contornada.
- AstraSnack recebe o indicador de preço fora de sincronização e deixa de atribuir todo bloqueio de cotação exclusivamente ao preço.
- Usuários possuem ação “Editar dados” para nome e telefone, com PATCH pelo proxy administrativo, revisão de permissão no servidor e tratamento de erro/pending. Papel e status permanecem na ação de acessos.
- Suporte administrativo consulta resolvidos e fechados no servidor. “Todos” usa ALL. Carregar mais conserva status/cursor; mudar o filtro limpa a página anterior.
- Filmes em breve são filtrados pela API antes da paginação. Home consulta lançados e futuros separadamente, com carregamento, falha, lista vazia e paginação independentes; listagem de filmes usa o mesmo filtro.
- Cadastro administrativo de insumos permite selecionar categorias já cadastradas, com carregamento de outras páginas. Categoria legada do item editado é preservada como opção. Nenhum cadastro mestre de categorias foi criado.
- Visão geral exibe a função do colaborador por equipe. Link de tarefas abre os chamados da equipe com assigned=me para colaboradores; tela de chamados permite ativar/desativar o filtro, mantendo status e paginação.

## Arquivos

Mudanças concentradas em `src/app/api` (proxies de checkout, cotação, usuários, suporte e categorias), `src/hooks/cinema`, `src/hooks/admin/use-admin-support.js`, `src/lib/api`, `src/lib/auth` e seus componentes de carrinho, pagamento, catálogo, usuários, suporte, insumos e unidade. Utilitários novos: `src/lib/api/operation-key.mjs` e `src/lib/api/commerce-errors.mjs`.

## Limites e pendências

- IA deixada para depois, conforme solicitado; seus componentes, serviços e integrações não foram alterados.
- Não foram encontradas ações de compra de filmes no fluxo de streaming inspecionado; o back-end já bloqueia novas compras. Históricos e ingressos permanecem disponíveis.
- Combo com HTTP 404 e fornecedor único não foram reproduzidos. Rotas/proxy de combos e seleção paginada de fornecedores já existem. É necessário obter URL, payload e resposta da falha, além dos cadastros/vínculos ativos do ambiente, antes de atribuir uma causa.
- Idade verificada continua dependendo do provedor e da comprovação do back-end; preencher CPF/nascimento não conclui a verificação. Preços/custos fora de sincronização exigem publicação administrativa real.
- Complementos continuam no fluxo existente de carrinho misto, acessível por “Continuar comprando”. Unidade e sessão de retirada permanecem sujeitas às validações do back-end.
- Não foram inventadas regras para transporte, destinação social, aquisições operacionais, novas permissões ou retenção. As definições solicitadas na revisão anterior continuam pendentes.
- Se o navegador bloquear sessionStorage, as chaves só persistem enquanto a página permanece aberta. Após perda dessa memória, deve-se consultar o pedido antes de repetir uma operação incerta.

## Validação

Revisão estática dos diffs, caminhos, imports, parâmetros, correspondência de linhas e estados de erro/carregamento. Não foram executados aplicação, testes, build, lint, detector de interface ou inspeção visual em navegador, respeitando as restrições da sessão. Nenhuma garantia de execução foi inferida dessa revisão.

Sem novas dependências, migrations ou alterações em `.env`, `.yml`, Docker e IA. Sem commit, push ou pull. As mudanças dependem dos endpoints de back-end revisados anteriormente.
