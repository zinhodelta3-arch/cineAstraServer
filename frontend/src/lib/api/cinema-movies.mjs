import {publicAsset, safeLink} from './public-api.mjs';
import {cinemaProgram} from './cinema-program.mjs';
export function cinemaMovie(film, today) {
 const releaseDate=film.data_lancamento?.slice(0,10)||null;
 return {id:String(film.id_filme),slug:film.slug,title:film.titulo,synopsis:film.descricao||'Sinopse ainda não informada.',poster:publicAsset(film.imagem),banner:publicAsset(film.banner),duration:film.duracao,age:film.classificacao,releaseDate,...cinemaProgram(film,today),genres:Array.isArray(film.generos)?film.generos.map(g=>g.nome):[],sessions:[],formats:[],director:film.diretor,trailer:safeLink(film.trailer)};
}
export function cinemaCatalogPath(query, genre, section, { page, pageSize = 20 } = {}) {
 const params=new URLSearchParams({cinema:'true',limit:String(pageSize)});
 if(query.trim())params.set('titulo',query.trim());
 if(genre!=='Todos')params.set('genreId',genre);
 if(section)params.set('upcoming',String(section!=='em-cartaz'));
 if(page&&section!=='em-cartaz'&&section)params.set('sale',section==='pre-venda'?'open':'closed');
 if(page)params.set('page',String(page));
 return `/films?${params}`;
}

export const moviePageSizes = [10, 20, 50];
const validCatalogId = (value) => /^[1-9]\d{0,9}$/.test(value ?? '') && Number(value) <= 4294967295;

export function readCinemaCatalogUrl(params) {
 const page = params.get('pagina'), genre = params.get('genero'), size = Number(params.get('porPagina'));
 return {
  page:validCatalogId(page) ? Number(page) : 1,
  pageSize:moviePageSizes.includes(size) ? size : 20,
  genre:validCatalogId(genre) ? genre : 'Todos',
  section:['em-breve','pre-venda'].includes(params.get('aba')) ? params.get('aba') : 'em-cartaz',
  search:(params.get('q') ?? '').trim().slice(0, 200),
 };
}

export function updateCinemaCatalogUrl(params, state) {
 for (const [name, value] of [
  ['pagina', state.page > 1 ? state.page : null],
  ['porPagina', state.pageSize !== 20 ? state.pageSize : null],
  ['genero', state.genre !== 'Todos' ? state.genre : null],
  ['aba', state.section !== 'em-cartaz' ? state.section : null],
  ['q', state.search],
 ]) {
  if (value) params.set(name, String(value));
  else params.delete(name);
 }
}
