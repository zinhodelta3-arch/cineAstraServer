import { ArrowRight, Bookmark, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import Modal from "./modal";
import PosterImage from "./poster-image";

export default function FavoriteCard({ movie, onRemove }) {
  return <article className="group min-w-0">
    <div className="relative mb-3"><PosterImage movie={movie} className="aspect-[3/4] rounded-lg border border-border" /><div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-t from-black/75 via-transparent to-transparent" />
      <Button variant="secondary" size="icon" className="absolute top-2 right-2 size-8 rounded-full border border-white/20 bg-background/85 text-primary backdrop-blur" aria-label={`Remover ${movie.title} dos favoritos`} onClick={() => onRemove(movie.id)}><Bookmark className="size-3.5 fill-current" /></Button>
      <span className="absolute bottom-3 left-3 flex items-center gap-1 text-[11px] font-bold text-white"><Star className="size-3 fill-current text-primary" />{movie.score}</span>
    </div>
    <h3 className="truncate text-xs font-bold" title={movie.title}>{movie.title}</h3><p className="mt-1 truncate text-[10px] text-muted-foreground">{movie.genre}</p>
    <Modal trigger={<Button variant="link" className="mt-2 h-auto justify-start p-0 text-[10px] font-semibold">Ver sessões<ArrowRight className="size-3" /></Button>} title={movie.title} description={`${movie.genre} · ${movie.duration}`}>
      <p className="text-sm leading-relaxed text-muted-foreground">{movie.summary}</p><div className="rounded-xl border border-border bg-background p-4"><p className="mb-3 text-xs font-bold">Sessões ilustrativas</p><div className="flex flex-wrap gap-2">{movie.sessions.map((session) => <span key={session} className="rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-xs font-bold text-primary">{session}</span>)}</div><p className="mt-3 text-xs text-muted-foreground">Consulte a programação do cinema para comprar ingressos.</p></div>
    </Modal>
  </article>;
}
