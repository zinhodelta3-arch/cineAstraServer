"use client";

import { useState } from "react";
import { Info, Leaf, Heart, Film, Users, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

/* ============ DADOS DO CONTEÚDO ============ */
const PAGINAS = [
  {
    id: "sobre",
    titulo: "Sobre a CineAstra",
    subtitulo: "Uma história que começou numa sala de aula",
    icon: Info,
    conteudo: (
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p><strong>Do projeto escolar à tela grande: o brilho da CineAstra.</strong></p>
        <h3 className="text-lg font-bold text-foreground">Tudo começa com uma ideia</h3>
        <p>Nenhum grande filme nasce pronto. Primeiro vem uma ideia, depois um grupo de pessoas que acredita nela. A CineAstra nasceu assim: como um projeto escolar, movido pela curiosidade, pela vontade de aprender e por uma pergunta simples: e se o cinema pudesse ser de todo mundo?</p>
        <h3 className="text-lg font-bold text-foreground">A inclusão como ponto de partida</h3>
        <p>Desde o primeiro dia, a inclusão esteve no centro da nossa história. Ela não foi um recurso adicionado com o tempo: foi o princípio que moldou cada decisão. Acreditamos que ninguém deveria ficar de fora de uma boa história por causa de dinheiro, localização, condição física ou falta de oportunidade. Esse pensamento, nascido entre colegas de sala de aula, ainda guia tudo o que fazemos.</p>
        <h3 className="text-lg font-bold text-foreground">Do aprendizado às produções para o público</h3>
        <p>Com o tempo, o projeto cresceu. O que era um espaço de experimentação se transformou em produções voltadas ao público, com exibições, sessões e experiências pensadas para pessoas reais, com gostos, idades e realidades diferentes.</p>
        <h3 className="text-lg font-bold text-foreground">A CineAstra de hoje</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Sessões em diferentes locais, com ingressos acessíveis e organizados.</li>
          <li>Filmes para alugar ou comprar, para assistir no seu ritmo.</li>
          <li>Combos e insumos, para completar a experiência.</li>
          <li>Planos de assinatura, que podem ser compartilhados.</li>
          <li>Campanhas beneficentes e projetos sustentáveis, que dão sentido a cada sessão.</li>
        </ul>
        <h3 className="text-lg font-bold text-foreground">Nossos valores</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Inclusão:</strong> o cinema é para todos.</li>
          <li><strong>Educação:</strong> aprender é a base de tudo o que somos.</li>
          <li><strong>Respeito:</strong> ao público, às equipes e ao meio ambiente.</li>
          <li><strong>Responsabilidade social:</strong> cada sessão pode fazer a diferença.</li>
          <li><strong>Paixão pelo cinema:</strong> é o que nos move, desde o início.</li>
        </ul>
        <p><strong>CineAstra: nascemos na escola, crescemos no cinema, e continuamos aprendendo com você.</strong></p>
      </div>
    )
  },
  {
    id: "objetivo",
    titulo: "Nosso Objetivo",
    subtitulo: "Levar a magia do cinema a cada vez mais gente",
    icon: Film,
    conteudo: (
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p><strong>O cinema não é de poucos. É de todos.</strong></p>
        <h3 className="text-lg font-bold text-foreground">Por que existimos</h3>
        <p>O cinema tem um jeito único de nos fazer rir, chorar, sonhar e entender o outro. Mas, por muito tempo, parte do público ficou distante dessa experiência, por preço, localização, falta de acessibilidade ou ausência de espaços culturais. A CineAstra existe para mudar isso. Nosso objetivo é aproximar o cinema das pessoas, em todos os cantos e de todas as formas possíveis.</p>
        <h3 className="text-lg font-bold text-foreground">Ampliar o alcance da indústria cinematográfica</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Chegar a regiões e comunidades pouco atendidas.</li>
          <li>Criar formas flexíveis de assistir, em sessões presenciais ou em casa.</li>
          <li>Oferecer opções que cabem em diferentes realidades e orçamentos, como meia-entrada e planos compartilháveis.</li>
          <li>Abrir portas para novos espectadores, novas vozes e novos talentos.</li>
        </ul>
        <h3 className="text-lg font-bold text-foreground">Acessibilidade de verdade</h3>
        <p>Acessibilidade não é um detalhe: é uma condição para que o cinema cumpra seu papel. Trabalhamos para que todas as pessoas possam participar da experiência, com plataforma pensada para diferentes necessidades e atenção à inclusão nos espaços e nos serviços.</p>
        <h3 className="text-lg font-bold text-foreground">Diversificar os espaços de arte, cultura e lazer</h3>
        <p>Acreditamos em espaços onde: Famílias, amigos e escolas possam se reunir; Novos realizadores encontrem público; A cultura seja experimentada, discutida e celebrada; O lazer seja acessível e acolhedor.</p>
        <h3 className="text-lg font-bold text-foreground">Compromisso com o que está além da tela</h3>
        <p>Nosso objetivo não se resume ao entretenimento. Ele se conecta à educação, à sustentabilidade e à solidariedade, porque acreditamos que o cinema tem o poder de transformar quem assiste e o mundo ao redor. <strong>Sua história no cinema começa aqui.</strong></p>
      </div>
    )
  },
  {
    id: "sustentabilidade",
    titulo: "Projeto Sustentabilidade",
    subtitulo: "O cinema que cuida do mundo fora da tela",
    icon: Leaf,
    conteudo: (
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p><strong>Toda grande história merece um final em que o planeta também saia ganhando.</strong></p>
        <h3 className="text-lg font-bold text-foreground">Uma tela grande, uma responsabilidade maior</h3>
        <p>O cinema nos faz viajar para outros mundos, mas existe um que não podemos deixar de proteger: o nosso. Na CineAstra, sustentabilidade não é uma campanha passageira nem um selo colado no final. É uma forma de pensar e produzir, que começa no roteiro e vai até a última cadeira da sala.</p>
        <h3 className="text-lg font-bold text-foreground">Produções pensadas desde a origem</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Planejamento que evita desperdício:</strong> estruturas e materiais aproveitados ao máximo.</li>
          <li><strong>Reaproveitamento:</strong> elementos de produções anteriores ganham nova vida.</li>
          <li><strong>Fornecedores conscientes:</strong> parceiros comprometidos com práticas responsáveis.</li>
          <li><strong>Redução de impacto:</strong> alternativas mais eficientes em cada etapa.</li>
        </ul>
        <h3 className="text-lg font-bold text-foreground">Materiais melhores a cada temporada</h3>
        <p>A cada nova produção, ampliamos o uso de materiais recicláveis, reciclados e sustentáveis (copos, embalagens de combos, banners). Não prometemos perfeição, mas prometemos progresso: cada temporada será mais sustentável que a anterior.</p>
        <h3 className="text-lg font-bold text-foreground">Ao lado de quem defende o planeta</h3>
        <p>Apoiamos iniciativas de preservação, educação ambiental e consumo consciente, e usamos nossa voz e nossos espaços para que esses temas cheguem a mais pessoas.</p>
        <h3 className="text-lg font-bold text-foreground">Como você pode participar</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Prefira os ingressos digitais (menos papel).</li>
          <li>Aproveite as opções de descarte correto em nossos espaços.</li>
          <li>Compartilhe o projeto com amigos.</li>
        </ul>
        <p>A próxima cena é sustentável. Venha fazer parte dela.</p>
      </div>
    )
  },
  {
    id: "beneficentes",
    titulo: "Campanhas Beneficentes",
    subtitulo: "Cada ingresso tem um segundo final feliz",
    icon: Heart,
    conteudo: (
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p><strong>Quando você assiste a um filme na CineAstra, a história não termina na tela.</strong></p>
        <h3 className="text-lg font-bold text-foreground">O cinema que emociona e transforma</h3>
        <p>Parte do valor de cada compra é direcionada a campanhas beneficentes. Ao escolher um filme, você ajuda a levar cuidado, dignidade e oportunidade a quem mais precisa.</p>
        <h3 className="text-lg font-bold text-foreground">Como funciona</h3>
        <p>É simples e não exige nenhum passo extra. Uma parcela do preço pago em ingressos é destinada a campanhas sociais. As campanhas variam para alcançar diversas causas.</p>
        <h3 className="text-lg font-bold text-foreground">Causas que apoiamos</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Cuidado médico de crianças:</strong> Acompanhamento e tratamento.</li>
          <li><strong>Pessoas com deficiência:</strong> Ações de autonomia, acessibilidade e dignidade.</li>
          <li><strong>Pessoas em estado crítico:</strong> Suporte para situações delicadas de saúde.</li>
          <li><strong>Educação em artes no Brasil:</strong> Projetos que levam cultura a escolas e comunidades.</li>
        </ul>
        <h3 className="text-lg font-bold text-foreground">Por que fazemos isso</h3>
        <p>Acreditamos que uma empresa de cultura deve devolver cultura e cuidado à sociedade. Nada mais justo do que usar o que construímos juntos para ajudar a escrever finais melhores. Assista. Emocione-se. Transforme vidas.</p>
      </div>
    )
  },
  {
    id: "trabalhe",
    titulo: "Trabalhe Conosco",
    subtitulo: "Venha fazer parte do elenco. Aqui, ninguém é figurante.",
    icon: Users,
    conteudo: (
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>Existem empregos que preenchem horários e trabalhos que preenchem de sentido. Na CineAstra, queremos que você viva a segunda opção.</p>
        <h3 className="text-lg font-bold text-foreground">Por que construir sua carreira na CineAstra</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Propósito real:</strong> Seu trabalho apoia causas, educação e sustentabilidade.</li>
          <li><strong>Ambiente inclusivo:</strong> Valorizamos as diferenças e a trajetória de cada um.</li>
          <li><strong>Espaço para crescer:</strong> Incentivamos o aprendizado contínuo.</li>
          <li><strong>Paixão:</strong> Cinema e cultura fazem parte da rotina.</li>
        </ul>
        <h3 className="text-lg font-bold text-foreground">Onde você pode atuar</h3>
        <p>Atendimento, Operação de sessões, Logística, Tecnologia, Produção de conteúdo, Supervisão e Administração.</p>
        <h3 className="text-lg font-bold text-foreground">Quem queremos ao nosso lado</h3>
        <p>Pessoas que gostem de servir o público, tenham vontade de aprender, valorizem o respeito e acreditem que a cultura transforma vidas. Você não precisa saber tudo sobre cinema, só precisa se importar com pessoas.</p>
        <p><strong>A cena que falta é a sua. Cadastre seu currículo e entre para a equipe CineAstra.</strong></p>
      </div>
    )
  },
  {
    id: "escola",
    titulo: "Projeto Escolar",
    subtitulo: "Aprender também é uma grande sessão",
    icon: BookOpen,
    conteudo: (
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p><strong>Da sala de aula ao cinema: a educação está na origem de tudo o que somos.</strong></p>
        <h3 className="text-lg font-bold text-foreground">Onde tudo começou</h3>
        <p>Antes de ser uma plataforma, a CineAstra foi uma ideia de sala de aula. Foi lá que nasceu nossa certeza de que a educação transforma vidas. Esta página homenageia a escola e reforça o quanto o ensino é importante.</p>
        <h3 className="text-lg font-bold text-foreground">O cinema como ferramenta de aprendizado</h3>
        <p>Um filme ensina história sem decorar datas e mostra culturas sem sair do lugar. O cinema amplia o repertório, estimula debates, aproxima conteúdos da vida real e desenvolve o senso crítico.</p>
        <h3 className="text-lg font-bold text-foreground">Meia-entrada: cultura ao alcance do estudante</h3>
        <p>Oferecemos o benefício da meia-entrada para estudantes regularmente matriculados. Basta selecionar a opção na compra e apresentar o documento válido (Carteira de Identificação Estudantil) no acesso à sala.</p>
        <h3 className="text-lg font-bold text-foreground">Leve sua escola ao cinema</h3>
        <p>Professores e instituições podem organizar sessões para suas turmas. A CineAstra nasceu da educação e continuará ao lado dela.</p>
      </div>
    )
  }
];

/* ============ ESTILOS DE BACKGROUND ============ */
function BackgroundStyles() {
  return (
    <style>{`
      .house-bg {
        background: radial-gradient(circle at center, color-mix(in oklab, var(--primary) 10%, transparent) 0%, transparent 70%),
                    repeating-linear-gradient(45deg, var(--muted) 0, var(--muted) 2px, transparent 2px, transparent 8px);
      }
    `}</style>
  );
}

export default function SobreNosPagina() {
  const [abaAtiva, setAbaAtiva] = useState(PAGINAS[0].id);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center pt-24 pb-20 px-4 overflow-hidden relative">
      <BackgroundStyles />

      {/* Título Principal */}
      <div className="text-center mb-10 z-10">
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight mb-4">
          Sobre <span className="text-primary">Nós</span>
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Conheça a história, os valores e o universo da CineAstra.
        </p>
      </div>

      {/* CONTAINER PRINCIPAL (A "Casa" aberta) */}
      <div className="relative w-full max-w-6xl z-20 flex flex-col md:flex-row min-h-[700px] rounded-3xl border-4 border-border shadow-2xl overflow-hidden bg-card house-bg">
        
        {/* Menu Lateral (Abas) */}
        <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r border-border/50 bg-background/80 backdrop-blur-sm p-4 overflow-y-auto flex-shrink-0 flex flex-col gap-2">
          {PAGINAS.map((pagina) => (
            <button
              key={pagina.id}
              onClick={() => setAbaAtiva(pagina.id)}
              className={cn(
                "flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl transition-all font-semibold text-sm",
                abaAtiva === pagina.id 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "hover:bg-muted text-muted-foreground"
              )}
            >
              <pagina.icon className="w-5 h-5 shrink-0" />
              {pagina.titulo}
            </button>
          ))}
        </aside>

        {/* Conteúdo Principal (Área de Leitura) */}
        <main className="flex-1 p-6 md:p-12 overflow-y-auto bg-card/95 backdrop-blur-md">
          {PAGINAS.map((pagina) => (
            <div 
              key={pagina.id} 
              className={cn("max-w-3xl", abaAtiva === pagina.id ? "block animate-in fade-in slide-in-from-bottom-4 duration-500" : "hidden")}
            >
              <span className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 text-primary mb-6">
                <pagina.icon className="w-8 h-8" />
              </span>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground mb-2">
                {pagina.titulo}
              </h2>
              <p className="text-lg font-medium text-primary mb-8 border-b border-border/50 pb-4">
                {pagina.subtitulo}
              </p>
              
              {/* Corpo do Texto */}
              {pagina.conteudo}
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}