# Integração da página de filmes

`/cinema/filmes` mantém sua estrutura em componentes e hooks e passa a usar o catálogo público. Não modifica outras páginas, banco, Docker ou YAML.

## Fluxo

- `use-cinema-movies.js`: GET `/api/films?cinema=true&limit=20`, busca `titulo` com espera de 300 ms, filtro `genreId`, paginação por cursor e GET `/api/genres` paginado. Não envia filtros inventados ao backend.
- `use-movie-details.js`: GET `/api/films/{id}`, `/genres` e `/images`, com cancelamento ao fechar/trocar o filme e erros independentes para conteúdo complementar.
- `cinema-movies.mjs`: adapta campos da API, preserva IDs como strings, valida URLs de mídia e classifica estreia pela data civil de São Paulo. Sem data cadastrada, o filme fica em Em cartaz, seguindo a convenção existente da home.
- Detalhes mostram sinopse, duração, classificação, direção, gêneros, trailer quando disponível e galeria paginada.
- Consultar sessões reutiliza `SessionListModal`/`useHomeSessions` da home: cinemas, salas e sessões reais por local/data; horários explicitamente em UTC, conforme o contrato atual. Não cria reserva nem ingressos.

## Limites explícitos

Não existe status de pré-venda no catálogo, portanto essa aba foi removida. A API não aceita cinema/unidade como filtro de filmes; essa escolha ocorre na consulta de sessões. Em cartaz/Em breve são filtros da parte já carregada; quando há cursor, a tela informa que existem mais registros e mantém o botão Carregar mais, mesmo se a aba atual estiver vazia.

Não há filmes ou horários fictícios como fallback. Os dados antigos em `movies.js` permanecem fora do fluxo da página. Gêneros dos cartões não são inventados nem buscados individualmente para todos os itens: ficam disponíveis no filtro e nos detalhes. O checkout real será integrado na etapa de ingressos/assentos, sem transformar horários em reservas locais.

## Dependências e validação

Backend: catalogModel/Controller/Routes, filmGalleryModel/Controller/Routes; sessões usam venue e session. Requer API configurada, CORS e dados publicados/ativos. Testes de adaptação/consulta e teste de navegador com respostas controladas cobrem catálogo, cursor, abas, gênero, título, detalhe, sessões, vazio, erro/retentativa e largura mobile. Isso não confirma acesso ao Coolify nem dados de produção.
