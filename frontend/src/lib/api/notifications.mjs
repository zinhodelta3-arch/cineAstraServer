import { experienceRequestHref, validExperienceId } from './experience-inquiry.mjs';

export const experienceNotificationType = 'EXPERIENCE_REQUEST_CREATED';
export const notificationId=v=>typeof v==='string'&&/^[1-9]\d{0,19}$/.test(v)&&BigInt(v)<=18446744073709551615n;
const unitRoles=['SUPERVISOR','COLABORADOR'];
export function notificationHref(role){
 if(role==='ADMIN')return '/admin/notificacoes';
 if(role==='FORNECEDOR')return '/fornecedor/notificacoes';
 return unitRoles.includes(role)?'/unidade/notificacoes':'/cinema/notificacao';
}
function destination(target,role,type){
 if(!notificationId(target?.id))return null;
 const {id,kind,detailId}=target;
 const root=role==='FORNECEDOR'?'/fornecedor':unitRoles.includes(role)?'/unidade':'/cinema';
 if(kind==='support')return {href:`${root}/suporte?chamado=${id}`,label:'Abrir conversa'};
 if(kind==='adminSupport'&&role==='ADMIN')return {href:`/admin/suporte?chamado=${id}`,label:'Abrir conversa'};
 if(kind==='order'&&role==='CLIENTE')return {href:`/cinema/minhascompras?pedido=${id}`,label:'Abrir pedido'};
 if(kind==='subscription'&&role==='CLIENTE')return {href:`/cinema/perfil/assinatura${type==='CONVITE_PLANO'?'#convites':''}`,label:'Abrir assinatura'};
 if(kind==='refund'&&role==='CLIENTE')return {href:`/cinema/minhascompras/reembolso/${id}${notificationId(detailId)?`?pedido=${detailId}`:''}`,label:'Abrir reembolso'};
 if(kind==='team'&&unitRoles.includes(role)&&notificationId(detailId)){
  const section=role==='SUPERVISOR'?'entries-title':type==='TEAM_INVITATION'?'received-invites-title':'join-history-title';
  return {href:`/unidade/equipes?teamId=${id}&entrada=${detailId}#${section}`,label:type==='TEAM_INVITATION'?'Abrir convite':'Abrir solicitação'};
 }
 if(kind==='supply'&&unitRoles.includes(role))return {href:`/unidade/reposicao?solicitacao=${id}`,label:'Abrir solicitação'};
 return null;
}
export function notificationItem(row,role='CLIENTE'){
 let date=null;
 if(row.data_envio){
  const raw=String(row.data_envio),value=new Date(/[Zz]|[+-]\d{2}:?\d{2}$/.test(raw)?raw:raw.replace(' ','T')+'Z');
  if(Number.isFinite(value.getTime()))date=value.toISOString();
 }
 const experience = row.tipo === experienceNotificationType;
 const type=experience?'experience':row.tipo?.startsWith('SUPPORT')?'support':/PAYMENT|ORDER|TICKET|REFUND/.test(row.tipo||'')?'ticket':'notice';
 const label=experience?'Experiências':type==='support'?'Suporte':type==='ticket'?'Compras':row.tipo==='UNIT_COMMUNICATION'?'Comunicado da unidade':row.tipo?.startsWith('SUPPLY')?'Reposição':'Aviso da conta';
 const requestId = row.solicitacao_experiencia_id;
 const direct=destination(row.destino,role,row.tipo) ?? (experience&&validExperienceId(requestId)?{href:experienceRequestHref(requestId),label:'Abrir solicitação'}:null);
 return {id:row.id_notificacao,title:row.titulo,subject:row.titulo,description:row.mensagem||'',details:row.mensagem||'Sem mensagem adicional.',read:row.lida===true,type,label,href:direct?.href??null,linkLabel:direct?.label,createdAt:date,fields:[]};
}
