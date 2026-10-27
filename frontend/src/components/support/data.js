import { CalendarDays, CreditCard, Film, Gift, KeyRound, MapPin, Popcorn, ShieldCheck, Ticket, UsersRound } from "lucide-react";

export const categories = [
  {
    id: "ingressos",
    label: "Ingressos",
    icon: Ticket,
    questions: [
      {
        q: "Como comprar meu ingresso?",
        a: "Escolha o filme, cinema, data e horário da sessão. Depois selecione os assentos, escolha o tipo de ingresso e conclua o pagamento. O ingresso fica disponível na sua conta após a confirmação da compra.",
      },
      {
        q: "Onde encontro meus ingressos?",
        a: "Depois de fazer login, acesse a área de pedidos da sua conta. Seus ingressos ficam vinculados às compras realizadas pelo CineAstra e podem ser consultados antes da sessão.",
      },
      {
        q: "Posso alterar o cinema, horário ou assento depois da compra?",
        a: "A alteração depende das regras da compra e da disponibilidade da nova sessão. Quando a troca direta não estiver disponível, pode ser necessário cancelar a compra elegível e realizar uma nova.",
      },
    ],
  },
  {
    id: "cancelamento",
    label: "Cancelamento",
    icon: CalendarDays,
    questions: [
      {
        q: "Posso cancelar meu ingresso?",
        a: "Sim, quando a compra estiver dentro das regras de cancelamento do CineAstra. O prazo e as condições são informados no momento da compra e podem variar conforme o tipo de pedido.",
      },
      {
        q: "Como faço para cancelar uma compra?",
        a: "Entre na sua conta, abra seus pedidos, selecione a compra e procure pela opção de cancelamento. Se a opção não estiver disponível, o pedido pode estar fora do prazo ou não ser elegível para cancelamento.",
      },
      {
        q: "Quando recebo o reembolso?",
        a: "Depois que o cancelamento for confirmado, o prazo de estorno depende do meio de pagamento e da instituição financeira. O CineAstra exibirá a confirmação do cancelamento na sua conta.",
      },
    ],
  },
  {
    id: "login",
    label: "Seu login",
    icon: KeyRound,
    questions: [
      {
        q: "Esqueci minha senha. O que faço?",
        a: "Na página de login, clique em “Esqueci minha senha” e informe o e-mail da sua conta. Siga as instruções enviadas para criar uma nova senha.",
      },
      {
        q: "Esqueci o e-mail que usei no cadastro. E agora?",
        a: "Se você não conseguir identificar o e-mail da conta, procure o suporte do CineAstra com os dados necessários para confirmar sua identidade. Não compartilhe sua senha com ninguém.",
      },
      {
        q: "Posso alterar meus dados cadastrais?",
        a: "Sim. Quando essa função estiver disponível na sua área de conta, você poderá revisar e atualizar seus dados pessoais. Algumas alterações podem exigir uma confirmação de segurança.",
      },
    ],
  },
  {
    id: "classificacao",
    label: "Classificação indicativa",
    icon: UsersRound,
    questions: [
      {
        q: "Onde vejo a classificação indicativa de um filme?",
        a: "A classificação indicativa aparece nas informações de cada filme no CineAstra. Confira essa informação antes de comprar o ingresso.",
      },
      {
        q: "O que significa a classificação indicativa?",
        a: "Ela orienta sobre a faixa etária recomendada para o conteúdo do filme. As regras de acesso de crianças e adolescentes seguem a legislação brasileira e podem exigir acompanhamento ou autorização em determinadas situações.",
      },
      {
        q: "Menores de idade podem assistir a qualquer filme?",
        a: "Não. A entrada depende da classificação do filme e das regras legais aplicáveis à idade do espectador. Em caso de dúvida, confira a classificação indicada na página do filme e as orientações oficiais.",
      },
    ],
  },
  {
    id: "promocoes",
    label: "Promoções",
    icon: Gift,
    questions: [
      {
        q: "Onde encontro as promoções do CineAstra?",
        a: "As promoções disponíveis aparecem nos canais oficiais do CineAstra. Cada oferta informa seu período de validade, cinemas participantes e condições de utilização.",
      },
      {
        q: "Posso usar mais de uma promoção na mesma compra?",
        a: "Isso depende das regras de cada campanha. Algumas promoções não são cumulativas com outros descontos, benefícios ou tipos de ingresso.",
      },
      {
        q: "Por que uma promoção não aparece para mim?",
        a: "Verifique se sua conta atende aos critérios da campanha, se o cinema e a sessão participam e se a promoção ainda está dentro do período de validade.",
      },
    ],
  },
  {
    id: "reserva",
    label: "Reserva de eventos",
    icon: MapPin,
    questions: [
      {
        q: "Posso reservar uma sala para um evento?",
        a: "O CineAstra pode disponibilizar reservas para eventos, sessões especiais e experiências em grupo. Consulte a área de eventos ou entre em contato com o suporte para verificar disponibilidade.",
      },
      {
        q: "Como solicito uma reserva para um grupo?",
        a: "Informe a quantidade aproximada de pessoas, cinema desejado, data, horário e tipo de evento. A disponibilidade depende da programação e da capacidade da sala.",
      },
    ],
  },
  {
    id: "snack",
    label: "AstraSnack",
    icon: Popcorn,
    questions: [
      {
        q: "Posso comprar snacks junto com meu ingresso?",
        a: "Sim. Quando disponível para a sessão escolhida, você pode adicionar produtos do AstraSnack ao pedido antes de finalizar a compra.",
      },
      {
        q: "Como retiro meu pedido do AstraSnack?",
        a: "Apresente o código ou comprovante do pedido no balcão do AstraSnack do cinema selecionado. O pedido deve ser retirado conforme as condições exibidas no momento da compra.",
      },
    ],
  },
  {
    id: "pagamento",
    label: "Pagamentos",
    icon: CreditCard,
    questions: [
      {
        q: "Quais formas de pagamento posso usar?",
        a: "As formas de pagamento disponíveis são apresentadas na etapa final da compra. A disponibilidade pode variar conforme o canal e o tipo de produto.",
      },
      {
        q: "O pagamento foi aprovado, mas não recebi o ingresso.",
        a: "Primeiro confira seus pedidos e o e-mail cadastrado. Se o pagamento tiver sido aprovado e o pedido não aparecer, evite realizar uma segunda compra e procure o suporte com o comprovante da transação.",
      },
    ],
  },
  {
    id: "salas",
    label: "Salas e tecnologias",
    icon: Film,
    questions: [
      {
        q: "Onde vejo informações sobre as salas?",
        a: "Na página do cinema e durante a escolha da sessão você poderá consultar os formatos disponíveis, como salas especiais e tecnologias de exibição.",
      },
      {
        q: "O que faço se tiver um problema durante a sessão?",
        a: "Procure imediatamente um integrante da equipe do cinema. Para problemas relacionados à compra, pagamento ou conta, registre também a ocorrência pelo suporte do CineAstra.",
      },
    ],
  },
  {
    id: "privacidade",
    label: "Privacidade e dados",
    icon: ShieldCheck,
    questions: [
      {
        q: "Como o CineAstra utiliza meus dados?",
        a: "Os dados são utilizados de acordo com a Política de Privacidade do CineAstra, para finalidades como criação da conta, processamento de pedidos, atendimento e funcionamento dos serviços.",
      },
      {
        q: "Como posso solicitar informações sobre meus dados?",
        a: "Você pode entrar em contato pelos canais de atendimento indicados pelo CineAstra para exercer os direitos previstos na legislação de proteção de dados.",
      },
    ],
  },
];
