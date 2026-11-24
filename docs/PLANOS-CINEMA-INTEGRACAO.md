# Planos e assinaturas do CineAstra

O catálogo apresenta três categorias de benefícios, Básico, Essencial e Plus. Cada uma oferece Individual (1 pessoa), Dupla (2) e Família (até 4), contando o titular. O backend calcula o total com os preços-base publicados e acrescenta R$ 10 por mês ou R$ 100 por ano por vaga extra. Contratos existentes conservam o preço e a capacidade assinados.

## Contratação e perfil

- O catálogo usa `GET /api/plans`. A cotação em `POST /api/subscriptions/summary` vincula categoria, modalidade, periodicidade, renovação, pagamento e benefícios ao hash da oferta. A confirmação exige aceite e uma chave de idempotência. A primeira cobrança é do titular.
- O perfil em `/cinema/perfil/assinatura` reúne benefícios do ciclo, cobranças, trocas, convites e compartilhamento. O titular convida uma conta de cliente pelo e-mail cadastrado. A vaga fica reservada por sete dias ou até o fim do ciclo pago, o que ocorrer primeiro.
- O grupo pode usar pagamento pelo titular ou divisão igual. Participações e mudanças aprovadas de rateio afetam as cotas do próximo ciclo. Cada membro acessa as próprias cobranças.
- A troca de categoria, modalidade ou periodicidade mantém o ciclo atual. O novo contrato entra em vigor após a confirmação da cobrança seguinte.

## Administração

- Alterações em descontos, catálogo ou combo ficam disponíveis em novas ofertas. Para assinantes atuais, os benefícios são registrados na emissão do próximo ciclo e aplicados após a confirmação das cotas, preservando o preço contratado. Trocas já aceitas usam a oferta aceita pelo titular.
- A administração pode propor uma troca. O titular confere a oferta no perfil e precisa aceitá-la para agendar o novo contrato. Retomar a renovação exige autorização registrada na contratação.
- O encerramento administrativo desliga a renovação, encerra convites pendentes e cancela cobranças abertas de ciclos futuros. Titular e participantes mantêm os benefícios até o último dia pago. Pagamentos e histórico ficam disponíveis.
- A revogação de acesso avulso ao Streaming bloqueia novas autorizações para aquele registro. O pedido permanece no histórico. A limpeza automática de registros aguarda uma política de retenção.

A migração `20261123_66_subscription_management.sql` atualiza instalações existentes. O arquivo `cineastra-install.sql` contempla a mesma estrutura para um banco vazio.
