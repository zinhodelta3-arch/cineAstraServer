# Integração de /cinema/carrinho

Etapa de cotação conectada a POST /api/orders/quote (orderRoutes → orderController → orderService/orderModel, pricingService/pricingModel e contentService).

O rascunho continua no carrinho local. Produtos INPUT/COMBO adicionados pelo AstraSnack enviam apenas identificadores, quantidades, cinema e cupom. O backend valida disponibilidade, estoque, elegibilidade, preços e condições. O proxy autenticado /api/cart/quote valida origem e formato e devolve somente valores públicos, sem custos/parâmetros internos.

A tela distingue estimativa local de valor cotado. Alterar itens, quantidades, cinema, cupom ou usuário invalida imediatamente a cotação. Itens duplicados do mesmo produto são agregados; quantidades limitadas a 100, até 50 produtos diferentes. Produtos de cinemas diferentes ou itens antigos sem vínculo real impedem cotação.

Componentes mantidos em components/cinema/carrinho; lógica no hook use-cinema-cart. Consulta explícita evita chamadas a cada tecla.

## Pendências

Ingressos/assentos e streaming ainda precisam produzir itens com seus identificadores reais. Finalização, aceite contratual e POST /orders/checkout ficam para a integração de pagamento. O botão antigo que encaminhava para o fluxo demonstrativo foi substituído pela cotação; nenhum pedido/reserva/pagamento é criado nesta etapa.

O carrinho é um rascunho local do navegador e não é persistido por usuário no backend. Cotação exige CLIENTE e verifica a elegibilidade da conta atual. Documentos oficiais precisam estar publicados, pois /orders/quote também gera resumo contratual.

Nenhuma alteração em Docker/YAML ou backend. Sem commit/push.

Validação: build concluído; ESLint sem erros (aviso de imagem). Testes de validação de quantidades/cinema/IDs/agregação e navegador com backend isolado passaram, incluindo preço do servidor e invalidação por quantidade/cupom. Produção não verificada.
