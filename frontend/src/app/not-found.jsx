import Link from 'next/link';
import { ArrowLeft, Film } from 'lucide-react';

export default function NotFound() {
  return <main className="mx-auto grid min-h-[60vh] max-w-3xl content-center gap-5 px-6 py-16 text-foreground">
    <Film className="size-8 text-primary" aria-hidden="true"/>
    <h1 className="f-display text-5xl font-black sm:text-6xl">Página indisponível</h1>
    <p className="max-w-prose text-muted-foreground">O endereço pode ter mudado ou o conteúdo pode ter sido removido.</p>
    <nav aria-label="Voltar à navegação" className="flex flex-wrap gap-4">
      <Link className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 font-semibold text-primary-foreground" href="/cinema/home"><ArrowLeft size={16} aria-hidden="true"/> Voltar ao início</Link>
      <Link className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 font-semibold" href="/cinema/filmes">Ver filmes</Link>
    </nav>
  </main>;
}
