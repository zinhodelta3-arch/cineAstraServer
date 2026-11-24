import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Ticket } from "lucide-react";

const LOGO_SRC = "/CineAstraCompleto.png";

/* Largura do logo em px. A altura é calculada sozinha pelas proporções
   reais da imagem, então a caixa sempre acompanha o logo.
   Aumente ou diminua só este número para ajustar o tamanho. */
const LOGO_WIDTH = 140;

/* ---------- Ícones em formato de ticket de cinema ----------
   Cada ícone é um ingresso com os entalhes laterais, uma linha
   perfurada separando o canhoto e o símbolo da rede na área principal. */
const TICKET_SHAPE =
  "M4 5H20a3 3 0 0 1 3 3v2a2 2 0 0 0 0 4v2a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3v-2a2 2 0 0 0 0-4V8a3 3 0 0 1 3-3Z";

function TicketBase({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-9"
    >
      <path d={TICKET_SHAPE} />
      {/* linha perfurada do canhoto */}
      <path d="M7.6 6.8v10.4" strokeWidth="1.1" strokeDasharray="1.3 1.7" />
      {children}
    </svg>
  );
}

function YoutubeTicket() {
  return (
    <TicketBase>
      <path
        d="M13 8.6v6.8l6-3.4-6-3.4Z"
        fill="currentColor"
        stroke="none"
      />
    </TicketBase>
  );
}

function InstagramTicket() {
  return (
    <TicketBase>
      <rect x="11" y="8" width="8" height="8" rx="2.4" strokeWidth="1.2" />
      <circle cx="15" cy="12" r="1.9" strokeWidth="1.2" />
      <circle cx="17.3" cy="9.7" r="0.6" fill="currentColor" stroke="none" />
    </TicketBase>
  );
}

function XTicket() {
  return (
    <TicketBase>
      <path
        transform="translate(10.44 7.44) scale(0.38)"
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z"
        fill="currentColor"
        stroke="none"
      />
    </TicketBase>
  );
}

const socials = [
  { name: "YouTube", href: "https://www.youtube.com/@cine._astra-i7", Icon: YoutubeTicket },
  { name: "Instagram", href: "https://www.instagram.com/cine._astra/", Icon: InstagramTicket },
  { name: "X", href: "https://x.com/cine_astra", Icon: XTicket },
];

const columns = [
  {
    title: "Cinema",
    links: [
      { label: "Cinemas", href: "/cinemas" },
      { label: "Experiências", href: "/experiencias" },
      { label: "AstraSnack", href: "/astrasnack" },
    ],
  },
  {
    title: "Minha conta",
    links: [
      { label: "Meu perfil", href: "/perfil" },
      { label: "Minhas compras", href: "/compras" },
      { label: "Gerenciar assinatura", href: "/assinatura" },
    ],
  },
  {
    title: "CineAstra",
    links: [
      { label: "Sobre nós", href: "/sobre" },
      { label: "Parcerias", href: "/parcerias" },
      { label: "Destinação social", href: "/destinacao-social" },
      { label: "Termos de Uso", href: "/termos" },
      { label: "Política de Privacidade", href: "/privacidade" },
      { label: "Suporte", href: "/suporte" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-dashed">
      <div className="mx-auto w-full max-w-[1216px] px-4 py-12">
        {/* Chamada para a programação */}
        <div className="flex flex-col gap-4 rounded-2xl border bg-black/40 px-8 py-9 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Ticket className="size-6 text-primary" aria-hidden="true" />
            <p className="text-lg font-semibold">Planeje sua próxima sessão</p>
          </div>
          <Link
            href="/programacao"
            className="inline-flex items-center gap-2 font-semibold text-primary underline underline-offset-4"
          >
            Consultar a programação
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Logo + colunas de links */}
        <div className="mt-12 grid gap-10 md:grid-cols-[1.15fr_1fr_1fr_1fr]">
          <Link
            href="/"
            aria-label="CineAstra - página inicial"
            className="block h-fit w-fit"
          >
            <Image
              src={LOGO_SRC}
              alt="CineAstra"
              width={0}
              height={0}
              sizes={`${LOGO_WIDTH * 2}px`}
              style={{ width: LOGO_WIDTH, height: "auto" }}
              className="block max-w-none"
              priority={false}
            />
          </Link>

          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h3 className="text-sm font-bold">{column.title}</h3>
              <ul className="mt-4 space-y-4">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* Copyright + redes sociais */}
        <div className="mt-10 flex flex-col gap-5 border-t border-dashed pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} CineAstra. Todos os direitos reservados.
          </p>

          <div className="flex items-center gap-4">
            {socials.map(({ name, href, Icon }) => (
              <a
                key={name}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={name}
                title={name}
                className="rounded-sm text-muted-foreground transition-all duration-200 hover:-translate-y-0.5 hover:-rotate-6 hover:text-primary hover:drop-shadow-[0_0_8px_var(--primary)] focus-visible:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:rotate-0"
              >
                <Icon />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}