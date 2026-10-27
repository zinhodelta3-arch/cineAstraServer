# Indicadores do dashboard

`GET /api/admin/reports/dashboard?from=2026-10-01&to=2026-10-30&localId=1`

Somente ADMIN ativo. Datas obrigatórias, inclusivas, em UTC; máximo 93 dias. `localId` opcional limita todas as consultas à unidade. Parâmetros desconhecidos, datas inválidas, IDs inválidos e períodos maiores retornam 422. Resposta no envelope padrão, com Cache-Control no-store e sem dados pessoais. Local sem registros retorna agregados vazios, não 404.

## Conteúdo de data

| Campo | Uso no dashboard |
| --- | --- |
| sales.tickets | Card de ingressos vendidos |
| sales.ticketSalesValue | Valor dos itens de ingresso, em reais |
| daily | Barras de ingressos e linha de valor por dia, incluindo dias zerados |
| ticketTypes | Pizza por INTEIRA, MEIA, ISENTA e UNKNOWN (legado sem tipo) |
| occupancy | Sessões, sessões encerradas, capacidade acumulada, lugares confirmados e ocupação ponderada |
| rooms | Ocupação por sala, com id/localId/name |
| topMovies | Até 10 filmes por número de ingressos; inclui valor e título |
| period/localId/currency/notes | Contexto e regras de interpretação |

Contagens são strings inteiras e dinheiro é string decimal com duas casas, sem arredondamento por float. Percentuais são números arredondados a duas casas, null quando não há denominador. Salas limitadas às primeiras 100 por ID, com `roomsTruncated`; totais de occupancy cobrem todas. Top de filmes desempata por ID. Percentuais arredondados podem somar 99,99 ou 100,01.

## O que os números significam

Vendas: itens com sessão em pedidos cuja **primeira captura** ocorreu no período. Pagamentos APROVADO/PARCIALMENTE_ESTORNADO/ESTORNADO comprovam a captura. Agrupamento prévio por pedido impede duplicar ingressos quando há duas capturas. Subtotal cadastrado dos itens determina o valor; não multiplica preço atual nem presume preço médio de R$30. Pedidos mistos contribuem somente com itens de ingresso. A quantidade não significa presença física.

O valor é histórico bruto dos itens, sem deduzir reembolsos ou ratear descontos/taxas adicionais do pedido. Inclui itens capturados depois estornados/cancelados. **Não é caixa líquido nem lucro.** Para caixa/estornos, usar `/api/admin/reports/finance`. Não há rateio confiável de estornos por item neste relatório.

Ocupação: estado atual dos assentos CONFIRMADA de sessões com data no período, excluindo sessões CANCELADA; reservas temporárias não contam. Divide total confirmado pela soma da capacidade de cada sala por sessão, não pela média simples de percentuais. Usa capacidade atual; não reconstrói mapa histórico. Uma sessão sem vendas também participa do denominador. “Sessões realizadas” conta exclusivamente status ENCERRADA; horário passado não comprova realização. Vendas são filtradas pela captura, ocupação pela data de sessão: os totais não precisam coincidir.

Sem dados: valores/contagens zero, listas de salas/filmes vazias e percentuais null. Nenhum dado demonstrativo é devolvido. Consultas são executadas na transação existente do serviço; garantias de snapshot seguem o isolamento configurado no MySQL.

## Integração pendente no frontend

`frontend/src/hooks/use-dashboard.js` deverá buscar o relatório; a página permanece demonstrativa nesta entrega. Agrupar daily em blocos de cinco dias, se desejado, somando valores monetários em centavos. Exibir estado vazio sem dividir por zero. Tratar erro de API separadamente de resultado vazio. Remover cálculo artificial `ingressos * 30` e trocar a fatia “Promocional” por tipos reais. Preferir o rótulo “Valor dos ingressos vendidos” ao apresentar ticketSalesValue.

A programação de próximas sessões já usa o domínio session: integrar `GET /api/sessions` conforme os filtros do OpenAPI. Não deriva do período passado do dashboard.

Arquivos: `backend/src/{models,services,controllers,routes,validators}/dashboard*.js`. Rotas registradas no app; contrato no OpenAPI e `backend/scripts/generateDashboardOpenapi.js`. Testes `backend/tests/dashboard.test.js` cobrem autorização, filtros, séries vazias, precisão, paginação limitada de salas e estrutura SQL contra duplicação de vendas.

Não há migration nova. As tabelas de pagamentos, sessões, itens e ocupação devem estar atualizadas pelas migrations existentes. Validação real de SQL/plano de execução no MySQL alvo continua pendente; o agregado de primeira captura percorre o histórico de pagamentos, então avaliar índices e volume antes de uso intenso. Não foi aplicado nada ao banco remoto.
