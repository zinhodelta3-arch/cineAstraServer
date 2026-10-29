import { ArrowLeft, X, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SupportHeader({ search, changeSearch, clearSearch }) {
  return (
      <section className="relative mx-auto w-full max-w-[1120px] px-1 pt-1 pb-[38px] text-center min-[601px]:px-2.5 [&_h1]:m-0 [&_h1]:font-sans [&_h1]:text-[clamp(38px,13vw,58px)] [&_h1]:leading-none [&_h1]:font-black [&_h1]:tracking-[-0.04em] min-[601px]:[&_h1]:text-[clamp(40px,6vw,70px)] [&_em]:text-primary [&_em]:not-italic">
        <Link href="/cinema/home" className="inline-flex items-center gap-2 rounded-sm text-xs font-bold text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
          <ArrowLeft size={16} aria-hidden="true" />
          Voltar para a Home
        </Link>

        <div className="mx-auto mt-[26px] mb-[18px] h-[54px] w-[170px] [&_img]:size-full [&_img]:object-contain">
          <img src="/CineAstra.png" alt="CineAstra" />
        </div>

        <p className="mb-[7px] block text-[10px] font-black tracking-[0.16em] text-primary uppercase">Central de atendimento</p>
        <h1>Como podemos<br /><em>te ajudar?</em></h1>
        <p className="mx-auto mt-[18px] mb-[27px] max-w-[590px] text-[13px] leading-relaxed text-muted-foreground min-[601px]:text-sm">
          Encontre respostas para as principais dúvidas sobre ingressos,
          sessões, sua conta e tudo o que envolve sua experiência CineAstra.
        </p>

        <div className="relative mx-auto flex h-[53px] w-full max-w-[690px] items-center min-[601px]:h-[58px]">
          <Search size={20} className="pointer-events-none absolute left-4 z-10 text-muted-foreground" aria-hidden="true" />
          <Input
            className="h-full rounded-[10px] border-border bg-card pr-12 pl-12 text-base shadow-none md:text-sm dark:bg-card"
            type="search"
            value={search}
            onChange={changeSearch}
            placeholder="Digite uma dúvida, como “cancelamento”..."
            aria-label="Pesquisar dúvidas"
          />
          {search && (
            <Button type="button" variant="ghost" size="icon" className="absolute right-2 size-9 rounded-full text-muted-foreground" onClick={clearSearch} aria-label="Limpar pesquisa">
              <X size={18} aria-hidden="true" />
            </Button>
          )}
        </div>
      </section>
  );
}
