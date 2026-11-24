import FilmDetail from '@/components/cinema/filmes/film-detail';
import {permanentRedirect} from 'next/navigation';
import {catalogRecord} from '@/lib/api/catalog-record';
export default async function Page({params}){
 const {slug}=await params;
 const record=await catalogRecord('films',slug);
 if(record.slug&&slug!==record.slug)permanentRedirect(`/cinema/filmes/${encodeURIComponent(record.slug)}`);
 return <FilmDetail id={record.id_filme} initialFilm={record}/>;
}
