export const streamingHelp = [
    {
        pattern: /\b(?:legendas?|dublad[oa]s?|dublagem|idiomas?|audio)\b/,
        question: 'Como mudo o idioma ou ativo as legendas?',
        answer: 'Durante a reprodução, abra o menu de áudio ou legendas do player. As opções aparecem quando há faixas disponíveis. Se estiver vendo um trailer, use Legendas ou Configurações no player do YouTube.'
    },
    {
        pattern: /\b(?:cobrancas?|faturas?|renovacao|renovar|pagamentos?|cobrad[oa])\b/,
        question: 'Onde acompanho cobranças e renovação?',
        answer: 'No Cinema, abra Planos e consulte Sua assinatura. A página mostra o ciclo, o estado das cobranças e a renovação. Se houver uma cobrança pendente para a sua conta, use a opção de pagamento exibida ali.'
    },
    {
        pattern: /\b(?:compartilhar|compartilhamento|convites?|convidar|participantes?|divisao|dividir|dupla|familia)\b/,
        question: 'Como compartilho uma assinatura?',
        answer: 'No Cinema, abra Planos e acesse Sua assinatura. Se a modalidade permitir e houver vaga, o titular pode enviar um convite. O convidado precisa entrar na própria conta e aceitar. Na divisão igual, o titular paga a primeira cobrança e a divisão começa nos próximos ciclos.'
    },
    {
        pattern: /\b(?:perfis?|perfil|avatar|lista|historico|progresso|continuar)\b/,
        question: 'Onde ficam os perfis, a lista e o progresso?',
        answer: 'No Streaming, abra Minha CineAstra para encontrar Minha lista e Continuar assistindo. Use o menu da conta para acessar Perfis. Convites de assinatura são tratados no Cinema, em Planos.'
    },
    {
        pattern: /\b(?:pip|miniplayer|minimizar|maximizar|tela cheia|reproducao|reproduzir|assistir|travando|player|video|trailer)\b/,
        question: 'Como assisto a um filme ou uso o miniplayer?',
        answer: 'No catálogo do Streaming, selecione um filme e escolha Assistir ou Continuar. No player, use o controle de tela cheia ou o miniplayer. O PiP depende do navegador e do tipo de vídeo. Se aparecer apenas o trailer, confira a disponibilidade do título e o acesso da sua assinatura.'
    },
    {
        pattern: /\b(?:planos?|assinaturas?|acesso|assinar|cancelar|cancelamento)\b/,
        question: 'Como contrato, consulto ou encerro minha assinatura?',
        answer: 'No Cinema, abra Planos para comparar benefícios e modalidades. Em Sua assinatura, você pode consultar o status e gerenciar a renovação. Se desativar a renovação, o acesso segue até o fim do ciclo pago.'
    },
    {
        pattern: /\b(?:suporte|chamados?|protocolos?|atendimento)\b/,
        question: 'Onde acompanho um chamado do Streaming?',
        answer: 'No Streaming, abra Suporte e vá até Atendimento da sua conta. Em Meus chamados, selecione o protocolo para ler as respostas ou enviar uma nova mensagem.'
    }
];

export const streamingFaq = streamingHelp.map(({question,answer})=>({question,answer}));
