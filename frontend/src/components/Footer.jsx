import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Ticket } from "lucide-react";
import { registrationDocuments } from "@/lib/auth/registration-documents.mjs";

const cinemaSections = [
  { title: "Cinema", items: [
    ["Cinemas", "/cinema/localizacoes"],
    ["Experiências", "/cinema/experiencias"], ["AstraSnack", "/cinema/astrasnack"],
  ] },
  { title: "Clube", items: [
    ["Planos e assinaturas", "/cinema/planos"], ["Minhas compras", "/cinema/minhascompras"],
  ] },
];
const streamingSections = [
  { title: "Streaming", items: [
    ["Categorias", "/streaming/categorias"], ["Meu perfil", "/streaming/meuperfil"],
  ] },
  { title: "Cinema", items: [["Voltar ao cinema", "/cinema/home"], ["Planos e assinaturas", "/cinema/planos"]] },
];

export default function Footer({ supportHref = "/cinema/suporte" }) {
  const streaming = supportHref.startsWith("/streaming/");
  const sections = [...(streaming ? streamingSections : cinemaSections), { title: "CineAstra", items: [
    ["Sobre nós", "/cinema/sobre-nos"], ["Parcerias", "/cinema/parcerias"], ["Destinação social", "/cinema/destinacao-social"],
    [registrationDocuments.terms.title, registrationDocuments.terms.url], [registrationDocuments.privacy.title, registrationDocuments.privacy.url],
    ["Suporte", supportHref],
  ] }];

  return <footer className="mt-auto border-t-2 border-dashed border-border bg-card text-card-foreground">
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <div className="mb-10 grid gap-3 rounded-xl border border-border bg-background p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-7">
        <div className="flex items-center gap-3">
          <Ticket className="size-6 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-lg font-semibold">{streaming ? "Encontre seu próximo filme" : "Planeje sua próxima sessão"}</p>
        </div>
        <Link href={streaming ? "/streaming/busca" : "/cinema/filmes"} className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
          {streaming ? "Buscar no catálogo" : "Consultar a programação"}<ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
      <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-[minmax(180px,1.2fr)_repeat(3,1fr)]">
        <Link href={streaming ? "/streaming/home" : "/cinema/home"} aria-label={streaming ? "CineAstra Streaming, início" : "CineAstra Cinema, início"} className="w-fit rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
          <Image src="/CineAstraCompleto.png" alt="" width={160} height={44} className="h-auto w-32" />
        </Link>
        {sections.map(section => <nav key={section.title} aria-label={section.title}>
          <h2 className="mb-1 text-sm font-bold">{section.title}</h2>
          <ul className="text-sm">{section.items.map(([label, href]) => <li key={href}>
            <Link href={href} prefetch={false} className="inline-flex min-h-9 items-center rounded text-muted-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
              {label}
            </Link>
          </li>)}</ul>
        </nav>)}
      </div>
      <p className="mt-9 border-t border-dashed border-border pt-5 text-xs text-muted-foreground">© {new Date().getFullYear()} CineAstra</p>
    </div>
  </footer>;
}
