# Catálogo público da bomboniere

Consulta de produtos avulsos implementada sem abrir as rotas administrativas de insumos. Frontend e implantação continuam pendentes; a migration `20261025_34_input_retail_publication.sql` precisa ser aplicada antes da implantação.

## Rotas sem autenticação

- `GET /api/locations/{localId}/snacks`
- `GET /api/locations/{localId}/snacks/{id}`

Unidade obrigatória no caminho; IDs string INT UNSIGNED. O detalhe tem a mesma regra de visibilidade da listagem e não retorna produto de outra unidade. Consulta sem cache, sujeita ao rate limit geral.

Listagem aceita `limit` (20 padrão, máximo 100), `cursor` (último ID da página anterior, exclusivo), `q` (trecho literal do nome), `category` (categoria exata conforme collation do banco) e `inStock` (`true`/`false`). Ordem crescente de ID; manter filtros ao paginar. `%`, `_`, `!` na pesquisa são texto, não curingas.

Retorno no envelope `{success, data, requestId}`; lista usa `{items, pagination:{limit,nextCursor}}`, detalhe retorna o produto:

```json
{
  "id":"1",
  "localId":"2",
  "name":"Pipoca",
  "description":"Porção individual",
  "category":"Comida",
  "publishedPrice":"12.50",
  "currency":"BRL",
  "inStock":true,
  "imageUrl":null,
  "purchaseKind":"INPUT"
}
```

## Visibilidade e estoque

O item precisa ter `venda_avulsa=true`, ser DISPONIVEL, pertencer a unidade ativa, ter fornecedor ativo, conta ativa do tipo FORNECEDOR e vínculo fornecedor/unidade ativo. Lista e detalhe aplicam essas condições diretamente no SQL.

Sem filtro inStock, inclui itens esgotados para exibição de indisponibilidade. `inStock` considera `quantidade - quantidade_reservada > 0`. Não expõe saldo exato, custos, estoque mínimo, dados de fornecedor/usuário ou reservas individuais. O indicador pode mudar até a compra; não representa reserva.

`imageUrl` usa a imagem PRINCIPAL da galeria existente, ou null. Imagens adicionais estão na rota pública já existente `/api/inputs/{id}/images`.

Este contrato usa o domínio INPUT já aceito por cotação/checkout. A marcação `venda_avulsa` separa produtos publicados de ingredientes internos. O padrão é **false**, inclusive para insumos existentes: nenhum é publicado automaticamente.

Para publicar, ADMIN ou o fornecedor proprietário autorizado usa `PATCH /api/inputs/{id}` com `{"venda_avulsa":true}`; para retirar, envia false. As demais regras de disponibilidade continuam obrigatórias. O cadastro também aceita o campo booleano.

Itens internos ficam ocultos no catálogo e na galeria pública, e não podem iniciar compras avulsas ou cotações de cliente. Continuam compondo combos, e ADMIN continua calculando seu preço. A retirada de publicação não cancela pedidos já reservados; estes seguem o pagamento/expiração existentes.

## Preço e compra

`publishedPrice` é `insumos.preco`, o preço cadastrado/publicado. O motor comercial pode recalcular valores segundo custos, parâmetros, promoção e plano, inclusive sinalizar divergência do catálogo. Por isso o campo não é anunciado como total final ou desconto aplicado.

Para comprar, o frontend mantém IDs e quantidade e usa o fluxo autenticado existente:

```json
{"localId":"2","lines":[{"kind":"INPUT","id":"1","quantity":1}]}
```

Enviar à cotação `POST /api/orders/quote`, apresentar o valor/contrato retornado e seguir `/api/orders/checkout` com aceite e Idempotency-Key conforme contrato. Pagamento permanece separado. Não copiar preços do navegador para determinar a cobrança.

Cadastro, preços e imagens continuam geridos pelas rotas privadas existentes; `/api/inputs` permanece restrita a ADMIN/FORNECEDOR. O catálogo não revela custos retornados pelos módulos comerciais internos.

## Erros e casos vazios

- Lista em unidade inexistente/inativa ou sem produtos: 200 com items vazio.
- Detalhe inexistente, oculto ou de outra unidade: 404.
- IDs, filtros, parâmetros desconhecidos/repetidos ou limites inválidos: 422.
- Infraestrutura indisponível: tratamento de erro comum; sem retorno demonstrativo.

## Arquivos e validação

- [Model](../backend/src/models/snackCatalogModel.js)
- [Service](../backend/src/services/snackCatalogService.js)
- [Controller](../backend/src/controllers/snackCatalogController.js)
- [Router](../backend/src/routes/snackCatalogRoutes.js)
- [Validators](../backend/src/validators/snackCatalogValidators.js)
- [Gerador OpenAPI](../backend/scripts/generateSnackCatalogOpenapi.js)
- [Testes](../backend/tests/snackCatalog.test.js)

Testes HTTP com persistência simulada e verificações de SQL cobrem paginação, filtros, unidade, campos públicos e visibilidade/estoque nas consultas. As regras existentes de produto e galeria também foram verificadas pela suíte. Ainda é necessário testar a consulta e seu plano de execução no MySQL real antes da implantação.
