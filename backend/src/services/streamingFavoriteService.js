import {ApiError} from '../utils/ApiError.js';
import {idString} from '../utils/dto.js';
import {instant} from './identityService.js';
export function createStreamingFavoriteService({model,identity}){
    // The parent user lock in activeActor also serializes profile deletion and duplicate additions.
    const run=(profileId,context,fn)=>identity.transaction(async c=>{
        const actor=await identity.activeActor(c,context);
        if(actor.tipo_usuario!=='CLIENTE')throw ApiError.acessoNegado();
        if(!await model.profile(c,actor.id_usuario,profileId))throw ApiError.naoEncontrado();
        return fn(c);
    },context);
    return {
        list:(profileId,query,context)=>run(profileId,context,async c=>{
            const rows=await model.list(c,profileId,query),page=rows.slice(0,query.limit);
            return {profileId,items:page.map(row=>{
                const available=row.status==='ATIVO'&&Boolean(row.disponivel_streaming);
                return {id:idString(row.id_favorito),filmId:idString(row.id_filme),addedAt:new Date(instant(row.criado_em)).toISOString(),catalogAvailable:available,
                    film:available?{title:row.titulo,duration:row.duracao,classification:row.classificacao}:null};
            }),pagination:{limit:query.limit,nextCursor:rows.length>query.limit?idString(page.at(-1).id_favorito):null}};
        }),
        add:(profileId,filmId,context)=>run(profileId,context,async c=>{
            // An existing favorite stays idempotent even if the title subsequently leaves the catalog.
            if(await model.existing(c,profileId,filmId))return;
            const film=await model.film(c,filmId);
            if(!film||film.status!=='ATIVO'||!film.disponivel_streaming)throw ApiError.naoEncontrado();
            await model.add(c,profileId,filmId);
            await identity.audit(c,'STREAMING_FAVORITE.ADDED',filmId,context);
        }),
        remove:(profileId,filmId,context)=>run(profileId,context,async c=>{
            if(await model.remove(c,profileId,filmId))await identity.audit(c,'STREAMING_FAVORITE.REMOVED',filmId,context);
        })
    };
}
