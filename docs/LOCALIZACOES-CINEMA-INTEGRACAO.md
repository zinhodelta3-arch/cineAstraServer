# Integração de cinemas e programação

A página `/cinema/localizacoes` usa dados públicos reais, com componentes em `components/cinema/localizacoes` e lógica em `hooks/cinema/localizacoes`.

- Lista: `GET /api/locations?limit=20`, paginação por cursor, pesquisa local por nome/endereço/bairro/cidade/estado/CEP. A interface informa quando há mais registros para carregar; a pesquisa abrange a parte carregada.
- Seleção: `GET /api/locations/{id}` confirma o cinema e mostra seu endereço/telefone. Como chegar usa endereço real; copiar endereço informa sucesso ou falha.
- Salas: `GET /api/locations/{id}/rooms?limit=100`, com paginação, nome, tipo e capacidade reais.
- Programação: `GET /api/sessions?localId={id}&date={data}&limit=20`, paginada, mais `GET /api/films/{id}` para os filmes distintos da parte carregada. Títulos são buscados por IDs reais; falhas não inventam conteúdo e podem ser repetidas.
- Datas e horários seguem UTC, explicitamente indicado na interface. Exibe início e fim reais, inclusive data de término quando passa da meia-noite, idioma, status e preço de inteira.

A API de locais não fornece imagem, tipo cinema/cine-teatro, horário de abertura ou comodidades; esses dados fictícios foram retirados. Sem fotos, a lista usa um ícone neutro de localização. A antiga grade demonstrativa foi substituída por sessões individuais com sala e intervalo reais, evitando misturar salas ou inventar durações. Os dados de demonstração de `data.js` não são fonte de cinemas/filmes/horários; estilos de classificação continuam reutilizados.

A consulta não cria reserva. Links que levavam ao checkout demonstrativo foram retirados; compra/assentos serão conectados na etapa própria, com IDs reais e cotação do backend. A integração das demais páginas permanece fora deste escopo.

Validação: lint dos arquivos alterados, build de produção, testes de adaptação de endereço e navegador com API controlada para paginação, pesquisa, seleção, salas/filmes, troca de cinema/data, vazio, erro/retentativa e mobile. Não é validação do banco ou Coolify de produção.
