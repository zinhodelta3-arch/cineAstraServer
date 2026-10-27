import useProfilePoster from "@/hooks/cinema/perfil/use-profile-poster";
import { Film } from "lucide-react";
import { poster } from "./profile-utils";

export default function PosterImage({ movie, className = "" }) {
  const { failed, handleError } = useProfilePoster();
  return <div className={`relative overflow-hidden bg-secondary ${className}`}>
    {failed ? <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-2 text-center text-secondary-foreground"><Film className="size-7 opacity-50" /><span className="text-[10px]">{movie.title}</span></div> : <img src={poster(movie)} alt={`Imagem ilustrativa de ${movie.title}`} onError={handleError} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />}
  </div>;
}
