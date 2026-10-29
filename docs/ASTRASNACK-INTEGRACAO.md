# Integração AstraSnack

`/cinema/astrasnack` consulta o catálogo real por cinema. Lógica em `use-astra-snack.js`, adaptação em `lib/api/snack-products.mjs`, componentes separados. Não modifica backend ou migrations.

## Leitura pública

- Cinemas: GET `/api/locations`, paginado.
- Avulsos: GET `/api/locations/{localId}/snacks`; detalhe em `/{id}`. Usa somente produtos publicados para venda avulsa, nunca a listagem administrativa de insumos.
- Combos: GET `/api/combos?localId=...`; detalhe `/api/combos/{id}`, incluindo composição. O detalhe confere se o local ainda corresponde ao selecionado.
- Galerias: GET `/api/inputs/{id}/images` ou `/api/combos/{id}/images`, com paginação e retentativa.
- Categorias Todos/Produtos avulsos/Combos e pesquisa filtram a parte carregada. A interface mantém paginação independente dos dois catálogos.

Os banners com ofertas fictícias e as grades reservadas foram removidos do fluxo. Não existe estoque quantitativo público: avulsos usam `inStock`; combos não afirmam estoque disponível sem confirmação no checkout. Erros não se tornam catálogo fictício.

## Cotação e carrinho

A cotação requer login. O navegador chama POST `/api/snacks/quote` no frontend; esse handler valida origem/cookie, aceita apenas INPUT/COMBO e quantidade de 1 a 100 e encaminha para POST `/api/pricing/quote` com Bearer no servidor. A resposta pública contém somente preço unitário, total, data e possibilidade de prosseguir; custos/parâmetros internos não são expostos.

A inclusão fica bloqueada sem cotação atual, em erro, quando `finalizable=false` ou quando o avulso está sem estoque. Alterar quantidade invalida a cotação anterior e inicia outra. Visitantes consultam o catálogo e recebem um link para login.

O carrinho continua sendo rascunho local. Seu ID distingue local/tipo/produto e conserva `sourceId`, `localId` e `purchaseKind` para o checkout futuro. O preço incluído vem da cotação, não do campo publicado do catálogo. Adicionar não reserva estoque nem confirma pagamento; checkout deve recotar o conjunto completo, validar cinema, preço, benefícios, cupom e disponibilidade. Carrinhos antigos de demonstração não são convertidos em compras reais.

## Validação

Testes de adaptação verificam separação de IDs e disponibilidade. Build/lint e navegador com API controlada verificam consulta, detalhe, composição, avulso esgotado, troca de cinema, erro/retentativa, mobile e inclusão no carrinho. O handler Next de cotação é exercitado de verdade contra um servidor isolado: 401 sem cookie, 403 para outra origem, 422 para categoria inválida e cotação válida sem expor custos. Não foram realizadas cobranças nem alterações no banco do Coolify.
