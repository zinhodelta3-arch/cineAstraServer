"use client";
import React, { useState, useMemo, useEffect } from "react";
import {
  Film, Ticket, CalendarDays, MapPin, Clock3, Megaphone, Handshake, ArrowRight, ArrowUpRight,
  Share2, Check, Users, Trees, Theater, Bell, Popcorn, Mail, Clapperboard, Info, X,
  Newspaper, CircleDot, UserRound, Radio,
} from "lucide-react";

/* ============ DADOS ============ */
/* ATENÇÃO: confirme data, horários e detalhes do evento antes de publicar.
   Tudo o que muda fica concentrado aqui no topo. */
const EVENTO = {
  filme: "Vingadores: Doomsday",
  local: "Parque Linear de São Caetano do Sul",
  data: "Sáb, 14 Nov",   // ← CONFIRMAR
  abertura: "18:00",     // ← CONFIRMAR
  inicio: "19:30",       // ← CONFIRMAR
  entrada: "Gratuita",   // ← CONFIRMAR
};

const EDICAO = "22 de outubro de 2026";
const AUTOR = "Equipe CineAstra";

const CATEGORIAS = ["Todas", "Parcerias", "Transmissões", "Comunidade", "Avisos"];

const NOTICIAS = [
  {
    id: "n-1",
    categoria: "Parcerias",
    data: "22 Out 2026",
    leitura: "3 min",
    icon: Trees,
    titulo: "CineAstra firma parceria com o Parque Linear de São Caetano do Sul",
    resumo: "Acordo vai levar cinema, cultura e lazer para dentro do parque, aproximando a telona de quem vive e frequenta a cidade.",
    corpo: [
      "O CineAstra anuncia uma parceria com o Parque Linear de São Caetano do Sul. A iniciativa nasce com o objetivo de levar atividades de cinema e cultura para um dos espaços de convivência da cidade.",
      "A primeira ação conjunta será a exibição ao ar livre de Vingadores: Doomsday, aberta à comunidade. Novas atividades poderão ser anunciadas conforme a parceria avançar.",
      "Acompanhe este mural: todas as novidades, mudanças de programação e orientações ao público serão publicadas aqui em primeira mão.",
    ],
  },
  {
    id: "n-2",
    categoria: "Transmissões",
    data: "22 Out 2026",
    leitura: "4 min",
    icon: Clapperboard,
    titulo: `${EVENTO.filme} será exibido ao ar livre no parque`,
    resumo: `Sessão especial no ${EVENTO.local}. Leve cadeira, manta e a vizinhança toda.`,
    corpo: [
      `A transmissão de ${EVENTO.filme} acontecerá no ${EVENTO.local}, com tela montada ao ar livre e a estrutura de som do CineAstra.`,
      `Os portões abrem às ${EVENTO.abertura} e a sessão começa às ${EVENTO.inicio}. Entrada: ${EVENTO.entrada.toLowerCase()}. Recomendamos chegar com antecedência para escolher bem o lugar no gramado.`,
      "Haverá bomboniere no local, com pipoca e bebidas. Em caso de chuva ou qualquer mudança, o novo plano será divulgado neste mural e nas redes do CineAstra.",
    ],
    destaque: true,
  },
  {
    id: "n-3",
    categoria: "Parcerias",
    data: "Em andamento",
    leitura: "2 min",
    icon: Theater,
    titulo: "CineAstra conversa com teatros e cinemas da região",
    resumo: "Objetivo é montar uma rede cultural local, com programação conjunta e benefícios entre parceiros.",
    corpo: [
      "Além do Parque Linear, o CineAstra está em conversas com teatros e cinemas da região para formar uma rede cultural integrada.",
      "A ideia é compartilhar programação, criar sessões especiais e oferecer vantagens ao público que circula entre os espaços parceiros.",
      "Os nomes serão divulgados assim que as parcerias forem confirmadas.",
    ],
  },
  {
    id: "n-4",
    categoria: "Avisos",
    data: "Antes do evento",
    leitura: "2 min",
    icon: Info,
    titulo: "Guia do público: o que levar e o que esperar da sessão ao ar livre",
    resumo: "Chegada, bomboniere, clima e acessibilidade: tudo o que você precisa saber antes de ir.",
    corpo: [
      "Leve cadeira de praia, manta ou almofada e, se quiser, um agasalho: à noite a temperatura costuma cair.",
      "A bomboniere do CineAstra estará no local. Confira as orientações do parque sobre alimentos e bebidas trazidos de casa.",
      "Dúvidas sobre acessibilidade ou acesso ao local? Fale com a gente pelo cadastro de avisos no fim da página.",
    ],
  },
  {
    id: "n-5",
    categoria: "Comunidade",
    data: "Contínuo",
    leitura: "1 min",
    icon: Users,
    titulo: "Seu bairro, sua sessão: indique filmes para as próximas exibições",
    resumo: "Queremos ouvir a comunidade para escolher os próximos títulos e locais.",
    corpo: [
      "O CineAstra quer que a programação ao ar livre reflita o que a comunidade gosta de assistir.",
      "Envie sua sugestão de filme ou de local pelo cadastro de contato no fim da página. As ideias mais pedidas entram na curadoria das próximas sessões.",
    ],
  },
];

