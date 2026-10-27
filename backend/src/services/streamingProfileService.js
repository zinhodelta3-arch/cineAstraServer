import {ApiError} from '../utils/ApiError.js';
import {idString} from '../utils/dto.js';
const dto=row=>({id:idString(row.id_perfil),name:row.nome,avatar:row.avatar,kids:Boolean(row.infantil),selected:Boolean(row.selecionado),photoUrl:row.tem_foto?`/api/streaming/profiles/${idString(row.id_perfil)}/photo`:null});
const nameKey=name=>name.normalize('NFC').trim().toLocaleLowerCase('pt-BR');
const conflict=(message,code)=>new ApiError(message,409,null,code);
export function createStreamingProfileService({model,identity}){
    // activeActor locks the parent user FOR UPDATE until commit. All profile mutations
    // share that lock, including the empty-list case, so limits/names/selection serialize.
    const run=(context,fn)=>identity.transaction(async c=>{
        const actor=await identity.activeActor(c,context);
        if(actor.tipo_usuario!=='CLIENTE')throw ApiError.acessoNegado();
        const owner=idString(actor.id_usuario),rows=await model.list(c,owner);
        return fn(c,owner,rows);
    },context);
    const own=(rows,id)=>{const row=rows.find(r=>idString(r.id_perfil)===id);if(!row)throw ApiError.naoEncontrado();return row;};
    const unique=(rows,name,id)=>{if(rows.some(r=>idString(r.id_perfil)!==id&&nameKey(r.nome)===nameKey(name)))throw conflict('Já existe um perfil com esse nome','PROFILE_NAME_CONFLICT');};
    async function save(fn){try{return await fn();}catch(e){if(e.code==='ER_DUP_ENTRY')throw conflict('Já existe um perfil com esse nome','PROFILE_NAME_CONFLICT');throw e;}}
    return {
        list:context=>run(context,async(c,owner,rows)=>({items:rows.map(dto),activeProfileId:rows.find(r=>r.selecionado)?idString(rows.find(r=>r.selecionado).id_perfil):null,maxProfiles:5})),
        get:(id,context)=>run(context,async(c,owner,rows)=>dto(own(rows,id))),
        create:(input,context)=>run(context,async(c,owner,rows)=>{
            if(rows.length>=5)throw conflict('Limite de cinco perfis atingido','PROFILE_LIMIT');
            unique(rows,input.name);
            const id=await save(()=>model.insert(c,owner,{...input,selected:rows.length===0},nameKey(input.name)));
            await identity.audit(c,'STREAMING_PROFILE.CREATED',id,context);
            return dto(own(await model.list(c,owner),id));
        }),
        patch:(id,input,context)=>run(context,async(c,owner,rows)=>{
            const data={...dto(own(rows,id)),...input};unique(rows,data.name,id);
            await save(()=>model.update(c,owner,id,data,nameKey(data.name)));
            await identity.audit(c,'STREAMING_PROFILE.UPDATED',id,context);
            return dto(own(await model.list(c,owner),id));
        }),
        remove:(id,context)=>run(context,async(c,owner,rows)=>{
            const row=own(rows,id);
            if(rows.length<=1)throw conflict('Mantenha pelo menos um perfil','PROFILE_LAST_REQUIRED');
            await model.remove(c,owner,id);
            if(row.selecionado)await model.select(c,owner,idString(rows.find(r=>idString(r.id_perfil)!==id).id_perfil));
            await identity.audit(c,'STREAMING_PROFILE.REMOVED',id,context);
        }),
        select:(id,context)=>run(context,async(c,owner,rows)=>{
            own(rows,id);await model.select(c,owner,id);
            await identity.audit(c,'STREAMING_PROFILE.SELECTED',id,context);
            return dto(own(await model.list(c,owner),id));
        })
    };
}
