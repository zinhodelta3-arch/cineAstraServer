import FilmDetail from '@/components/cinema/filmes/film-detail';
import {notFound} from 'next/navigation';
export default async function Page({params}){
 const {slug}=await params;
 if(!/^[1-9]\d*$/.test(slug))notFound();
 return <FilmDetail id={slug}/>;
}
