"use client";

import { useEffect, useId, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePublicList } from '@/hooks/cinema/home/use-public-list';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { cinemaMovie, cinemaCatalogPath, moviePageSizes, readCinemaCatalogUrl, updateCinemaCatalogUrl } from '@/lib/api/cinema-movies.mjs';
import { publicGet } from '@/lib/api/public-api.mjs';
import { SECTIONS } from '@/components/cinema/filmes/movie-utils';

function navigate(patch, replace = false) {
 const url = new URL(window.location.href);
 updateCinemaCatalogUrl(url.searchParams, { ...readCinemaCatalogUrl(url.searchParams), ...patch });
 if (url.href !== window.location.href) window.history[replace ? 'replaceState' : 'pushState'](null, '', url);
}

export function useCinemaMovies() {
 const params = useSearchParams();
 const urlKey = params.toString();
 const { page, pageSize, search, genre, section } = readCinemaCatalogUrl(params);
 const [draft, setDraft] = useState(null);
 const [selectedMovie, setSelectedMovie] = useState(null), [sessionMovie, setSessionMovie] = useState(null);
 const suggestionsId = useId();
 const query = draft?.urlKey === urlKey ? draft.value : search;
 const searching = query.trim() !== search;
 const path = cinemaCatalogPath(search, genre, section, {page, pageSize});

 useEffect(() => {
  if (!searching) return;
  const timer = setTimeout(() => {
   if (new URL(window.location.href).searchParams.toString() !== urlKey) return;
   navigate({search:query.trim(), page:1});
   setDraft(null);
  }, 300);
  return () => clearTimeout(timer);
 }, [query, searching, urlKey]);

 const listed = usePaginatedList(path, publicGet, { mode:'resource' });
 const pagination = listed.data?.pagination;
 const currentPage = pagination?.page ?? page;
 const totalPages = pagination?.totalPages;
 useEffect(() => {
  if (pagination && currentPage !== page && new URL(window.location.href).searchParams.toString() === urlKey) {
   navigate({ page:currentPage }, true);
  }
 }, [currentPage, page, pagination, urlKey]);

 function goToPage(next) {
  if (!listed.loading && !searching && Number.isInteger(next) && next >= 1 && next <= (totalPages ?? currentPage)) navigate({ page:next });
 }
 const films = {
  ...listed, page:currentPage, pageSize, total:pagination?.total, totalPages, hasNext:currentPage < totalPages,
  goToPage, nextPage:() => goToPage(currentPage + 1), previousPage:() => goToPage(currentPage - 1),
  setPageSize:size => { if (moviePageSizes.includes(size)) navigate({ pageSize:size, page:1 }); },
 };

 const genreList = usePublicList('/genres?limit=100');
 const movies = films.items.map(film => cinemaMovie(film));
 const loadedGenres = genreList.items.map(item => ({ value:String(item.id_genero), label:item.nome }));
 const genres = [{ value:'Todos', label:'Todos' }, ...loadedGenres];
 if (genre !== 'Todos' && !loadedGenres.some(item => item.value === genre)) genres.push({ value:genre, label:'Gênero selecionado' });
 function changeFilter(patch) {
  navigate({ search:query.trim(), ...patch, page:1 });
  setDraft(null);
 }
 return {
  section, genre, query, selectedMovie, sessionMovie, suggestionsId, films, genreList, searching, genres,
  visibleMovies:searching ? [] : movies, suggestions:movies,
  activeLabel:SECTIONS.find(item => item.value === section)?.label,
  setGenre:value => changeFilter({ genre:value }),
  setQuery:value => setDraft({ urlKey, value }),
  setSelectedMovie, setSessionMovie,
  changeDetailsOpen:open => { if (!open) setSelectedMovie(null); },
  changeSection:value => changeFilter({ section:value }),
  clearFilters:() => changeFilter({ genre:'Todos', search:'' }),
 };
}