const AGENDA = [
  { id: "a-1", status: "Concluído", dia: "22", mes: "OUT", titulo: "Parceria com o Parque Linear anunciada", texto: "Anúncio oficial da parceria entre CineAstra e o parque." },
  { id: "a-2", status: "Em andamento", dia: "—", mes: "OUT/NOV", titulo: "Conversas com teatros e cinemas da região", texto: "Negociações para formar uma rede cultural local." },
  { id: "a-3", status: "Em breve", dia: EVENTO.data.replace(/^\S+\s/, "").split(" ")[0], mes: (EVENTO.data.split(" ")[2] || "NOV").toUpperCase(), titulo: `Exibição de ${EVENTO.filme}`, texto: `${EVENTO.local} · Portões ${EVENTO.abertura} · Sessão ${EVENTO.inicio}` },
];

const AVISOS = [
  { id: "v-1", icon: Radio, titulo: "Transmissão sujeita ao clima", texto: "Em caso de chuva, divulgaremos aqui o novo plano." },
  { id: "v-2", icon: Ticket, titulo: `Entrada ${EVENTO.entrada.toLowerCase()}`, texto: "Chegue cedo para garantir um bom lugar no gramado." },
  { id: "v-3", icon: Popcorn, titulo: "Bomboniere no local", texto: "Pipoca e bebidas do CineAstra durante a sessão." },
];

const PARCEIROS = [
  { id: "p-1", nome: "Parque Linear de São Caetano do Sul", tipo: "Parque · Parceiro oficial", status: "Confirmado", icon: Trees },
  { id: "p-2", nome: "Teatros da região", tipo: "Em negociação", status: "Em breve", icon: Theater },
  { id: "p-3", nome: "Cinemas independentes", tipo: "Em negociação", status: "Em breve", icon: Film },
];

