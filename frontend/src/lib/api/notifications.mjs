export const notificationId=v=>typeof v==='string'&&/^[1-9]\d{0,19}$/.test(v)&&BigInt(v)<=18446744073709551615n;
export function notificationItem(row){
 let date=null;
 if(row.data_envio){
  const raw=String(row.data_envio),value=new Date(/[Zz]|[+-]\d{2}:?\d{2}$/.test(raw)?raw:raw.replace(' ','T')+'Z');
  if(Number.isFinite(value.getTime()))date=value.toISOString();
 }
 const type=row.tipo?.startsWith('SUPPORT')?'support':/PAYMENT|ORDER|TICKET/.test(row.tipo||'')?'ticket':'notice';
 const label=type==='support'?'Suporte':type==='ticket'?'Compras':'Aviso da conta';
 return {id:row.id_notificacao,title:row.titulo,subject:row.titulo,description:row.mensagem||'',details:row.mensagem||'Sem mensagem adicional.',read:row.lida===true,type,label,createdAt:date,fields:[{label:'Identificador',value:row.id_notificacao},...(row.tipo?[{label:'Tipo',value:row.tipo}]:[])]};
}
