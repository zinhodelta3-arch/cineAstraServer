# Integração de experiências

`/cinema/experiencias` usa GET `/api/experiences?limit=12` com cursor e GET `/api/experiences/{id}` para o detalhe selecionado. O hook `use-cinema-experiences.js` coordena lista, seleção, detalhe, sessão e formulário; os componentes mantêm a apresentação.

Títulos, resumos, descrição, imagens, tags, preço textual, unidade, detalhes e links vêm do conteúdo publicado. URLs de imagem/CTA passam pelos helpers seguros. Preços e depoimentos demonstrativos não são usados no fluxo integrado. A introdução visual continua editorial, sem anunciar modalidades não publicadas. O link de suporte aponta para `/cinema/suporte`.

## Solicitação real, sem reserva automática

O formulário envia experiência, data desejada, quantidade de pessoas/veículos e descrição. A identidade vem da sessão; não solicita nome e contato duplicados. Só CLIENTE pode enviar.

POST `/api/experiences/inquiry` no Next:

1. Valida origem, cookie HttpOnly, tamanho e campos (data civil válida, não passada; quantidade inteira 1–100.000; descrição 10–4.000 caracteres).
2. Consulta GET `/api/users/me` para a role e GET `/api/experiences/{id}` para confirmar publicação e obter o título verdadeiro.
3. Cria POST `/api/support` com assunto/mensagem, sem expor o token no navegador.
4. Retorna HTTP 201 e número do chamado somente após confirmação do backend.

Não existe rota de reserva de eventos nesse contrato. O texto confirma apenas a abertura de um chamado; disponibilidade e preço final dependem do atendimento. O link publicado de cada experiência pode direcionar a cinemas, programação ou outro destino permitido pelo cadastro; não há vínculo estruturado de experiência com sala/sessão que permita deduzir uma reserva.

O envio bloqueia cliques repetidos durante a requisição, preserva campos em erro e não tenta POST automaticamente. O backend de suporte não oferece idempotência neste contrato; se a conexão cair após criar o chamado, conferir no suporte antes de reenviar. A interface geral de acompanhamento de suporte ainda será integrada na sua própria etapa; o protocolo é mostrado para referência.

## Validação

Testes de campos, lint e build. Navegador com catálogo controlado e handler Next real conectado a upstream isolado: lista/detalhe, erro/retentativa, visitante, CLIENTE, criação HTTP 201 e protocolo; 401/403/422 sem abrir chamado; viewport mobile. Não criou chamados no Coolify nem confirmou providers de produção.
