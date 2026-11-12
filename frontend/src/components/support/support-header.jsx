import { ArrowLeft, X, Search } from "lucide-react";
import { useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SupportHeader({ search, changeSearch, clearSearch }) {
  const searchInput = useRef(null);
  return (
      <header className="mx-auto w-full max-w-[1120px] pb-6 sm:pb-8">
        <Link href="/cinema/home" className="inline-flex min-h-10 items-center gap-2 rounded-sm text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar para a Home
        </Link>

        <h1 className="mt-3 text-[clamp(2rem,5vw,3rem)] leading-tight font-bold tracking-tight">Como podemos te ajudar?</h1>
        <p className="mt-2 mb-5 max-w-[60ch] text-sm leading-6 text-muted-foreground">
          Consulte dúvidas sobre ingressos, sessões, sua conta e os serviços do CineAstra.
        </p>

        <div className="relative flex h-12 w-full max-w-[42rem] items-center">
          <Search size={20} className="pointer-events-none absolute left-4 z-10 text-muted-foreground" aria-hidden="true" />
          <Input
            ref={searchInput}
            className="h-full rounded-[10px] border-border bg-card pr-12 pl-12 text-base shadow-none md:text-sm dark:bg-card"
            type="search"
            value={search}
            onChange={changeSearch}
            placeholder="Digite uma dúvida, como “cancelamento”..."
            aria-label="Pesquisar dúvidas"
            aria-controls="support-faq"
          />
          {search && (
            <Button type="button" variant="ghost" size="icon" className="absolute right-2 size-9 rounded-full text-muted-foreground" onClick={() => { clearSearch(); searchInput.current?.focus(); }} aria-label="Limpar pesquisa">
              <X size={18} aria-hidden="true" />
            </Button>
          )}
        </div>
      </header>
  );
}
