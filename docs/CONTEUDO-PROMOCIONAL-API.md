# Parceiros, experiências e banners

Módulo `promotional` implementado no backend. Integração das páginas e aplicação da migration 35 no MySQL continuam pendentes.

## Rotas

Para cada recurso `partners`, `experiences` e `banners`:

| Método e caminho | Acesso | Uso |
| --- | --- | --- |
| GET `/api/{recurso}` | Público | Listar ativos |
| GET `/api/{recurso}/{id}` | Público | Consultar ativo; oculto retorna 404 |
| GET `/api/admin/{recurso}` | ADMIN ativo | Listar ativos e rascunhos |
| GET `/api/admin/{recurso}/{id}` | ADMIN ativo | Consultar qualquer estado |
| POST `/api/admin/{recurso}` | ADMIN ativo | Criar, inativo por padrão |
| PATCH `/api/admin/{recurso}/{id}` | ADMIN ativo | Editar e publicar/desativar |

Listas retornam `{items,pagination:{limit,nextCursor}}` no envelope padrão `{success,data,requestId}`. Ordem de ID decrescente. `limit` padrão 20, máximo 100; `cursor` é o último ID da página anterior. Administração aceita `active=true/false`; público não aceita esse filtro. Banners aceitam `placement=cinema-home|streaming-home|astrasnack`. Não há exclusão física; desativar com `{"active":false}`. Preservar filtros ao paginar. Todas as respostas usam no-store.

## Campos

Comuns obrigatórios na criação: `slug` (até 100, letras minúsculas/números/hífens), `title` (150), `summary` (500). Slug único por recurso; duplicado retorna 409 `PROMOTIONAL_CONFLICT`.

Opcionais: `description` (5000), `imageUrl` (2048), `imageAlt` (200), `targetUrl` (2048), `ctaLabel` (80), `tag` (80), `active` (booleano, false por padrão). Campos opcionais de texto aceitam null para limpar. Texto simples, sem interpretação de HTML; frontend deve renderizar como texto.

Experiências também aceitam `priceLabel` (100), `unit` (150) e `details` (lista de até 20 textos de 250 caracteres). Banners exigem `placement` na criação. Campos desconhecidos ou exclusivos de outro recurso são rejeitados. PATCH exige ao menos um campo e preserva os demais.

URLs aceitam HTTPS sem credenciais ou caminhos internos iniciados por `/`. Não aceitam `//`, protocolo javascript, HTTP, espaços ou barras invertidas. O servidor não busca URLs nem faz upload; a política de imagens do frontend deve permitir as origens usadas.

Exemplo de criação: `POST /api/admin/experiences`

```json
{
  "slug":"sala-privativa",
  "title":"Uma sala só sua",
  "summary":"Sessões privadas para sua comemoração.",
  "priceLabel":"Sob consulta",
  "details":["Eventos privados","Consultar disponibilidade"],
  "targetUrl":"/cinema/experiencias",
  "active":false
}
```

Publicar com `PATCH /api/admin/experiences/{id}` e `{"active":true}`. Publicação não exige imagem: frontend precisa de estado sem imagem. Conteúdo começa vazio, sem dados fictícios ou conversão automática dos mocks.

## Integração e limites

- `/cinema/parcerias`: listar partners. Parceiros são editoriais, sem vínculo automático a fornecedores ou cupons. Descontos continuam validados pelo motor comercial.
- `/cinema/experiencias`: listar experiences. Preço exibido é texto promocional, não cotação. Solicitações/reservas de eventos ainda não são implementadas por este módulo.
- Home de cinema/streaming e astrasnack: listar banners pelo placement. Paginação por ID; não há agendamento, prioridade manual ou recomendação personalizada.
- Administração: criar páginas de gestão usando as rotas privadas. A autorização revalida ADMIN ativo e audita alterações na mesma transação; edição bloqueia a linha para preservar campos não alterados. Edições do mesmo campo seguem a última escrita.

Arquivos: `backend/src/{models,services,controllers,routes,validators}/promotional*.js`. Contrato em OpenAPI e gerador `backend/scripts/generatePromotionalOpenapi.js`. Testes em `backend/tests/promotional.test.js` usam persistência simulada e verificam SQL; não substituem execução no MySQL.

Migration: `database/migrations/20261026_35_promotional_content.sql`, incluída no plano do runner. Aplicar pelo procedimento existente antes de implantar. O snapshot `cineastra-install.sql` inclui as migrations até a 36 e serve somente para schema vazio. Nenhuma migration foi aplicada ao banco remoto nesta entrega.
