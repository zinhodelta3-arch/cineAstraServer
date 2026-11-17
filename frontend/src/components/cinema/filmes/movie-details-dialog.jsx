"use client";
import Link from 'next/link';
import { useState } from 'react';
import { Play, X } from 'lucide-react';
import {Dialog,DialogClose,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {useMovieDetails} from '@/hooks/cinema/filmes/use-movie-details';
import {youtubeEmbed} from '@/lib/api/youtube-embed.mjs';
import ListStatus from '@/components/cinema/home/list-status';
import FilmDetailBanner from './film-detail-banner';
import {AgeRating} from './movie-ui';
import {durationLabel} from './movie-utils';
import ticketStyles from '../ticket.module.css';

function Details({id,onSessions}){
 const [showTrailer,setShowTrailer]=useState(false);
 const {movie,loading,error,retry,genres}=useMovieDetails(id,{includeGallery:false});
 if(loading||error)return <div className="p-5 sm:p-6"><DialogHeader><DialogTitle>Detalhes do filme</DialogTitle><DialogDescription>{loading?'Carregando informações…':'Não foi possível carregar este filme.'}</DialogDescription></DialogHeader>{error&&<div role="alert"><p>{error}</p><Button onClick={retry}>Tentar novamente</Button></div>}</div>;

 const trailer=youtubeEmbed(movie.trailer);
 return (
  <>
   <div className="grid min-w-0 gap-3 px-4 pt-4 pb-5 sm:px-6">
    <DialogHeader className="min-w-0 text-left">
     <DialogTitle className={`${ticketStyles.title} pr-10 text-3xl font-black sm:text-4xl`}>{movie.title}</DialogTitle>
    </DialogHeader>
    <div hidden={showTrailer}><FilmDetailBanner movie={movie}/></div>
    {showTrailer && <iframe
      src={`${trailer}&autoplay=1`}
      title={`Trailer de ${movie.title}`}
      className="aspect-video min-h-[200px] w-full rounded-md border border-border bg-black"
      allow="autoplay; encrypted-media; picture-in-picture"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />}
    {trailer && <Button variant="outline" className="min-h-11 justify-self-start" onClick={()=>setShowTrailer(value=>!value)}>
      {showTrailer ? <X aria-hidden="true" /> : <Play aria-hidden="true" />}
      {showTrailer ? 'Fechar trailer' : 'Assistir ao trailer'}
    </Button>}
    <DialogDescription className="leading-relaxed">{movie.synopsis}</DialogDescription>
    <div className="flex flex-wrap items-center gap-3 text-xs"><AgeRating age={movie.age}/><span>{durationLabel(movie.duration)}</span>{movie.director&&<span>Direção: {movie.director}</span>}</div>
    {genres.items.length>0&&<p className="text-sm text-muted-foreground">{genres.items.map(g=>g.nome).join(' · ')}</p>}
    {(genres.loading||genres.error||genres.cursor)&&<ListStatus list={genres} empty="" more="Mais gêneros"/>}
   </div>
   <div className={ticketStyles.tear} aria-hidden="true" />
   <div className={`${ticketStyles.stub} flex flex-wrap gap-2 px-4 py-4 sm:px-6`}>
    <Button className="min-h-11" onClick={()=>onSessions(movie)}>Consultar sessões</Button>
    <Button className="min-h-11" nativeButton={false} variant="outline" render={<Link href={`/cinema/filmes/${movie.id}`} />}>Página do filme</Button>
   </div>
  </>
 );
}

export default function MovieDetailsDialog({selectedMovie,onOpenChange,onSessions}){
 return <Dialog open={Boolean(selectedMovie)} onOpenChange={onOpenChange}>
  <DialogContent showCloseButton={false} className="max-h-[90dvh] gap-0 overflow-y-auto rounded-md p-0 motion-reduce:animate-none sm:max-w-[760px]">
   {selectedMovie&&<div className={`${ticketStyles.ticket} overflow-hidden`}>
    <DialogClose aria-label="Fechar detalhes do filme" render={<Button size="icon" variant="ghost" className="absolute top-5 right-2 size-11 sm:right-4" />}>
     <X aria-hidden="true" />
    </DialogClose>
    <Details key={selectedMovie.id} id={selectedMovie.id} onSessions={onSessions}/>
   </div>}
  </DialogContent>
 </Dialog>;
}
