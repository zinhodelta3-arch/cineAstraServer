"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ArrowUpRight, BookOpen, ChevronRight, Film, Heart, Info, Leaf, Users } from "lucide-react";
import ticketStyles from "@/components/cinema/ticket.module.css";
import styles from "./about.module.css";

const PAGINAS = [
  {
    id: "sobre",
    titulo: "Sobre a CineAstra",
    rotulo: "Nossa história",
    subtitulo: "Uma história que começou numa sala de aula",
    icon: Info,
    introducao: (
      <>
        <strong>
          Do projeto escolar à tela grande: o brilho da CineAstra.
        </strong>
      </>
    ),
    secoes: [
      {
        titulo: "Tudo começa com uma ideia",
        ampla: true,
        valores: false,
        conteudo: (
          <>
            <p>
              Nenhum grande filme nasce pronto. Primeiro vem uma ideia, depois
              um grupo de pessoas que acredita nela. A CineAstra nasceu assim:
              como um projeto escolar, movido pela curiosidade, pela vontade de
              aprender e por uma pergunta simples: e se o cinema pudesse ser de
              todo mundo?
            </p>
          </>
        ),
      },
      {
        titulo: "A inclusão como ponto de partida",
        ampla: false,
        valores: false,
        conteudo: (
          <>
            <p>
              Desde o primeiro dia, a inclusão esteve no centro da nossa
              história. Ela não foi um recurso adicionado com o tempo: foi o
              princípio que moldou cada decisão. Acreditamos que ninguém deveria
              ficar de fora de uma boa história por causa de dinheiro,
              localização, condição física ou falta de oportunidade. Esse
              pensamento, nascido entre colegas de sala de aula, ainda guia tudo
              o que fazemos.
            </p>
          </>
        ),
      },
      {
        titulo: "Do aprendizado às produções para o público",
        ampla: false,
        valores: false,
        conteudo: (
          <>
            <p>
              Com o tempo, o projeto cresceu. O que era um espaço de
              experimentação se transformou em produções voltadas ao público,
              com exibições, sessões e experiências pensadas para pessoas reais,
              com gostos, idades e realidades diferentes.
            </p>
          </>
        ),
      },
      {
        titulo: "A CineAstra de hoje",
        ampla: true,
        valores: false,
        conteudo: (
          <>
            <ul>
              <li>
                Sessões em diferentes locais, com ingressos acessíveis e
                organizados.
              </li>
              <li>
                Filmes para alugar ou comprar, para assistir no seu ritmo.
              </li>
              <li>Combos e insumos, para completar a experiência.</li>
              <li>Planos de assinatura, que podem ser compartilhados.</li>
              <li>
                Uma área de destinação social para consultar as iniciativas
                publicadas.
              </li>
            </ul>
          </>
        ),
      },
      {
        titulo: "Nossos valores",
        ampla: true,
        valores: true,
        conteudo: (
          <>
            <ul>
              <li>
                <strong>Inclusão:</strong> o cinema é para todos.
              </li>
              <li>
                <strong>Educação:</strong> aprender é a base de tudo o que
                somos.
              </li>
              <li>
                <strong>Respeito:</strong> ao público, às equipes e ao meio
                ambiente.
              </li>
              <li>
                <strong>Responsabilidade social:</strong> cada sessão pode fazer
                a diferença.
              </li>
              <li>
                <strong>Paixão pelo cinema:</strong> é o que nos move, desde o
                início.
              </li>
            </ul>
          </>
        ),
      },
    ],
    encerramento: (
      <>
        <strong>
          CineAstra: nascemos na escola, crescemos no cinema, e continuamos
          aprendendo com você.
        </strong>
      </>
    ),
  },
  {
    id: "objetivo",
    titulo: "Nosso Objetivo",
    rotulo: "Nosso objetivo",
    subtitulo: "Levar a magia do cinema a cada vez mais gente",
    icon: Film,
    introducao: (
      <>
        <strong>O cinema não é de poucos. É de todos.</strong>
      </>
    ),
    secoes: [
      {
        titulo: "Por que existimos",
        ampla: true,
        valores: false,
        conteudo: (
          <>
            <p>
              O cinema tem um jeito único de nos fazer rir, chorar, sonhar e
              entender o outro. Mas, por muito tempo, parte do público ficou
              distante dessa experiência, por preço, localização, falta de
              acessibilidade ou ausência de espaços culturais. A CineAstra
              existe para mudar isso. Nosso objetivo é aproximar o cinema das
              pessoas, em todos os cantos e de todas as formas possíveis.
            </p>
          </>
        ),
      },
      {
        titulo: "Ampliar o alcance da indústria cinematográfica",
        ampla: false,
        valores: false,
        conteudo: (
          <>
            <ul>
              <li>Chegar a regiões e comunidades pouco atendidas.</li>
              <li>
                Criar formas flexíveis de assistir, em sessões presenciais ou em
                casa.
              </li>
              <li>
                Oferecer opções que cabem em diferentes realidades e orçamentos,
                como meia-entrada e planos compartilháveis.
              </li>
              <li>
                Abrir portas para novos espectadores, novas vozes e novos
                talentos.
              </li>
            </ul>
          </>
        ),
      },
      {
        titulo: "Acessibilidade de verdade",
        ampla: false,
        valores: false,
        conteudo: (
          <>
            <p>
              Acessibilidade não é um detalhe: é uma condição para que o cinema
              cumpra seu papel. Trabalhamos para que todas as pessoas possam
              participar da experiência, com plataforma pensada para diferentes
              necessidades e atenção à inclusão nos espaços e nos serviços.
            </p>
          </>
        ),
      },
      {
        titulo: "Diversificar os espaços de arte, cultura e lazer",
        ampla: false,
        valores: false,
        conteudo: (
          <>
            <p>
              Acreditamos em espaços onde: Famílias, amigos e escolas possam se
              reunir; Novos realizadores encontrem público; A cultura seja
              experimentada, discutida e celebrada; O lazer seja acessível e
              acolhedor.
            </p>
          </>
        ),
      },
      {
        titulo: "Compromisso com o que está além da tela",
        ampla: false,
        valores: false,
        conteudo: (
          <>
            <p>
              Nosso objetivo não se resume ao entretenimento. Ele se conecta à
              educação, à sustentabilidade e à solidariedade, porque acreditamos
              que o cinema tem o poder de transformar quem assiste e o mundo ao
              redor. <strong>Sua história no cinema começa aqui.</strong>
            </p>
          </>
        ),
      },
    ],
  },
  {
    id: "sustentabilidade",
    titulo: "Projeto Sustentabilidade",
    rotulo: "Sustentabilidade",
    subtitulo: "O cinema que cuida do mundo fora da tela",
    icon: Leaf,
    introducao: (
      <>
        <strong>
          Toda grande história merece um final em que o planeta também saia
          ganhando.
        </strong>
      </>
    ),
    secoes: [
      {
        titulo: "Uma tela grande, uma responsabilidade maior",
        ampla: true,
        valores: false,
        conteudo: (
          <>
            <p>
              O cinema nos faz viajar para outros mundos, mas existe um que não
              podemos deixar de proteger: o nosso. Na CineAstra,
              sustentabilidade não é uma campanha passageira nem um selo colado
              no final. É uma forma de pensar e produzir, que começa no roteiro
              e vai até a última cadeira da sala.
            </p>
          </>
        ),
      },
      {
        titulo: "Produções pensadas desde a origem",
        ampla: false,
        valores: false,
        conteudo: (
          <>
            <ul>
              <li>
                <strong>Planejamento que evita desperdício:</strong> estruturas
                e materiais aproveitados ao máximo.
              </li>
              <li>
                <strong>Reaproveitamento:</strong> elementos de produções
                anteriores ganham nova vida.
              </li>
              <li>
                <strong>Fornecedores conscientes:</strong> parceiros
                comprometidos com práticas responsáveis.
              </li>
              <li>
                <strong>Redução de impacto:</strong> alternativas mais
                eficientes em cada etapa.
              </li>
            </ul>
          </>
        ),
      },
      {
        titulo: "Materiais melhores a cada temporada",
        ampla: false,
        valores: false,
        conteudo: (
          <>
            <p>
              A cada nova produção, ampliamos o uso de materiais recicláveis,
              reciclados e sustentáveis (copos, embalagens de combos, banners).
              Não prometemos perfeição, mas prometemos progresso: cada temporada
              será mais sustentável que a anterior.
            </p>
          </>
        ),
      },
      {
        titulo: "Ao lado de quem defende o planeta",
        ampla: false,
        valores: false,
        conteudo: (
          <>
            <p>
              Apoiamos iniciativas de preservação, educação ambiental e consumo
              consciente, e usamos nossa voz e nossos espaços para que esses
              temas cheguem a mais pessoas.
            </p>
          </>
        ),
      },
      {
        titulo: "Como você pode participar",
        ampla: false,
        valores: false,
        conteudo: (
          <>
            <ul>
              <li>Prefira os ingressos digitais (menos papel).</li>
              <li>
                Aproveite as opções de descarte correto em nossos espaços.
              </li>
              <li>Compartilhe o projeto com amigos.</li>
            </ul>
          </>
        ),
      },
    ],
    encerramento: <>A próxima cena é sustentável. Venha fazer parte dela.</>,
  },
  {
    id: "beneficentes",
    titulo: "Destinação social",
    rotulo: "Destinação social",
    subtitulo: "Iniciativas publicadas pelo CineAstra",
    icon: Heart,
    introducao: (
      <>
        Consulte as iniciativas, os beneficiários e as informações de
        acompanhamento disponíveis.
      </>
    ),
    secoes: [
      {
        titulo: "Conheça as iniciativas",
        ampla: true,
        valores: false,
        conteudo: (
          <>
            <p>
              Acesse a área de destinação social para consultar as iniciativas,
              os beneficiários e as informações de acompanhamento disponíveis.
            </p>
            <Link
              href="/cinema/destinacao-social"
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              Consultar destinação social
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </>
        ),
      },
    ],
  },
  {
    id: "trabalhe",
    titulo: "Trabalhe Conosco",
    rotulo: "Trabalhe conosco",
    subtitulo: "Venha fazer parte do elenco. Aqui, ninguém é figurante.",
    icon: Users,
    introducao: (
      <>
        Existem empregos que preenchem horários e trabalhos que preenchem de
        sentido. Na CineAstra, queremos que você viva a segunda opção.
      </>
    ),
    secoes: [
      {
        titulo: "Por que construir sua carreira na CineAstra",
        ampla: true,
        valores: false,
        conteudo: (
          <>
            <ul>
              <li>
                <strong>Propósito real:</strong> Seu trabalho apoia causas,
                educação e sustentabilidade.
              </li>
              <li>
                <strong>Ambiente inclusivo:</strong> Valorizamos as diferenças e
                a trajetória de cada um.
              </li>
              <li>
                <strong>Espaço para crescer:</strong> Incentivamos o aprendizado
                contínuo.
              </li>
              <li>
                <strong>Paixão:</strong> Cinema e cultura fazem parte da rotina.
              </li>
            </ul>
          </>
        ),
      },
      {
        titulo: "Onde você pode atuar",
        ampla: false,
        valores: false,
        conteudo: (
          <>
            <p>
              Atendimento, Operação de sessões, Logística, Tecnologia, Produção
              de conteúdo, Supervisão e Administração.
            </p>
          </>
        ),
      },
      {
        titulo: "Quem queremos ao nosso lado",
        ampla: false,
        valores: false,
        conteudo: (
          <>
            <p>
              Pessoas que gostem de servir o público, tenham vontade de
              aprender, valorizem o respeito e acreditem que a cultura
              transforma vidas. Você não precisa saber tudo sobre cinema, só
              precisa se importar com pessoas.
            </p>
          </>
        ),
      },
    ],
    encerramento: (
      <>
        <strong>
          A cena que falta é a sua. Cadastre seu currículo e entre para a equipe
          CineAstra.
        </strong>
      </>
    ),
  },
  {
    id: "escola",
    titulo: "Projeto Escolar",
    rotulo: "Projeto escolar",
    subtitulo: "Aprender também é uma grande sessão",
    icon: BookOpen,
    introducao: (
      <>
        <strong>
          Da sala de aula ao cinema: a educação está na origem de tudo o que
          somos.
        </strong>
      </>
    ),
    secoes: [
      {
        titulo: "Onde tudo começou",
        ampla: true,
        valores: false,
        conteudo: (
          <>
            <p>
              Antes de ser uma plataforma, a CineAstra foi uma ideia de sala de
              aula. Foi lá que nasceu nossa certeza de que a educação transforma
              vidas. Esta página homenageia a escola e reforça o quanto o ensino
              é importante.
            </p>
          </>
        ),
      },
      {
        titulo: "O cinema como ferramenta de aprendizado",
        ampla: false,
        valores: false,
        conteudo: (
          <>
            <p>
              Um filme ensina história sem decorar datas e mostra culturas sem
              sair do lugar. O cinema amplia o repertório, estimula debates,
              aproxima conteúdos da vida real e desenvolve o senso crítico.
            </p>
          </>
        ),
      },
      {
        titulo: "Meia-entrada: cultura ao alcance do estudante",
        ampla: false,
        valores: false,
        conteudo: (
          <>
            <p>
              Oferecemos o benefício da meia-entrada para estudantes
              regularmente matriculados. Basta selecionar a opção na compra e
              apresentar o documento válido (Carteira de Identificação
              Estudantil) no acesso à sala.
            </p>
          </>
        ),
      },
      {
        titulo: "Leve sua escola ao cinema",
        ampla: true,
        valores: false,
        conteudo: (
          <>
            <p>
              Professores e instituições podem organizar sessões para suas
              turmas. A CineAstra nasceu da educação e continuará ao lado dela.
            </p>
          </>
        ),
      },
    ],
  },
];

