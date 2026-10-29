import {publicAsset, safeLink} from './public-api.mjs';
export function cinemaMovie(film, today = new Date().toLocaleDateString('sv-SE',{timeZone:'America/Sao_Paulo'})) {
 const releaseDate=film.data_lancamento?.slice(0,10)||null;
 return {id:String(film.id_filme),title:film.titulo,synopsis:film.descricao||'Sinopse ainda não informada.',poster:publicAsset(film.imagem),duration:film.duracao,age:film.classificacao,releaseDate,status:releaseDate&&releaseDate>today?'em-breve':'em-cartaz',genres:[],sessions:[],formats:[],director:film.diretor,trailer:safeLink(film.trailer)};
}
export function cinemaCatalogPath(query, genre) {
 const params=new URLSearchParams({cinema:'true',limit:'20'});
 if(query.trim())params.set('titulo',query.trim());
 if(genre!=='Todos')params.set('genreId',genre);
 return `/films?${params}`;
}
