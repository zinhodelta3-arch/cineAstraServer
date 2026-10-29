"use client";
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {useMovieDetails} from '@/hooks/cinema/filmes/use-movie-details';
import {publicAsset} from '@/lib/api/public-api.mjs';
import ListStatus from '@/components/cinema/home/list-status';
import PosterImage from './poster-image';
import {AgeRating} from './movie-ui';
import {durationLabel} from './movie-utils';
import styles from './filmes.module.css';
function Details({id,onSessions}){
 const {movie,loading,error,retry,genres,gallery}=useMovieDetails(id);
 if(loading||error)return <><DialogHeader><DialogTitle>Detalhes do filme</DialogTitle><DialogDescription>{loading?'Carregando informações…':'Não foi possível carregar este filme.'}</DialogDescription></DialogHeader>{error&&<div role="alert"><p>{error}</p><Button onClick={retry}>Tentar novamente</Button></div>}</>;
 return <>
  <div className="grid gap-6 sm:grid-cols-[170px_1fr]">
   <div className="mx-auto aspect-[2/3] w-36 overflow-hidden rounded-sm sm:w-full"><PosterImage movie={movie} className="h-full w-full object-cover" eager /></div>
   <div><DialogHeader className="text-left"><DialogTitle className={`${styles.display} pr-4 text-4xl font-bold`}>{movie.title}</DialogTitle><DialogDescription>{movie.synopsis}</DialogDescription></DialogHeader>
    <div className="my-5 flex flex-wrap items-center gap-3 text-xs"><AgeRating age={movie.age}/><span>{durationLabel(movie.duration)}</span>{movie.director&&<span>Direção: {movie.director}</span>}</div>
    <p className="text-sm text-primary">{genres.items.map(g=>g.nome).join(' · ')}</p><ListStatus list={genres} empty="" more="Mais gêneros"/>
    {movie.trailer&&<a href={movie.trailer} target="_blank" rel="noopener noreferrer" className="mb-4 block text-sm text-primary underline">Assistir ao trailer</a>}
    <Button onClick={()=>onSessions(movie)}>Consultar sessões</Button>
   </div>
  </div>
  <section aria-label="Galeria do filme"><div className="grid grid-cols-2 gap-3">{gallery.items.map(img=>{const src=publicAsset(img.url);return src?<img key={img.id_imagem} src={src} alt={img.texto_alternativo||movie.title} loading="lazy" className="w-full rounded-md object-contain"/>:null;})}</div><ListStatus list={gallery} empty="" more="Carregar mais imagens"/></section>
 </>;
}
export default function MovieDetailsDialog({selectedMovie,onOpenChange,onSessions}){
 return <Dialog open={Boolean(selectedMovie)} onOpenChange={onOpenChange}><DialogContent className="max-h-[90dvh] overflow-y-auto rounded-lg bg-card sm:max-w-[700px]">{selectedMovie&&<Details key={selectedMovie.id} id={selectedMovie.id} onSessions={onSessions}/>}</DialogContent></Dialog>;
}
