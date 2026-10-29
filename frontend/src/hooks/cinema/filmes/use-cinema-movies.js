"use client";
import {useEffect,useId,useState} from 'react';
import {usePublicList} from '@/hooks/cinema/home/use-public-list';
import {cinemaMovie,cinemaCatalogPath} from '@/lib/api/cinema-movies.mjs';
import {SECTIONS} from '@/components/cinema/filmes/movie-utils';
export function useCinemaMovies(){
 const [section,setSection]=useState('em-cartaz'),[genre,setGenre]=useState('Todos'),[query,setQuery]=useState(''),[search,setSearch]=useState('');
 const [selectedMovie,setSelectedMovie]=useState(null),[sessionMovie,setSessionMovie]=useState(null);
 const suggestionsId=useId();
 useEffect(()=>{const timer=setTimeout(()=>setSearch(query),300);return()=>clearTimeout(timer);},[query]);
 const films=usePublicList(cinemaCatalogPath(search,genre));
 const genreList=usePublicList('/genres?limit=100');
 const movies=films.items.map(f=>cinemaMovie(f));
 const searching=query!==search;
 return {section,genre,query,selectedMovie,sessionMovie,suggestionsId,films,genreList,searching,
  genres:[{value:'Todos',label:'Todos'},...genreList.items.map(g=>({value:g.id_genero,label:g.nome}))],
  visibleMovies:searching?[]:movies.filter(m=>m.status===section),suggestions:movies,
  activeLabel:SECTIONS.find(s=>s.value===section)?.label,
  setGenre,setQuery,setSelectedMovie,setSessionMovie,
  changeDetailsOpen:open=>{if(!open)setSelectedMovie(null);},
  changeSection:value=>setSection(value),clearFilters:()=>{setGenre('Todos');setQuery('');}
 };
}
