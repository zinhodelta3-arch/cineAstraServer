import { CircleHelp, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { categories } from "./data";

export default function SupportFaq({ activeCategory, setActiveCategory, filteredCategories, changeQuestion, resetFilters }) {
  return (
      <section className="relative mx-auto w-full max-w-[1120px] overflow-hidden rounded-2xl border border-border bg-card before:pointer-events-none before:absolute before:top-[180px] before:-left-[13px] before:z-10 before:size-6 before:-translate-y-1/2 before:rounded-full before:border before:border-border before:bg-background before:[clip-path:inset(0_0_0_50%)] before:content-[''] after:pointer-events-none after:absolute after:top-[180px] after:-right-[13px] after:z-10 after:size-6 after:-translate-y-1/2 after:rounded-full after:border after:border-border after:bg-background after:[clip-path:inset(0_50%_0_0)] after:content-['']">
        <div className="flex items-center justify-between gap-5 border-b border-dashed border-border px-5 pt-6 pb-5 min-[601px]:px-[34px] min-[601px]:pt-[30px] min-[601px]:pb-6 [&_h2]:text-[clamp(24px,3vw,32px)] [&_h2]:leading-tight [&_h2]:font-bold [&_h2]:tracking-[-0.04em]">
          <div>
            <span className="mb-[7px] block text-[10px] font-black tracking-[0.16em] text-primary uppercase">Central CineAstra</span>
            <h2>Principais dúvidas</h2>
          </div>
          <div className="hidden -rotate-2 items-center gap-[7px] rounded-md border border-dashed border-primary/55 px-[11px] py-2 text-[10px] font-black tracking-[0.13em] text-primary min-[601px]:inline-flex">
            <CircleHelp size={15} aria-hidden="true" />
            FAQ
          </div>
        </div>

        <div className="flex gap-[7px] overflow-x-auto border-b border-border px-5 py-3.5 [scrollbar-width:thin] min-[601px]:px-[34px] min-[601px]:py-[18px]" role="group" aria-label="Categorias de suporte">
          <Button
            type="button"
            aria-pressed={activeCategory === "todos"}
            variant={activeCategory === "todos" ? "default" : "outline"}
            className="h-9 shrink-0 gap-[7px] rounded-[7px] px-3 text-xs font-bold shadow-none"
            onClick={() => setActiveCategory("todos")}
          >
            Todas
          </Button>
          {categories.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              type="button"
              aria-pressed={activeCategory === id}
              variant={activeCategory === id ? "default" : "outline"}
            className="h-9 shrink-0 gap-[7px] rounded-[7px] px-3 text-xs font-bold shadow-none"
              onClick={() => setActiveCategory(id)}
            >
              <Icon size={15} aria-hidden="true" />
              {label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 min-[851px]:grid-cols-2">
          {filteredCategories.map((category) => {
            const Icon = category.icon;

            return (
              <section className="min-w-0 border-dashed border-border px-5 pt-[25px] pb-7 [&:nth-child(n+2)]:border-t min-[601px]:px-[34px] min-[601px]:pt-[30px] min-[601px]:pb-[34px] min-[851px]:odd:border-r min-[851px]:[&:nth-child(2)]:border-t-0" key={category.id}>
                <div className="mb-4 flex items-center gap-3 [&_h3]:text-[17px] [&_h3]:font-bold [&_h3]:tracking-[-0.02em] [&>div>span]:mb-0.5 [&>div>span]:block [&>div>span]:text-[10px] [&>div>span]:font-bold [&>div>span]:tracking-[0.09em] [&>div>span]:text-muted-foreground [&>div>span]:uppercase">
                  <span className="grid size-[39px] shrink-0 place-items-center rounded-[9px_4px_9px_4px] bg-primary/10 text-primary">
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <span>{category.questions.length} {category.questions.length === 1 ? "pergunta" : "perguntas"}</span>
                    <h3>{category.label}</h3>
                  </div>
                </div>

                <Accordion className="border-t border-border" value={category.openQuestions} onValueChange={changeQuestion}>
                  {category.questions.map((item) => {
                    const questionId = item.id;

                    return (
                      <AccordionItem key={questionId} value={questionId} className="border-b border-border last:border-b">
                        <AccordionTrigger className="gap-4 py-4 text-left text-xs leading-relaxed font-bold text-foreground hover:text-primary hover:no-underline">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="pr-8 pb-[17px] text-xs leading-relaxed text-muted-foreground">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </section>
            );
          })}
        </div>

        {filteredCategories.length === 0 && (
          <div className="grid justify-items-center px-[25px] py-[70px] text-center text-muted-foreground [&_h3]:mt-3.5 [&_h3]:mb-[5px] [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-foreground [&_p]:mb-[17px] [&_p]:text-xs">
            <Search size={25} aria-hidden="true" />
            <h3>Não encontramos essa dúvida.</h3>
            <p>Tente pesquisar por outro termo ou escolha uma categoria acima.</p>
            <Button type="button" variant="link" onClick={resetFilters}>
              Ver todas as dúvidas
            </Button>
          </div>
        )}
      </section>
  );
}
