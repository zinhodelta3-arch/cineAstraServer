"use client";
import {Clock3,Film} from 'lucide-react';
import FilmDetailBanner from './film-detail-banner';
import {AgeRating} from './movie-ui';
import ListStatus from '@/components/cinema/home/list-status';
import {durationLabel} from './movie-utils';
import FilmAvailability from './film-availability';
import TrailerButton from '@/components/cinema/home/trailer-modal';
export default function FilmInformation({film}){
 const movie=film.movie;
 return <aside className="cf-film-scroll" aria-label="Informações do filme"><div className="cf-film-content">
  <FilmDetailBanner movie={movie}/>
  <div className="cf-movie-title-row"><h2 className="cf-movie-title">{movie.title}</h2></div>
  <div className="cf-movie-meta"><AgeRating age={movie.age}/><span className="inline-flex items-center gap-1"><Clock3 size={13}/>{durationLabel(movie.duration)}</span><span>{film.genres.items.map(genre=>genre.nome).join(' · ')}</span><span>{movie.status==='em-breve'?'Em breve':'Em cartaz'}</span></div>
  <FilmAvailability film={film}/>
  <ListStatus list={film.genres} empty="" more="Mais gêneros"/>
  <div className="cf-detail-section"><h3>Sinopse</h3><p>{movie.synopsis}</p></div>
  <div className="cf-detail-section"><h3>Ficha técnica</h3><dl className="cf-facts"><div><dt>Título</dt><dd>{movie.title}</dd></div><div><dt>Estreia</dt><dd>{movie.releaseDate?new Date(`${movie.releaseDate}T12:00:00Z`).toLocaleDateString('pt-BR',{timeZone:'UTC'}):'A confirmar'}</dd></div>{movie.director&&<div><dt>Direção</dt><dd>{movie.director}</dd></div>}<div><dt>Duração</dt><dd>{durationLabel(movie.duration)}</dd></div>{film.genres.items.length>0&&<div><dt>Gênero</dt><dd>{film.genres.items.map(genre=>genre.nome).join(' · ')}</dd></div>}<div><dt>Classificação</dt><dd>{movie.age==='L'?'Livre':`${movie.age} anos`}</dd></div></dl></div>
  <TrailerButton className="cf-native-button" url={movie.trailer} title={movie.title}/>
  <div className="cf-bottom-mark" aria-hidden="true"><Film size={16}/><span>CINEASTRA / CINEMA</span></div>
 </div></aside>;
}
