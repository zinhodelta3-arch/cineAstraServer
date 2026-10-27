import { Bot, ChevronRight, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SupportAssistant({ submitAssistantQuestion }) {
  return (
      <section className="relative mx-auto w-full max-w-[1120px] mt-7 grid grid-cols-1 overflow-hidden rounded-2xl border border-border bg-card min-[851px]:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]" aria-labelledby="ai-support-title">
        <div className="flex flex-col justify-center gap-[22px] border-b border-dashed border-border bg-primary/5 px-[22px] py-[26px] min-[601px]:p-[34px] min-[851px]:border-r min-[851px]:border-b-0 [&_h2]:max-w-[410px] [&_h2]:text-[clamp(24px,3vw,34px)] [&_h2]:leading-tight [&_h2]:font-bold [&_h2]:tracking-[-0.04em] [&_p]:mt-3 [&_p]:max-w-[440px] [&_p]:text-xs [&_p]:leading-relaxed [&_p]:text-muted-foreground">
          <div>
            <span className="mb-[7px] block text-[10px] font-black tracking-[0.16em] text-primary uppercase">Ainda precisa de ajuda?</span>
            <h2 id="ai-support-title">Converse com a assistente CineAstra</h2>
            <p>
              Não encontrou sua resposta nas dúvidas frequentes? Nossa assistente
              virtual poderá ajudar com outras perguntas sobre o CineAstra.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background px-[11px] py-2 text-[10px] font-extrabold tracking-wide text-muted-foreground">
            <span className="size-[7px] rounded-full bg-primary" />
            Assistente virtual
          </div>
        </div>

        <div className="flex min-w-0 flex-col bg-background p-[22px] min-[601px]:p-[30px]">
          <div className="flex items-start gap-3.5 border-b border-border pb-[23px] min-[601px]:items-center [&_strong]:block [&_strong]:max-w-[390px] [&_strong]:text-sm [&_strong]:leading-normal [&_p]:mt-[5px] [&_p]:text-xs [&_p]:text-muted-foreground">
            <div className="grid size-[55px] shrink-0 place-items-center rounded-[15px_6px_15px_6px] border border-primary/35 bg-primary/10 text-primary" aria-hidden="true">
              <Bot size={25} />
            </div>
            <div>
              <strong>Olá! Eu sou a assistente virtual do CineAstra.</strong>
              <p>Como posso ajudar você hoje?</p>
            </div>
          </div>

          <div className="pt-[22px] pb-5 min-[601px]:pb-6 [&>span]:mb-3 [&>span]:block [&>span]:text-xs [&>span]:font-extrabold [&>span]:tracking-wide [&>span]:text-muted-foreground">
            <span>Perguntas sugeridas</span>
            <div className="grid gap-2">
              <Button type="button" variant="outline" className="h-auto min-h-[42px] w-full justify-between gap-3 rounded-[9px] bg-card px-[13px] py-[9px] text-left text-xs whitespace-normal shadow-none hover:border-primary/55 hover:text-primary">Quais são os filmes em cartaz?<ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /></Button>
              <Button type="button" variant="outline" className="h-auto min-h-[42px] w-full justify-between gap-3 rounded-[9px] bg-card px-[13px] py-[9px] text-left text-xs whitespace-normal shadow-none hover:border-primary/55 hover:text-primary">Como comprar ingressos?<ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /></Button>
              <Button type="button" variant="outline" className="h-auto min-h-[42px] w-full justify-between gap-3 rounded-[9px] bg-card px-[13px] py-[9px] text-left text-xs whitespace-normal shadow-none hover:border-primary/55 hover:text-primary">Quais são os horários das sessões?<ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /></Button>
              <Button type="button" variant="outline" className="h-auto min-h-[42px] w-full justify-between gap-3 rounded-[9px] bg-card px-[13px] py-[9px] text-left text-xs whitespace-normal shadow-none hover:border-primary/55 hover:text-primary">Quais formas de pagamento são aceitas?<ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /></Button>
            </div>
          </div>

          <form className="mt-auto flex items-center gap-2 rounded-full border border-border bg-card p-[7px] focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30" onSubmit={submitAssistantQuestion}>
            <Input
              className="h-10 min-w-0 flex-1 border-0 bg-transparent px-3 text-base shadow-none focus-visible:ring-0 md:text-sm dark:bg-transparent"
              type="text"
              placeholder="Digite sua dúvida aqui..."
              aria-label="Digite sua dúvida para a assistente virtual"
            />
            <Button type="submit" size="icon" className="size-10 shrink-0 rounded-full shadow-none" aria-label="Enviar dúvida">
              <SendHorizontal size={19} aria-hidden="true" />
            </Button>
          </form>
        </div>
      </section>
  );
}
