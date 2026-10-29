import { useMemo, useState } from 'react';

const FAQ_ITEMS = [
  {
    question: 'Como crio minha conta?',
    answer:
      'Toque em "Entrar" e escolha "Criar conta". Informe seus dados, incluindo o CPF, e confirme o cadastro pelo código enviado ao seu e-mail ou celular. Cada CPF pode ter apenas uma conta.',
  },
  {
    question: 'Esqueci minha senha. O que faço?',
    answer:
      'Na tela de login, toque em "Esqueci minha senha" e siga as instruções enviadas ao seu e-mail. Se não receber, confira a caixa de spam.',
  },
  {
    question: 'Como compro ingressos?',
    answer:
      'Escolha o filme, o local e o horário da sessão, marque os assentos, selecione o tipo de ingresso e finalize o pagamento. O ingresso fica disponível em "Meus ingressos".',
  },
  {
    question: 'Quem tem direito à meia-entrada?',
    answer:
      'Os beneficiários previstos em lei, como estudantes, idosos e pessoas com deficiência. É preciso apresentar um documento que comprove o direito na entrada da sessão.',
  },
  {
    question: 'Posso cancelar ou trocar meu ingresso?',
    answer:
      'Sim, conforme a nossa política de cancelamento e troca. Acesse "Meus ingressos", selecione o ingresso e veja as opções disponíveis. O estorno é feito na forma de pagamento original.',
  },
  {
    question: 'Qual a diferença entre alugar e comprar um filme?',
    answer:
      'No aluguel, você assiste ao filme por um período limitado. Na compra, o filme fica na sua biblioteca para assistir quando quiser, enquanto estiver no catálogo.',
  },
  {
    question: 'Posso compartilhar minha assinatura?',
    answer:
      'Sim, nos planos que permitem. Você convida as pessoas e escolhe se uma só paga o valor total ou se o valor é dividido igualmente entre todos.',
  },
  {
    question: 'Como falo com o suporte?',
    answer:
      'Entre na sua conta e acesse "Atendimento da sua conta" para abrir chamados, consultar respostas e usar a assistente.',
  },
];

const normalize = (text = '') =>
  text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

function FaqItem({ item, id, open, onToggle }) {
  return (
    <div
      className={`overflow-hidden rounded-xl border bg-card transition-colors duration-300 ${
        open ? 'border-primary/60' : 'border-border hover:border-primary/40'
      }`}
    >
      <button
        type="button"
        id={`${id}-button`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between gap-4 px-5 py-3.5 text-left transition-colors duration-200 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="text-base font-semibold sm:text-lg">{item.question}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={`h-5 w-5 shrink-0 text-primary transition-transform duration-300 ease-out motion-reduce:transition-none ${
            open ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-button`}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <p className="whitespace-pre-wrap break-words px-5 pb-4 text-sm leading-6 text-muted-foreground sm:text-base">
            {item.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SupportFaq({ query = '' }) {
  const [openItems, setOpenItems] = useState(() => new Set());

  const filtered = useMemo(() => {
    const term = normalize(query);
    if (!term) return FAQ_ITEMS;
    return FAQ_ITEMS.filter((item) =>
      normalize(`${item.question} ${item.answer}`).includes(term)
    );
  }, [query]);

  const toggle = (question) =>
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(question)) next.delete(question);
      else next.add(question);
      return next;
    });

  return (
    <section className="mx-auto w-full max-w-[1120px] rounded-2xl border border-border bg-card p-6 sm:p-10">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-primary">
          Central CineAstra
        </p>
        <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Principais dúvidas</h2>
      </div>

      {filtered.length === 0 ? (
        <p role="status" className="mt-8 text-center">
          Nenhuma dúvida encontrada para esta pesquisa.
        </p>
      ) : (
        <div className="mx-auto mt-8 flex w-full max-w-5xl flex-col gap-3">
          {filtered.map((item, index) => (
            <FaqItem
              key={item.question}
              id={`faq-${index}`}
              item={item}
              open={openItems.has(item.question)}
              onToggle={() => toggle(item.question)}
            />
          ))}
        </div>
      )}
    </section>
  );
}