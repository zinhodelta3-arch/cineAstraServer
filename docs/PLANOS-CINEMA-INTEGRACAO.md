# Integração de /cinema/planos

A página mantém componentes em `components/cinema/planos` e comportamento em `hooks/cinema/planos/use-cinema-plans.js`. O arquivo de rota apenas importa o componente.

## Implementado

- Catálogo público paginado em `GET /api/plans`: nome, descrição, preços mensal/anual e benefícios publicados. Estados de carregamento, vazio, erro e nova tentativa.
- Resumo contratual em `POST /api/subscriptions/summary`, solicitado explicitamente por cliente autenticado.
- Exibição da empresa, termos, privacidade, total e condições retornados pelo backend. Aceite explícito do hash da oferta.
- `POST /api/subscriptions` cria contrato com pagamento pelo titular. Renovação automática é opcional e começa desmarcada.
- Chave de idempotência por usuário/oferta reutilizada nas tentativas. Armazenada na sessão da aba quando disponível, com fallback em memória. Não há repetição automática do POST.
- Consulta paginada em `GET /api/subscriptions/me`, com atualização manual e estado real.
- Troca de plano, período ou renovação invalida o resumo e o aceite anterior. Troca de usuário invalida a oferta.
- Chamadas privadas passam por `/api/plans/[action]` no Next: token do cookie HttpOnly, validação de origem nos POSTs, campos permitidos e ausência de cache. A autorização e verificação de idade continuam no backend.

O serviço `backendAuth` recebeu somente uma opção para enviar `Idempotency-Key`; chamadas existentes mantêm o comportamento anterior.

## Backend envolvido

`planRoutes → planController → planService → planModel`.
O resumo usa `contentService.planContract` e `contentModel` para documentos oficiais. A criação grava assinatura/cobrança; a ativação depende do fluxo de pagamentos.

## Limites e próximos passos

Pagamento de assinaturas, participantes/convites, divisão igual, cancelamento e resgate de combo ainda não foram ligados à interface. A página informa essa limitação antes da confirmação, inclusive que um contrato pendente impede nova contratação. Não redireciona para o checkout de demonstração nem anuncia pagamento/benefícios confirmados.

Blocos de demonstração de compartilhamento, benefícios fixos e FAQ não são renderizados. Seus arquivos permanecem disponíveis, sem envio fictício de convite.

É necessário publicar planos com preço/custo válidos e documentos oficiais business/terms/privacy. Sem esses requisitos, a API impede o contrato; não há fallback para documentos locais. CLIENTE e elegibilidade de idade são exigidos pelo backend.

## Validação

- `node --test frontend/tests/plan-subscription.test.mjs`: opções permitidas, rejeição de preço/usuário enviados pelo cliente e exigência do aceite.
- ESLint dos arquivos alterados: sem erros; aviso existente de imagem no hero.
- Build de produção concluído.
- Navegador com serviços isolados: bloqueio sem autenticação/origem válida, aceite obrigatório, repetição após resposta perdida com a mesma chave, estado pendente, invalidação da oferta e layout móvel. Nenhuma assinatura foi criada em produção.
- Validação de produção/Coolify e contratação com provedor real não realizadas.
