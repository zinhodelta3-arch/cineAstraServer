import useEscape from "@/hooks/streaming/home/use-escape";
import { Play, Trash2, X } from "lucide-react";
import { ACCENT } from "./data";
import Art from "./art";

export default function ListDrawer({ items, onRemove, onPlay, onClose }) {
  useEscape(onClose);
  return (
    <div role="dialog" aria-modal="true" aria-label="Minha lista" className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-card border-l border-border h-full p-6 flex flex-col shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="f-display text-3xl font-black text-card-foreground">Minha Lista</h3>
          <button type="button" onClick={onClose} aria-label="Fechar lista" className="text-muted-foreground hover:text-foreground"><X className="size-6" /></button>
        </div>
        <div className="space-y-4 overflow-y-auto pr-2 flex-1">
          {items.length === 0 && <p className="text-sm text-muted-foreground">Sua lista está vazia. Adicione filmes para assistir depois.</p>}
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/30 border border-border rounded-lg">
              <div className="w-14 h-20 shrink-0 overflow-hidden rounded-xs"><Art movie={item} variant="poster" className="size-full object-cover" /></div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-card-foreground line-clamp-1">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.genre} · {item.duration}</p>
                {!item.soon && (
                  <button type="button" onClick={() => { onClose(); onPlay(item); }} className={`text-xs font-bold ${ACCENT} mt-1 inline-flex items-center hover:underline`}>
                    <Play className="size-3 mr-1 fill-current" aria-hidden="true" /> Assistir
                  </button>
                )}
              </div>
              <button type="button" onClick={() => onRemove(item)} aria-label={`Remover ${item.title}`} className="text-destructive hover:opacity-80 p-1"><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
