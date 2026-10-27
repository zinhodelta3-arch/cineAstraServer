import {ApiError} from '../utils/ApiError.js';
import {idString} from '../utils/dto.js';
import {instant} from './identityService.js';
const iso=value=>new Date(instant(value)).toISOString();
const dto=row=>({filmId:idString(row.id_filme),positionSeconds:row.posicao_segundos,durationSeconds:row.duracao_segundos,completed:Boolean(row.concluido),version:row.versao,updatedAt:iso(row.atualizado_em),catalogAvailable:row.status==='ATIVO'&&Boolean(row.disponivel_streaming),title:row.status==='ATIVO'&&row.disponivel_streaming?row.titulo:null});
export function createStreamingProgressService({model,identity}){
    // activeActor holds the same user lock used by profile deletion, serializing all mutations.
    const run=(profileId,context,fn)=>identity.transaction(async c=>{
        const actor=await identity.activeActor(c,context);
        if(actor.tipo_usuario!=='CLIENTE')throw ApiError.acessoNegado();
        if(!await model.profile(c,actor.id_usuario,profileId))throw ApiError.naoEncontrado();
        return fn(c);
    },context);
    return {
        list:(profileId,q,continuing,context)=>run(profileId,context,async c=>{
            const rows=await model.list(c,profileId,q,continuing),page=rows.slice(0,q.limit),last=page.at(-1);
            return {profileId,items:page.map(dto),pagination:{limit:q.limit,nextCursor:rows.length>q.limit?`${iso(last.atualizado_em)}_${idString(last.id_progresso)}`:null}};
        }),
        get:(profileId,filmId,context)=>run(profileId,context,async c=>{const row=await model.get(c,profileId,filmId);if(!row)throw ApiError.naoEncontrado();return dto(row);}),
        save:(profileId,filmId,input,context)=>run(profileId,context,async c=>{
            const old=await model.get(c,profileId,filmId);
            if(input.expectedVersion!==(old?.versao??0))throw new ApiError('Progresso alterado; consulte a versão atual',409,null,'PROGRESS_VERSION_CONFLICT');
            const film=await model.film(c,filmId);
            if(!film||film.status!=='ATIVO'||!film.disponivel_streaming)throw ApiError.naoEncontrado();
            const duration=film.duracao*60;
            if(!Number.isSafeInteger(duration)||duration<=0||duration>4294967295)throw ApiError.indisponivel();
            if(input.positionSeconds>duration)throw ApiError.validacao('Posição excede a duração do filme');
            await model.save(c,profileId,filmId,{position:input.positionSeconds,duration,completed:input.positionSeconds>=Math.ceil(duration*0.95)},Boolean(old));
            // This is client-reported resume metadata, not proof of playback or an entitlement.
            return dto(await model.get(c,profileId,filmId));
        }),
        remove:(profileId,filmId,context)=>run(profileId,context,async c=>{
            if(await model.remove(c,profileId,filmId))await identity.audit(c,'STREAMING_PROGRESS.REMOVED',filmId,context);
        })
    };
}
