import {ApiError} from '../utils/ApiError.js';
import {idString} from '../utils/dto.js';
const dto=row=>({...((typeof row.dados==='string')?JSON.parse(row.dados):row.dados),id:idString(row.id_conteudo),slug:row.slug,active:Boolean(row.ativo)});
const found=row=>{if(!row)throw ApiError.naoEncontrado();return row;};
export function createPromotionalService({model,identity}){
 const admin=(context,fn)=>identity.transaction(async c=>{if((await identity.activeActor(c,context)).tipo_usuario!=='ADMIN')throw ApiError.acessoNegado();try{return await fn(c);}catch(e){if(e.code==='ER_DUP_ENTRY')throw new ApiError('Slug já cadastrado neste tipo de conteúdo',409,null,'PROMOTIONAL_CONFLICT');throw e;}},context);
 const list=async(c,kind,q,isAdmin)=>{const rows=await model.list(c,kind,q,isAdmin),page=rows.slice(0,q.limit);return {items:page.map(dto),pagination:{limit:q.limit,nextCursor:rows.length>q.limit?idString(page.at(-1).id_conteudo):null}};};
 return {
 list:(kind,q,isAdmin,ctx)=>isAdmin?admin(ctx,c=>list(c,kind,q,true)):list(null,kind,q,false),
 get:(kind,id,isAdmin,ctx)=>isAdmin?admin(ctx,async c=>dto(found(await model.get(c,kind,id,true)))):model.get(null,kind,id,false).then(r=>dto(found(r))),
 create:(kind,input,ctx)=>admin(ctx,async c=>{const id=await model.create(c,kind,input);await identity.audit(c,'PROMOTIONAL.CREATED',id,ctx);return dto(found(await model.get(c,kind,id,true)));}),
 patch:(kind,id,input,ctx)=>admin(ctx,async c=>{const old=dto(found(await model.get(c,kind,id,true,true)));const {id:ignored,...merged}={...old,...input};await model.update(c,kind,id,merged);await identity.audit(c,'PROMOTIONAL.CHANGED',id,ctx);return dto(found(await model.get(c,kind,id,true)));})
 };
}
