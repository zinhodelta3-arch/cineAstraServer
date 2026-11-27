import { useId, useState } from 'react';
import { CreditCard, Film, HelpCircle, Ticket, UserRound } from 'lucide-react';
import ticketStyles from '@/components/cinema/ticket.module.css';
import styles from './support-cinema.module.css';

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

const topics = [
  { id: 'todos', label: 'Todos os assuntos', Icon: HelpCircle },
  { id: 'ingressos', label: 'Ingressos e sessões', Icon: Ticket, pattern: /ingress|sessa|sesso|assento|meia.entrada|classifica/ },
  { id: 'reembolso', label: 'Cancelamento e reembolso', Icon: CreditCard, pattern: /cancel|reembols|estorn|troc/ },
  { id: 'conta', label: 'Conta e acesso', Icon: UserRound, pattern: /conta|senha|login|cadastro|suporte/ },
  { id: 'streaming', label: 'Streaming e planos', Icon: Film, pattern: /streaming|assinatura|plano|alugar|aluguel|comprar um filme/ },
];

const topicPriority = [topics[2], topics[4], topics[1], topics[3]];
function questionTopic(question) {
  const text = normalize(question);
  return topicPriority.find(topic => topic.pattern.test(text))?.id;
}

function FaqItem({ item, open, onToggle, cinema }) {
  const id = useId();
  return (
    <div className={cinema ? styles.faqItem : open ? 'bg-muted/35' : undefined} data-open={open || undefined}>
      <button
        type="button"
        id={`${id}-button`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
        className={cinema ? styles.question : "flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring sm:px-4"}
      >
        <span className="min-w-0 break-words text-sm font-semibold sm:text-base">{item.question}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 motion-reduce:transition-none ${
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
        hidden={!open}
      >
          <p className="max-w-[75ch] whitespace-pre-wrap break-words px-3 pb-4 text-sm leading-6 text-muted-foreground sm:px-4">
            {item.answer}
          </p>
      </div>
    </div>
  );
}

export default function SupportFaq({ query = '', items = [], area, loading, error, retry, cinema = false }) {
  const [openItems, setOpenItems] = useState(() => new Set());
  const [filter, setFilter] = useState(null);

  const term = normalize(query);
  const questions = items.length ? items : area === 'streaming' ? [] : FAQ_ITEMS;
  const categorized = cinema ? questions.map(item => ({ ...item, topic: questionTopic(item.question) })) : questions;
  const activeTopics = cinema ? new Set(categorized.map(item => item.topic)) : null;
  const topic = cinema && filter?.query === query && activeTopics.has(filter.topic) ? filter.topic : 'todos';
  const filtered = categorized.filter(item =>
    (topic === 'todos' || item.topic === topic)
    && (!term || normalize(`${item.question} ${item.answer}`).includes(term)));

  const toggle = (question) =>
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(question)) next.delete(question);
      else next.add(question);
      return next;
    });

  if (cinema) return (
    <section id="support-faq" aria-labelledby="support-faq-title" className={`${styles.wrap} ${styles.faq}`}>
      <nav aria-label="Assuntos de suporte" className={styles.topics}>
        <h2 className={ticketStyles.title}>Assuntos</h2>
        <div className={styles.filters}>
          {topics.filter(item => item.id === 'todos' || activeTopics.has(item.id)).map(({ id, label, Icon }) => (
            <button type="button" key={id} className={styles.filter} aria-controls="support-faq-list"
              aria-pressed={id === topic} onClick={() => setFilter({ query, topic: id })}>
              <Icon size={16} aria-hidden="true" />{label}
            </button>
          ))}
        </div>
      </nav>
      <div className={styles.answers}>
        <div className={styles.faqHeading}>
          <h2 id="support-faq-title" className={ticketStyles.title}>Perguntas frequentes</h2>
          <p className="text-sm text-muted-foreground" role="status">{filtered.length} {filtered.length === 1 ? 'pergunta' : 'perguntas'}</p>
        </div>
        <div id="support-faq-list" className={styles.questions}>
          {filtered.map(item => <FaqItem key={item.question} item={item} cinema
            open={openItems.has(item.question)} onToggle={() => toggle(item.question)} />)}
          {!filtered.length && <p className="py-4 text-sm text-muted-foreground">
            Nenhuma pergunta encontrada. Tente outro termo ou selecione Todos os assuntos.
          </p>}
        </div>
      </div>
    </section>
  );

  return (
    <section id="support-faq" aria-labelledby="support-faq-title" className="mx-auto w-full max-w-[1120px]">
      <h2 id="support-faq-title" className="text-xl font-bold sm:text-2xl">Principais dúvidas</h2>

      {area === 'streaming' && loading ? (
        <p role="status" className="mt-4 text-sm text-muted-foreground">Carregando dúvidas do Streaming…</p>
      ) : area === 'streaming' && error ? (
        <div className="mt-4 text-sm" role="alert">Não foi possível carregar as dúvidas. <button type="button" className="min-h-10 font-semibold text-primary underline" onClick={retry}>Tentar novamente</button></div>
      ) : filtered.length === 0 ? (
        <p role="status" className="mt-4 text-sm text-muted-foreground">
          Nenhuma dúvida encontrada para esta pesquisa.
        </p>
      ) : (
        <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
          {filtered.map(item => (
            <FaqItem
              key={item.question}
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
