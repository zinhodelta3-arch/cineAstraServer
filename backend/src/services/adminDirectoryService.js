import {ApiError} from '../utils/ApiError.js';
import {idString} from '../utils/dto.js';
import {instant} from './identityService.js';
const date=v=>v==null?null:new Date(instant(v)).toISOString();
const user=row=>({id:idString(row.id_usuario),name:row.nome,email:row.email,role:row.tipo_usuario,status:row.status,createdAt:date(row.data_cadastro)});
const privacy=row=>({id:idString(row.id_solicitacao),user:{id:idString(row.id_usuario),name:row.nome,email:row.email},type:row.tipo,status:row.status,createdAt:date(row.criada_em),closedAt:date(row.encerrada_em)});
export function createAdminDirectoryService({model,identity}){
 const list=(kind,q,context)=>identity.transaction(async c=>{
  if((await identity.activeActor(c,context)).tipo_usuario!=='ADMIN')throw ApiError.acessoNegado();
  const rows=await model[kind](c,q),page=rows.slice(0,q.limit),pk=kind==='users'?'id_usuario':'id_solicitacao';
  return {items:page.map(kind==='users'?user:privacy),pagination:{limit:q.limit,nextCursor:rows.length>q.limit?idString(page.at(-1)[pk]):null}};
 },context);
 return {users:(q,c)=>list('users',q,c),privacy:(q,c)=>list('privacy',q,c)};
}
