# Integração de /cinema/suporte

## Fluxos implementados

- FAQ público: `GET /api/content/faq`, pesquisa nas perguntas e respostas publicadas. Sem fallback para respostas fictícias.
- Cliente autenticado: abertura e listagem paginada de chamados, detalhe e histórico paginado, envio de mensagens assíncronas e encerramento com confirmação quando o chamado está RESOLVIDO.
- Nova mensagem em chamado resolvido segue a regra do backend de reabertura; chamados FECHADOS não mostram formulário de resposta.
- Histórico ordenado da mensagem mais antiga à mais recente. Botão para carregar as próximas mensagens e atualização manual da conversa.
- Assistente: `POST /api/assistant/messages`; resposta identificada como IA. A indisponibilidade do provedor aparece explicitamente. Cada pergunta é independente, sem promessa de histórico de conversa para a IA.
- Encaminhamento explícito da pergunta respondida para `POST /api/assistant/handoff`, exibindo o protocolo real e impedindo novo clique após sucesso.
- Visitantes consultam o FAQ e recebem link para login. O espaço de atendimento exige conta CLIENTE; trocar de usuário desmonta o espaço anterior.

## Organização

- `support-center.jsx`: composição e sessão.
- `support-faq.jsx`, `support-workspace.jsx`, `support-assistant.jsx`: apresentação.
- `use-support-center.js`: FAQ e pesquisa.
- `use-support-resource.js`: leitura privada, cursor, cancelamento e invalidação dos resultados anteriores.
- `use-support-workspace.js`: formulários, seleção do chamado, operações e assistente.
- `/api/support/[[...path]]`: proxy restrito aos endpoints utilizados, sem encaminhamento genérico nem rotas administrativas. Cookie HttpOnly, validação de origem nos POSTs e respostas sem cache. A API valida papel e propriedade do chamado.

## Mapeamento

| Uso | Model | Controller | Router |
|---|---|---|---|
| Abrir/listar/detalhar chamado; histórico; enviar mensagem; fechar | supportModel | supportController | supportRoutes |
| FAQ publicado | contentModel | contentController | contentRoutes |
| Pergunta à IA | Sem model próprio; assistantService/provider | contentController | contentRoutes |
| Encaminhamento humano | supportModel via supportService | contentController | contentRoutes |

## Limites

O atendimento é assíncrono com atualização manual. Operações LIVE e gestão administrativa não estão expostas nesta página. Encerramento exige resolução prévia pelo atendente.

Os POSTs não possuem idempotência no contrato atual do backend. A interface bloqueia cliques simultâneos e não repete automaticamente requisições. Se a resposta se perder, orienta atualizar os chamados antes de reenviar.

O provedor de IA e o FAQ precisam estar configurados/publicados no servidor. Não foram alterados backend, Docker ou arquivos YAML. Não foram criados chamados em produção.

## Validação

- Build de produção concluído; ESLint sem erros (aviso de imagem existente no cabeçalho).
- Três testes de validação do proxy: rotas permitidas, IDs/cursor, limites de texto e bloqueio de campos de autoria/modo LIVE.
- Navegador com backend isolado: autenticação/origem, FAQ e pesquisa, abertura, histórico paginado, mensagem, confirmação de encerramento, IA indisponível, encaminhamento humano, layout móvel e visitante sem acesso aos formulários.
- Integração em Coolify e provedor real de IA não verificados.