/* ============ ESTILOS ============ */
const CinemaStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Manrope:wght@400;500;600;700;800&family=Oswald:wght@500;600;700&display=swap');

    .ca-root { font-family: var(--font-sans, 'Manrope', sans-serif); }
    .f-display { font-family: 'Big Shoulders Display', 'Arial Narrow', Impact, sans-serif; letter-spacing: .01em; }
    .f-title { font-family: 'Oswald', 'Arial Narrow', Impact, sans-serif; letter-spacing: .01em; }
    .no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
    .no-scrollbar::-webkit-scrollbar { display: none; }

    .grain::after {
      content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .05; mix-blend-mode: overlay;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }

    .perf { height: 14px; background: repeating-linear-gradient(90deg, var(--primary) 0 12px, transparent 12px 26px); opacity: .6; border-radius: 2px; }
    .perf-v { width: 14px; background: repeating-linear-gradient(180deg, var(--border) 0 12px, transparent 12px 26px); opacity: .8; }

    .ticket {
      --n: 68%;
      -webkit-mask: radial-gradient(circle 10px at 0 var(--n), #0000 97%, #000) left/51% 100% no-repeat, radial-gradient(circle 10px at 100% var(--n), #0000 97%, #000) right/51% 100% no-repeat;
      mask: radial-gradient(circle 10px at 0 var(--n), #0000 97%, #000) left/51% 100% no-repeat, radial-gradient(circle 10px at 100% var(--n), #0000 97%, #000) right/51% 100% no-repeat;
    }
    .ticket-v {
      --n: 62%;
      -webkit-mask: radial-gradient(circle 11px at var(--n) 0, #0000 97%, #000) top/100% 51% no-repeat, radial-gradient(circle 11px at var(--n) 100%, #0000 97%, #000) bottom/100% 51% no-repeat;
      mask: radial-gradient(circle 11px at var(--n) 0, #0000 97%, #000) top/100% 51% no-repeat, radial-gradient(circle 11px at var(--n) 100%, #0000 97%, #000) bottom/100% 51% no-repeat;
    }

    .tear { border-top: 2px dashed var(--border); }
    .tear-v { border-left: 2px dashed var(--border); }

    .hero-tint {
      background:
        radial-gradient(90% 70% at 88% 12%, color-mix(in oklab, var(--primary) 14%, transparent), transparent 62%),
        radial-gradient(70% 60% at 0% 100%, color-mix(in oklab, var(--secondary) 24%, transparent), transparent 65%);
    }
    .section-sep { position: relative; height: 1px; background: linear-gradient(90deg, transparent 0%, color-mix(in oklab, var(--primary) 45%, transparent) 50%, transparent 100%); }
    .section-sep::after {
      content: ""; position: absolute; left: 12%; right: 12%; top: -14px; height: 28px; pointer-events: none;
      background: radial-gradient(60% 100% at 50% 50%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 75%);
    }
    .stub-glow { box-shadow: 0 30px 80px -30px color-mix(in oklab, var(--primary) 40%, transparent); }

    .news-rule { border-top: 3px double var(--border); }

    @keyframes ca-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
    .ca-marquee { animation: ca-marquee 34s linear infinite; }
    @media (prefers-reduced-motion: reduce) { .ca-marquee { animation: none; } }
  `}</style>
);

/* ============ COMPONENTES AUXILIARES ============ */
const Barcode = ({ seed = 7, className = "h-10" }) => (
  <div className={`flex items-end gap-[2px] ${className}`} aria-hidden="true">
    {Array.from({ length: 34 }).map((_, i) => (
      <span key={i} className="bg-foreground/70" style={{ width: ((i * seed) % 3) + 1, height: `${60 + ((i * 13 + seed) % 40)}%` }} />
    ))}
  </div>
);

function Badge({ children, className = "" }) {
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${className}`}>{children}</span>;
}

function SectionDivider() {
  return <div className="section-sep mx-auto max-w-[1600px]" aria-hidden="true" />;
}

function Button({ children, variant = "default", size = "default", className = "", type = "button", ...props }) {
  let base = "inline-flex items-center justify-center font-bold transition-all rounded-full cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ";
  if (variant === "default") base += "bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20 ";
  if (variant === "wine") base += "bg-secondary text-secondary-foreground hover:opacity-90 ";
  if (variant === "outline") base += "border border-border bg-background/50 text-foreground hover:border-primary hover:text-primary ";
  if (variant === "ghost") base += "text-muted-foreground hover:text-foreground hover:bg-muted/50 ";
  if (size === "sm") base += "px-3 py-1.5 text-xs ";
  if (size === "default") base += "px-6 py-3 text-sm ";
  if (size === "lg") base += "px-8 py-4 text-base ";
  if (size === "icon") base += "p-2.5 ";
  return <button type={type} className={`${base} ${className}`} {...props}>{children}</button>;
}

function SectionTitle({ eyebrow, title, description, icon: Icon = Film }) {
  return (
    <div className="mb-10 flex items-start gap-4">
      <div className="hidden sm:block perf-v self-stretch rounded-sm" aria-hidden="true" />
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold text-primary mb-1">
          <Icon className="w-4 h-4" aria-hidden="true" /> {eyebrow}
        </div>
        <h2 className="f-display uppercase text-5xl md:text-6xl font-black text-foreground leading-[0.95]">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-3 max-w-xl leading-relaxed">{description}</p>}
      </div>
    </div>
  );
}

function Meta({ item }) {
  return (
    <div className="flex items-center gap-x-4 gap-y-1 flex-wrap text-xs text-muted-foreground">
      <span className="flex items-center"><CalendarDays className="w-3.5 h-3.5 mr-1.5 text-primary" aria-hidden="true" />{item.data}</span>
      <span className="flex items-center"><Clock3 className="w-3.5 h-3.5 mr-1.5 text-primary" aria-hidden="true" />{item.leitura} de leitura</span>
      <span className="flex items-center"><UserRound className="w-3.5 h-3.5 mr-1.5 text-primary" aria-hidden="true" />{AUTOR}</span>
    </div>
  );
}

/* ============ CABEÇALHO DO PORTAL ============ */
function Masthead() {
  const manchetes = ["Parceria com o Parque Linear de São Caetano do Sul", `${EVENTO.filme} ao ar livre`, "Conversas com teatros e cinemas da região", "Sugira o próximo filme da comunidade"];
  const row = [...manchetes, ...manchetes];

  return (
    <header className="grain relative bg-background overflow-hidden pt-16">
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/35 via-card to-background" aria-hidden="true" />
      <div className="absolute inset-0 hero-tint" aria-hidden="true" />
      <div className="perf absolute top-0 inset-x-0 z-20" aria-hidden="true" />

      <div className="relative z-20 max-w-[1600px] mx-auto px-5 md:px-8 pt-10 pb-8">
        <div className="flex items-center justify-between gap-4 flex-wrap text-xs text-muted-foreground mb-4">
          <span className="flex items-center gap-1.5 font-semibold text-primary"><Newspaper className="w-4 h-4" aria-hidden="true" /> Notícias da empresa</span>
          <span>{EDICAO}</span>
        </div>
        <div className="news-rule pt-5 flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1 className="f-display uppercase text-6xl sm:text-8xl lg:text-[8rem] font-black text-foreground leading-[0.82]">
              CineAstra <span className="text-primary">News</span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-4 max-w-xl leading-relaxed">
              Anúncios, parcerias e acontecimentos do CineAstra para a nossa comunidade.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => document.getElementById("noticias")?.scrollIntoView({ behavior: "smooth" })}>Notícias</Button>
            <Button variant="outline" size="sm" onClick={() => document.getElementById("agenda")?.scrollIntoView({ behavior: "smooth" })}>Acontecimentos</Button>
            <Button variant="outline" size="sm" onClick={() => document.getElementById("avisos")?.scrollIntoView({ behavior: "smooth" })}>Avisos</Button>
            <Button size="sm" onClick={() => document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" })}><Bell className="w-3.5 h-3.5 mr-1.5" aria-hidden="true" /> Receber avisos</Button>
          </div>
        </div>
      </div>

      {/* Tarja "Últimas" */}
      <div className="relative z-20 border-y border-border bg-card/70 backdrop-blur-sm flex items-stretch overflow-hidden" aria-label="Últimas manchetes">
        <span className="f-title uppercase text-xs bg-primary text-primary-foreground px-4 flex items-center gap-1.5 shrink-0"><CircleDot className="w-3.5 h-3.5" aria-hidden="true" /> Últimas</span>
        <div className="overflow-hidden py-3 flex-1" aria-hidden="true">
          <div className="ca-marquee flex w-max gap-10 whitespace-nowrap">
            {[...row, ...row].map((t, i) => (
              <span key={i} className="text-sm text-foreground/80 flex items-center gap-10">{t}<Film className="w-3.5 h-3.5 text-primary" /></span>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ============ MANCHETE + LATERAL ============ */
function Manchete({ item, onOpen }) {
  return (
    <article style={{ "--n": "74%" }} className="ticket stub-glow group bg-card border border-border rounded-xl grid sm:grid-cols-[1fr_170px] h-full">
      <div className="p-6 md:p-8 flex flex-col">
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <Badge className="bg-primary text-primary-foreground">Manchete</Badge>
          <Badge className="bg-primary/10 text-primary border border-primary/30">{item.categoria}</Badge>
        </div>
        <h2 className="f-display uppercase text-4xl md:text-6xl font-black text-card-foreground leading-[0.92] mb-4 group-hover:text-primary transition-colors">{item.titulo}</h2>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6 max-w-xl">{item.resumo}</p>
        <div className="mt-auto space-y-5">
          <Meta item={item} />
          <Button onClick={() => onOpen(item)}>Ler matéria completa <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" /></Button>
        </div>
      </div>
      <div className="tear tear-v sm:border-t-0 bg-secondary/15 p-6 flex sm:flex-col items-center sm:items-stretch justify-between gap-4">
        <item.icon className="w-10 h-10 text-primary" aria-hidden="true" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-bold text-foreground">{EVENTO.data}</p>
          <p>Portões {EVENTO.abertura}</p>
          <p>Sessão {EVENTO.inicio}</p>
        </div>
        <Barcode seed={item.titulo.length} />
      </div>
    </article>
  );
}

function MaisRecentes({ itens, onOpen }) {
  return (
    <aside aria-label="Mais recentes" className="bg-card/60 border border-border rounded-xl p-5 h-full">
      <h3 className="f-title uppercase text-sm text-primary flex items-center gap-2 mb-4"><Newspaper className="w-4 h-4" aria-hidden="true" /> Mais recentes</h3>
      <ul className="divide-y divide-dashed divide-border">
        {itens.map((n) => (
          <li key={n.id}>
            <button type="button" onClick={() => onOpen(n)} className="group w-full text-left py-3.5 flex items-start gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md">
              <n.icon className="w-5 h-5 mt-0.5 text-primary/70 shrink-0" aria-hidden="true" />
              <span className="flex-1">
                <span className="text-[11px] font-semibold text-primary block mb-0.5">{n.categoria} · {n.data}</span>
                <span className="text-sm font-bold text-card-foreground leading-snug group-hover:text-primary transition-colors">{n.titulo}</span>
              </span>
              <ArrowUpRight className="w-4 h-4 mt-1 text-muted-foreground group-hover:text-primary shrink-0" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

/* ============ NOTÍCIAS ============ */
function NoticiaCard({ item, onOpen }) {
  return (
    <article style={{ "--n": "50%" }} className="ticket ticket-v group h-full bg-card border border-border flex flex-col transition-transform duration-300 hover:-translate-y-1">
      <div className="perf !rounded-none" aria-hidden="true" />
      <div className="p-5 flex-grow">
        <div className="flex items-center justify-between mb-4">
          <Badge className="bg-primary/10 text-primary border border-primary/30">{item.categoria}</Badge>
          <item.icon className="w-6 h-6 text-primary/70" aria-hidden="true" />
        </div>
        <h3 className="f-title uppercase text-lg leading-tight text-card-foreground mb-3 group-hover:text-primary transition-colors">{item.titulo}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{item.resumo}</p>
      </div>
      <div className="tear mx-5" aria-hidden="true" />
      <div className="p-5 flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground block">{item.data}</span>
          {item.leitura} de leitura
        </div>
        <Button size="sm" variant="outline" onClick={() => onOpen(item)} aria-label={`Ler: ${item.titulo}`}>Ler <ArrowRight className="w-3.5 h-3.5 ml-1.5" aria-hidden="true" /></Button>
      </div>
    </article>
  );
}

function NoticiasSection({ onOpen }) {
  const [cat, setCat] = useState("Todas");
  const manchete = NOTICIAS.find((n) => n.destaque) || NOTICIAS[0];
  const recentes = NOTICIAS.filter((n) => n.id !== manchete.id).slice(0, 4);
  const lista = useMemo(() => (cat === "Todas" ? NOTICIAS : NOTICIAS.filter((n) => n.categoria === cat)), [cat]);

  return (
    <section id="noticias" className="relative py-16 bg-background">
      <div className="max-w-[1600px] mx-auto px-5 md:px-8">
        <div className="grid lg:grid-cols-12 gap-6 mb-20">
          <div className="lg:col-span-8"><Manchete item={manchete} onOpen={onOpen} /></div>
          <div className="lg:col-span-4"><MaisRecentes itens={recentes} onOpen={onOpen} /></div>
        </div>

        <SectionTitle eyebrow="Todas as matérias" title="Notícias" description="Tudo o que o CineAstra está fazendo pela e com a comunidade." icon={Newspaper} />

        <div className="no-scrollbar flex gap-2 mb-8 overflow-x-auto pb-2" role="tablist" aria-label="Filtrar notícias">
          {CATEGORIAS.map((c) => (
            <Button key={c} role="tab" aria-selected={cat === c} variant={cat === c ? "wine" : "outline"} size="sm" onClick={() => setCat(c)}
              className={`shrink-0 ${cat === c ? "border border-primary/40 !text-primary" : ""}`}>
              {c}
            </Button>
          ))}
        </div>

        {lista.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma notícia nesta categoria por enquanto.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {lista.map((n) => <NoticiaCard key={n.id} item={n} onOpen={onOpen} />)}
          </div>
        )}
      </div>
    </section>
  );
}

/* ============ ACONTECIMENTOS (AGENDA) ============ */
const STATUS_STYLE = {
  "Concluído": "bg-primary text-primary-foreground",
  "Em andamento": "bg-secondary text-secondary-foreground border border-primary/30",
  "Em breve": "bg-muted text-muted-foreground border border-border",
};

function AgendaSection() {
  return (
    <section id="agenda" className="grain relative py-24 bg-gradient-to-b from-background via-card/60 to-background overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-5 md:px-8 relative z-10">
        <SectionTitle eyebrow="Linha do tempo" title="Acontecimentos" description="O que já aconteceu, o que está em andamento e o que vem por aí." icon={CalendarDays} />
        <ol className="grid md:grid-cols-3 gap-6">
          {AGENDA.map((a) => (
            <li key={a.id} style={{ "--n": "34%" }} className="ticket bg-card border border-border rounded-xl grid grid-cols-[96px_1fr]">
              <div className="bg-secondary/15 flex flex-col items-center justify-center py-6 px-2 text-center">
                <span className="f-display text-5xl font-black text-primary leading-none">{a.dia}</span>
                <span className="f-title uppercase text-xs text-muted-foreground mt-1">{a.mes}</span>
              </div>
              <div className="tear-v p-5">
                <Badge className={`${STATUS_STYLE[a.status]} mb-3`}>{a.status === "Concluído" && <Check className="w-3 h-3 mr-1" aria-hidden="true" />}{a.status}</Badge>
                <h3 className="f-title uppercase text-base text-card-foreground leading-tight mb-2">{a.titulo}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{a.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ============ AVISOS ============ */
function AvisosSection() {
  return (
    <section id="avisos" className="relative py-24 bg-background">
      <div className="max-w-[1600px] mx-auto px-5 md:px-8">
        <SectionTitle eyebrow="Quadro de avisos" title="Avisos ao público" description="Informações rápidas para você se organizar." icon={Megaphone} />
        <div className="grid md:grid-cols-3 gap-6">
          {AVISOS.map((v) => (
            <div key={v.id} style={{ "--n": "50%" }} className="ticket ticket-v bg-card border border-border p-6 flex items-start gap-4">
              <span className="w-11 h-11 shrink-0 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center"><v.icon className="w-5 h-5" aria-hidden="true" /></span>
              <div>
                <h3 className="f-title uppercase text-sm text-card-foreground mb-1">{v.titulo}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{v.texto}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============ PARCEIROS ============ */
function ParceirosSection() {
  return (
    <section id="parceiros" className="grain relative py-24 bg-gradient-to-b from-background via-card/50 to-card/70 overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-5 md:px-8 relative z-10">
        <SectionTitle eyebrow="Rede cultural" title="Nossos parceiros" description="Quem caminha com o CineAstra para levar cultura e entretenimento à cidade." icon={Handshake} />
        <div className="grid md:grid-cols-3 gap-6">
          {PARCEIROS.map((p) => {
            const ok = p.status === "Confirmado";
            return (
              <div key={p.id} style={{ "--n": "50%" }} className="ticket ticket-v bg-card border border-border flex flex-col">
                <div className="p-6 flex-grow">
                  <span className="w-12 h-12 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center mb-4"><p.icon className="w-6 h-6" aria-hidden="true" /></span>
                  <h3 className="f-title uppercase text-lg text-card-foreground leading-tight mb-1">{p.nome}</h3>
                  <p className="text-xs text-muted-foreground">{p.tipo}</p>
                </div>
                <div className="tear mx-6" aria-hidden="true" />
                <div className="p-6 flex items-center justify-between">
                  <Badge className={ok ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border border-border"}>
                    {ok && <Check className="w-3 h-3 mr-1" aria-hidden="true" />}{p.status}
                  </Badge>
                  <Barcode seed={p.nome.length} className="h-6 opacity-60" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


/* ============ CONTATO ============ */
function ContatoSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  // idle | enviando | ok | erro

  const submit = async (e) => {
    e.preventDefault();

    if (!email.trim() || status === "enviando") return;

    setStatus("enviando");

    
try {
  const res = await fetch("/api/avisos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email.trim(),
    }),
  });

  // Lê a resposta como texto primeiro
  const resposta = await res.text();

  let resultado;

  try {
    resultado = JSON.parse(resposta);
  } catch {
    console.error("Resposta inválida da API:", resposta);

    throw new Error(
      `O servidor retornou uma resposta inválida (HTTP ${res.status}).`
    );
  }

  if (!res.ok || !resultado?.ok) {
  console.error("Erro no cadastro:", {
    status: res.status,
    resposta: resultado,
  });

  throw new Error(
    resultado?.error ||
      `Não foi possível realizar o cadastro (HTTP ${res.status}).`
  );
}

  setStatus("ok");
} catch (error) {
  console.error("Erro ao cadastrar aviso:", error);
  setStatus("erro");
}
  };

  return (
    <section id="contato" className="relative py-24 bg-background">
      <div className="max-w-4xl mx-auto px-5 md:px-8">
        <div
          style={{ "--n": "50%" }}
          className="ticket stub-glow grid md:grid-cols-[1fr_200px] bg-card border border-border rounded-xl"
        >
          <div className="p-6 md:p-10">
            <Badge className="bg-primary/10 text-primary border border-primary/30 mb-4">
              <Bell className="w-3 h-3 mr-1" aria-hidden="true" />
              Receba as notícias
            </Badge>

            <h2 className="f-display uppercase text-4xl md:text-5xl font-black text-card-foreground leading-[0.95] mb-3">
              Fique por dentro de tudo
            </h2>

            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Deixe seu e-mail e enviaremos as novidades, mudanças de programação
              e convites para as próximas sessões.
            </p>

            {status === "ok" ? (
              <p
                className="flex items-center gap-2 text-sm font-semibold text-primary"
                role="status"
              >
                <Check className="w-4 h-4" aria-hidden="true" />
                Tudo certo! Você vai receber nossas notícias.
              </p>
            ) : (
              <form
                onSubmit={submit}
                className="flex flex-col sm:flex-row gap-3"
              >
                <label htmlFor="email-aviso" className="sr-only">
                  Seu e-mail
                </label>

                <div className="relative flex-1">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <input
                    id="email-aviso"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    disabled={status === "enviando"}
                    aria-invalid={status === "erro"}
                    aria-describedby={status === "erro" ? "erro-aviso" : undefined}
                    className="w-full rounded-full border border-border bg-muted/30 pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
                  />
                </div>

                <Button type="submit" disabled={status === "enviando"}>
                  {status === "enviando" ? (
                    "Enviando..."
                  ) : (
                    <>
                      Quero receber
                      <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
                    </>
                  )}
                </Button>

                {status === "erro" && (
                  <p
                    id="erro-aviso"
                    role="alert"
                    className="text-sm text-destructive sm:basis-full"
                  >
                    Não foi possível realizar o cadastro. Confira o e-mail e
                    tente novamente.
                  </p>
                )}
              </form>
            )}
          </div>

          <div className="tear tear-v md:border-t-0 bg-secondary/15 p-6 flex flex-col items-center justify-center gap-4">
            <Film className="w-10 h-10 text-primary" aria-hidden="true" />
            <Barcode seed={11} />
            <span className="f-title text-[11px] uppercase text-muted-foreground tracking-widest">
              CineAstra
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============ MODAL DA MATÉRIA ============ */
function ArtigoModal({ item, onClose }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const share = async () => {
    const text = `${item.titulo} · CineAstra News`;
    try {
      if (navigator.share) await navigator.share({ title: "CineAstra News", text, url: window.location.href });
      else {
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    } catch { /* usuário cancelou */ }
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={item.titulo} className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <article onClick={(e) => e.stopPropagation()} style={{ "--n": "22%" }} className="ticket w-full max-w-3xl bg-card border border-border rounded-xl shadow-2xl my-8">
        <div className="perf !rounded-none" aria-hidden="true" />
        <div className="p-6 md:p-10">
          <div className="flex items-center justify-between mb-5">
            <Badge className="bg-primary/10 text-primary border border-primary/30">{item.categoria}</Badge>
            <button type="button" onClick={onClose} aria-label="Fechar" className="p-1 text-muted-foreground hover:text-foreground"><X className="w-6 h-6" /></button>
          </div>
          <h2 className="f-display uppercase text-4xl md:text-6xl font-black text-card-foreground leading-[0.92] mb-5">{item.titulo}</h2>
          <Meta item={item} />
          <div className="tear my-6" aria-hidden="true" />
          <div className="space-y-4 text-sm md:text-base text-foreground/85 leading-relaxed">
            {item.corpo.map((p, i) => <p key={i}>{p}</p>)}
          </div>
          <div className="tear mt-8 mb-5" aria-hidden="true" />
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <Button variant="outline" size="sm" onClick={share}>
              {copied ? <Check className="w-4 h-4 mr-2" aria-hidden="true" /> : <Share2 className="w-4 h-4 mr-2" aria-hidden="true" />}
              {copied ? "Link copiado" : "Compartilhar"}
            </Button>
            <Barcode seed={item.titulo.length} className="h-8" />
          </div>
        </div>
      </article>
    </div>
  );
}

/* ============ PÁGINA ============ */
export default function ComunicadosPage() {
  const [aberta, setAberta] = useState(null);

  return (
    <div className="ca-root min-h-screen bg-background text-foreground transition-colors duration-300">
      <CinemaStyles />
      <Masthead />
      <NoticiasSection onOpen={setAberta} />
      <SectionDivider />
      <AgendaSection />
      <SectionDivider />
      <AvisosSection />
      <SectionDivider />
      <ParceirosSection />
      <SectionDivider />
      <ContatoSection />
      {aberta && <ArtigoModal key={aberta.id} item={aberta} onClose={() => setAberta(null)} />}
    </div>
  );
}