const defaultChapter = PAGINAS[0].id;

function readChapter() {
  const hash = window.location.hash.slice(1);
  return PAGINAS.some(chapter => chapter.id === hash) ? hash : defaultChapter;
}

function subscribeToChapter(update) {
  window.addEventListener("hashchange", update);
  window.addEventListener("popstate", update);
  return () => {
    window.removeEventListener("hashchange", update);
    window.removeEventListener("popstate", update);
  };
}

function navigateChapter(event, id) {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  event.preventDefault();
  if (window.location.hash === `#${id}`) return;
  window.history.pushState(null, "", `#${id}`);
  window.dispatchEvent(new Event("hashchange"));
}

export default function SobreNosPagina() {
  const activeChapter = useSyncExternalStore(subscribeToChapter, readChapter, () => defaultChapter);

  return (
    <main className={styles.page}>
      <header className={styles.feature}>
        <div className={styles.wrap}>
          <p className={styles.brand}><Film size={15} aria-hidden="true" /> CineAstra</p>
          <h1 className={ticketStyles.title}>Sobre <span>Nós</span></h1>
          <p className={styles.featureDescription}>Conheça a história, os valores e as iniciativas da CineAstra.</p>
        </div>
      </header>

      <div className={`${styles.wrap} ${styles.layout}`}>
        <nav className={styles.chapters} aria-label="Assuntos sobre a CineAstra">
          {PAGINAS.map(({ id, rotulo, icon: Icon }) => (
            <a key={id} href={`#${id}`} aria-controls={id}
              aria-current={activeChapter === id ? "true" : undefined} onClick={event => navigateChapter(event, id)}>
              <Icon size={18} aria-hidden="true" />
              <span>{rotulo}</span>
              <ChevronRight size={15} className={styles.chevron} aria-hidden="true" />
            </a>
          ))}
        </nav>

        <div className="min-w-0">
          {PAGINAS.map(({ id, titulo, subtitulo, icon: Icon, introducao, secoes, encerramento }) => (
            <section key={id} id={id} className={styles.chapter} hidden={activeChapter !== id} aria-labelledby={`titulo-${id}`}>
              <h2 id={`titulo-${id}`} className={`${ticketStyles.title} ${styles.chapterTitle}`}>{titulo}</h2>
              <p className={styles.subtitle}>{subtitulo}</p>
              <div className={styles.ticket}>
                <p>{introducao}</p>
                <div className={styles.stub} aria-hidden="true"><Icon /></div>
              </div>
              <div className={styles.content}>
                {secoes.map(({ titulo: heading, ampla, valores, conteudo }) => (
                  <section key={heading} className={styles.block} data-wide={ampla || undefined} data-values={valores || undefined}>
                    <h3>{heading}</h3>
                    {conteudo}
                  </section>
                ))}
              </div>
              {encerramento && <p className={styles.closing}>{encerramento}</p>}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
