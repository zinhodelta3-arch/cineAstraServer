import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeading from "./section-heading";
import FavoriteCard from "./favorite-card";

export default function ProfileFavorites({ favorites, removeFavorite, removedFavorite, restoreFavorite }) {
  return <section className="rounded-2xl border border-border bg-card p-5 sm:p-6"><SectionHeading icon={Bookmark} title="Meus favoritos" count={favorites.length} /><div className="grid grid-cols-3 gap-3">{favorites.map((movie) => <FavoriteCard key={movie.id} movie={movie} onRemove={removeFavorite} />)}</div>{favorites.length === 0 && <div className="py-8 text-center"><Bookmark className="mx-auto mb-3 size-6 text-muted-foreground" /><p className="text-xs text-muted-foreground">Seus filmes favoritos aparecerão aqui.</p></div>}{removedFavorite && <Button variant="link" className="mt-4 h-auto p-0 text-[11px]" onClick={restoreFavorite}>Desfazer última remoção</Button>}</section>;
}
