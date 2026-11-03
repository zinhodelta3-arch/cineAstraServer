"use client";
import {useFilmPage} from '@/hooks/cinema/filmes/use-film-page';
import FilmProgram from './film-program';
import FilmInformation from './film-information';
import FilmDates from './film-dates';
import './film-detail.css';
export default function FilmDetail({id}){
 const film=useFilmPage(id);
 if(film.loading)return <main className="mx-auto max-w-[1240px] p-8" role="status">Carregando filme…</main>;
 if(film.error)return <main className="mx-auto max-w-[1240px] p-8" role="alert">Não foi possível carregar este filme. <button type="button" onClick={film.retry} className="text-primary underline">Tentar novamente</button></main>;
 return <main className="ca-film min-h-screen bg-background text-foreground"><div className="cf-filmstrip" aria-hidden="true"/><FilmDates film={film}/><div className="cf-frame"><FilmProgram film={film}/><FilmInformation film={film}/></div></main>;
}
