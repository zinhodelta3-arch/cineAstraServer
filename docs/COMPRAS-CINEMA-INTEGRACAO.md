# Integração de /cinema/minhascompras

## Implementado

- Histórico real em `GET /api/orders`, com paginação por cursor. Busca pelo número e filtro financeiro aplicados aos pedidos carregados, conforme indicado na tela.
- Modal de detalhe consulta `GET /api/orders/{id}`, mostra estado financeiro/operacional e andamento dos itens disponíveis.
- Ingressos/códigos de retirada consultados em `GET /api/orders/{id}/tickets`, com paginação, estado, validade e cópia do código real. Nenhum QR ou código fictício é gerado.
- Consulta explícita do contrato aceito em `GET /api/orders/{id}/receipt`: itens contratados, valores e documentos disponíveis. O proxy remove custos e parâmetros internos de precificação.
- Download textual de resumo com dados reais, identificado como sem valor fiscal. Não equivale a comprovante de pagamento ou estorno.
- Cancelamento de pedido AGUARDANDO_PAGAMENTO com confirmação explícita e `Idempotency-Key` reutilizada na repetição dentro do modal. O backend decide se as reservas podem ser liberadas; não há repetição automática.
- Visitantes recebem link para login; o histórico exige CLIENTE. Troca de usuário desmonta o histórico anterior. Leituras são canceladas quando mudam/fecham os recursos.
- Datas exibidas no fuso de Brasília.

## Organização

Página importa `PurchaseHistory`; componentes em `components/purchases`, lógica em `hooks/cinema/minhascompras`. Proxy restrito em `/api/purchases/[[...path]]`, cookie HttpOnly e sem cache. POST de cancelamento valida origem, ID, chave de idempotência e corpo vazio. Não encaminha rotas de pagamento/admin.

| Uso | Model | Controller | Router |
|---|---|---|---|
| Lista/estado | orderModel | orderController | orderRoutes |
| Cancelamento pendente | orderModel + checkoutService | orderController | orderRoutes |
| Ingressos | ticketModel | ticketController | ticketRoutes |
| Contrato aceito | contentModel | contentController | contentRoutes |

## Limites e próximas integrações

A listagem retorna ID, total, estado e data, sem título do filme, pôster, cinema ou assento. Os detalhes operacionais também usam identificadores. A página não inventa esses dados nem filtra por cinema/streaming sem informação do backend.

Assinaturas ficam em `/cinema/planos`; o histórico de pedidos não lista assinaturas.

Reembolso exige `POST /api/payments/{paymentId}/refunds` e consulta `GET /api/refunds/{id}`. A API de pedidos ainda não retorna paymentId/refundId nem oferece listagem desses vínculos para o cliente. Essa parte permanece pendente; a interface encaminha ao suporte com o número do pedido. Cancelar não é tratado como reembolso confirmado.

Contratos ausentes e pedidos antigos sem documento mostram indisponibilidade; não há fallback fictício. A integração não altera backend nem arquivos Docker/YAML.

## Validação

Testes locais de validação de IDs/rotas, remoção dos custos do contrato e linguagem do resumo de cancelamento. Build e ESLint concluídos sem erros. Produção/Coolify não verificados.

Teste no navegador com serviços isolados concluído: autenticação/origem, erro e nova tentativa, paginação/filtro, ingressos reais da fixture, contrato sem custos internos, download, cancelamento confirmado e repetição com mesma chave após resposta perdida, layout móvel, estado vazio e visitante. Nenhum pedido de produção foi alterado.
