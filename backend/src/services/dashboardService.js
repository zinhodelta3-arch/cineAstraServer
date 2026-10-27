import {ApiError} from '../utils/ApiError.js';
import {idString} from '../utils/dto.js';
const count=v=>String(BigInt(String(v??0)));
const cents=v=>{const s=String(v??'0');if(!/^\d+(?:\.\d{1,2})?$/.test(s))throw new TypeError('Valor inválido');const [a,b='']=s.split('.');return BigInt(a)*100n+BigInt(b.padEnd(2,'0'));};
const money=v=>`${v/100n}.${String(v%100n).padStart(2,'0')}`;
const ratio=(n,d)=>BigInt(d??0)===0n?null:Number((BigInt(n??0)*10000n+BigInt(d)/2n)/BigInt(d))/100;
const occupancy=r=>({sessionCount:count(r.session_count),completedSessions:count(r.completed_sessions),seatCapacity:count(r.capacity),confirmedSeats:count(r.occupied),occupancyPercent:ratio(r.occupied,r.capacity)});
export function createDashboardService({model,identity}){return {get:(q,context)=>identity.transaction(async c=>{
 if((await identity.activeActor(c,context)).tipo_usuario!=='ADMIN')throw ApiError.acessoNegado();
 const start=q.from+' 00:00:00',end=new Date(Date.parse(q.to+'T00:00:00Z')+86400000).toISOString().slice(0,10)+' 00:00:00';
 const daily=await model.daily(c,q,start,end),types=await model.types(c,q,start,end),movies=await model.movies(c,q,start,end),total=await model.occupancy(c,q,start,end),rooms=await model.rooms(c,q,start,end);
 const byDate=new Map(daily.map(v=>[v.day,v])),series=[];let tickets=0n,revenue=0n;
 for(let t=Date.parse(q.from+'T00:00:00Z');t<Date.parse(end.slice(0,10)+'T00:00:00Z');t+=86400000){const date=new Date(t).toISOString().slice(0,10),row=byDate.get(date);const n=BigInt(row?.tickets??0),v=cents(row?.revenue);tickets+=n;revenue+=v;series.push({date,tickets:String(n),ticketSalesValue:money(v)});}
 return {period:{from:q.from,to:q.to,timeZone:'UTC'},localId:q.localId??null,currency:'BRL',sales:{tickets:String(tickets),ticketSalesValue:money(revenue)},daily:series,ticketTypes:['INTEIRA','MEIA','ISENTA','UNKNOWN'].map(type=>{const n=types.find(r=>r.type===type)?.tickets??0;return {type,tickets:count(n),sharePercent:ratio(n,tickets)};}),occupancy:occupancy(total),rooms:rooms.slice(0,100).map(r=>({id:idString(r.id),localId:idString(r.local_id),name:r.name,...occupancy(r)})),roomsTruncated:rooms.length>100,topMovies:movies.map(r=>({id:idString(r.id),title:r.title,tickets:count(r.tickets),ticketSalesValue:money(cents(r.revenue))})),notes:['Vendas por primeira captura do pedido, uma vez por item de sessão; valor dos itens, sem dedução de estornos e sem rateio adicional. Não é caixa líquido.','Ocupação atual de assentos confirmados nas sessões cuja data pertence ao período, excluindo canceladas; capacidade atual das salas, sem histórico de alterações. Reservas temporárias não contam.','Sessões realizadas significa status ENCERRADA; não presume realização pelo horário. Tipos reais: INTEIRA, MEIA, ISENTA; UNKNOWN identifica legado sem tipo.']};
},context)};}
