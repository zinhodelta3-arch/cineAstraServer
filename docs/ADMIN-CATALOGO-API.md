# Admin — bloco de catálogo

Lacuna confirmada e implementada: listagem administrativa completa de combos. A revisão das rotas encontrou gestão já existente de filmes/gêneros, unidades/salas/assentos, sessões, insumos/equipamentos, galerias e preços. Essa constatação não significa que as telas estejam integradas ou que todas as operações tenham sido verificadas em produção.

## Nova listagem

`GET /api/admin/combos`

Exige Bearer token e ADMIN com sessão ativa. O service revalida a identidade na mesma transação da leitura. O detalhe existente `GET /api/admin/combos/{id}` também passou a fazer essa revalidação.

| Query opcional | Regra |
|---|---|
| `localId` | ID exato da unidade; omitido lista todas, inclusive legado sem unidade |
| `active` | Literal `true` ou `false`; omitido inclui ativos e arquivados |
| `q` | Trecho literal do nome, 1–150 caracteres após trim |
| `limit` | Padrão 20, máximo 100 |
| `cursor` | ID exclusivo da última linha da página anterior |

Filtros combinados por AND. IDs são strings INT UNSIGNED. Busca segue collation do banco; `%`, `_`, `!` são tratados como texto. Ordem por ID decrescente. Manter filtros ao paginar; trocar filtros exige reiniciar cursor. Não retorna contagem total.

Exemplo:

```text
GET /api/admin/combos?localId=1&active=false&q=pipoca&limit=20
```

Envelope `{success, data, requestId}`. `data` contém `items` e `pagination: {limit, nextCursor}`. Uma linha:

```json
{"id_combo":"2","id_local":"1","nome":"Pipoca","descricao":null,"preco":"15.00","ativo":false,"data_cadastro":"2026-10-25 12:00:00","itemCount":2}
```

`itemCount` é o número de linhas da composição, não a soma de unidades. A lista não expande a composição: usar o detalhe administrativo por ID para obter `items`. `id_local` e `data_cadastro` podem ser null em registros legados. Preço é string decimal; datas preservam o formato do módulo de combos.

A listagem inclui combos sem composição, arquivados, com local inativo ou insumos indisponíveis. `ativo: true` não garante elegibilidade de venda. A consulta pública `/api/combos` mantém os filtros de disponibilidade existentes.

## Gestão existente

- `GET /api/admin/combos/{id}`: detalhe/composição, inclusive arquivados.
- `POST /api/admin/combos`: criação.
- `PATCH /api/admin/combos/{id}`: edição permitida pelas regras de negócio.
- `PUT /api/admin/combos/{id}/items`: composição.
- `DELETE /api/admin/combos/{id}`: arquivamento lógico.

Combos referenciados em pedidos continuam protegidos contra alterações, e combos arquivados não ganham nova ação de reativação. Imagens permanecem no módulo de galeria comercial; preço final/cupom continua no módulo de precificação.

## Catálogos já encontrados

| Área | Router |
|---|---|
| Filmes e gêneros | [catalogRoutes.js](../backend/src/routes/catalogRoutes.js) |
| Unidades, salas, assentos | [venueRoutes.js](../backend/src/routes/venueRoutes.js) |
| Sessões | [sessionRoutes.js](../backend/src/routes/sessionRoutes.js) |
| Insumos e equipamentos | [productRoutes.js](../backend/src/routes/productRoutes.js) |
| Imagens de filmes e comerciais | [filmGalleryRoutes.js](../backend/src/routes/filmGalleryRoutes.js), [commerceGalleryRoutes.js](../backend/src/routes/commerceGalleryRoutes.js) |
| Preços, promoções, cupons | [pricingRoutes.js](../backend/src/routes/pricingRoutes.js) |

O catálogo público de produtos avulsos foi implementado posteriormente ([contrato](BOMBONIERE-PUBLICA-API.md)). Parceiros, experiências, banners e indicadores adicionais de dashboard continuam dependentes de definição de produto; não foram criados implicitamente neste bloco.

## Arquivos e validação

- [Model](../backend/src/models/comboModel.js)
- [Service](../backend/src/services/comboService.js)
- [Controller](../backend/src/controllers/comboController.js)
- [Router](../backend/src/routes/comboRoutes.js)
- [Validators](../backend/src/validators/comboValidators.js)
- [Gerador OpenAPI](../backend/scripts/generateComboOpenapi.js)
- [Testes administrativos](../backend/tests/adminCombo.test.js)

Sem migration nova. Testes cobrem paginação/filtros, legado, arquivados, autorização, SQL parametrizado e regressão das regras públicas/de edição. Consultas ainda precisam de validação em MySQL real. Frontend e implantação não fazem parte desta alteração.
