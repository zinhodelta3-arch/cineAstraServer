import { Ticket, Sparkles, Crown } from "lucide-react"

export const PLANS = [
  {
    id: "essencial", name: "Astra Essencial", tagline: "Para quem ama cinema e quer começar.", monthly: 19.90, annual: 199.00,
    icon: Ticket, accent: false, badge: "Para começar",
    benefits: [
      "Acesso ao catálogo de streaming",
      "1 ingresso de cinema grátis por mês",
      "10% de desconto em combos AstraSnack",
      "2 cupons de desconto por mês",
      "Aluguel avulso de títulos premium",
      "Compartilhamento com até 1 participante",
    ],
  },
  {
    id: "plus", name: "Astra Plus", tagline: "Mais vantagens para curtir todo mês.", monthly: 39.90, annual: 399.00,
    icon: Sparkles, accent: true, badge: "Mais escolhido",
    benefits: [
      "Todo o streaming incluído, sem anúncios",
      "2 ingressos de cinema grátis por mês",
      "1 combo médio grátis por mês",
      "20% de desconto em combos AstraSnack",
      "4 cupons de desconto por mês",
      "Compartilhamento com até 3 participantes",
    ],
  },
  {
    id: "max", name: "Astra Max", tagline: "A experiência completa, para dividir.", monthly: 69.90, annual: 699.00,
    icon: Crown, accent: false, badge: "Experiência completa",
    benefits: [
      "Todo o streaming incluído, sem anúncios",
      "4 ingressos de cinema grátis por mês, válidos para sessões de qualquer tipo, incluindo 3D e outras modalidades disponíveis",
      "1 combo médio grátis por mês",
      "30% de desconto em combos AstraSnack",
      "Cupons exclusivos e ofertas antecipadas",
      "Compartilhamento com até 5 participantes",
    ],
  },
]

export const FAQS = [
              ["O streaming está incluído em todos os planos?", "Sim. A proposta visual prevê acesso ao catálogo de streaming em todos os planos. Alguns títulos premium podem continuar disponíveis para aluguel avulso, conforme as regras que forem definidas."],
              ["Posso pagar mensal ou anualmente?", "Sim. Você pode alternar entre a opção mensal e anual na comparação de planos. Os preços apresentados são demonstrativos e precisam ser confirmados antes da publicação comercial."],
              ["Como funciona dividir o valor?", "O titular escolhe pagador único ou divisão igual. Na divisão igual, as cotas são recalculadas para o próximo ciclo após alterações nos participantes."],
              ["Posso cancelar ou sair do plano?", "A proposta prevê cancelamento pelo titular e saída individual por participantes. O direito de arrependimento em até 7 dias da contratação permite solicitar o reembolso integral do valor pago, conforme a legislação aplicável. Para outros cancelamentos, as regras serão informadas nos Termos do serviço."],
              ["Quais formas de pagamento estarão disponíveis?", "Cartão de crédito, débito automático e Pix Automático são opções previstas. A disponibilidade real depende da integração com o provedor de pagamento."],
            ]
