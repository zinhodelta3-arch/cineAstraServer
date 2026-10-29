# Integração de /cinema/parcerias

## Implementado

- `use-cinema-partnerships.js` consome `GET /api/partners?limit=12`, com paginação por cursor e estados de carregamento, erro/repetição e lista vazia.
- Categorias vêm de `tag`; o filtro considera somente os itens já carregados, como informado na tela.
- Componentes exibem título, resumo, descrição/condições, imagem, texto do botão e destino publicados. A listagem já fornece os detalhes necessários.
- Imagens são resolvidas pelo helper público existente; links permitem apenas caminhos internos ou HTTPS, sem execução de esquemas como javascript.
- A rota continua importando apenas o componente; a lógica de dados/filtro fica no hook.
- Foram retirados da renderização os destaques, marcas, benefícios e cupons fictícios. Os módulos de demonstração anteriores permanecem no repositório, sem uso nesta página.

## Contrato do backend

`promotionalRoutes → promotionalController → promotionalService → promotionalModel`, tipo `partners`.
A rota pública retorna apenas publicações ativas. Nenhuma rota administrativa é consultada.

A API de parcerias não possui campo de cupom, porcentagem ou elegibilidade estruturada. Não inferimos descontos a partir do texto nem criamos códigos. A aplicação de cupom depende da futura integração do checkout com `POST /api/pricing/quote` (pricingController/pricingModel). Abrir um link de parceiro não aplica desconto nem confirma compra.

## Validação

Build concluído; ESLint sem erros (dois avisos de imagem). Teste no navegador passou: falha/repetição, detalhes publicados, links seguros, paginação, filtro, layout móvel e lista vazia. Validação local com serviços simulados; não foi feita consulta ao banco de produção nem aplicação de cupom real.
