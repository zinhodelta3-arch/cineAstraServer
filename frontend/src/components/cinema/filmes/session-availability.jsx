export function sessionAvailability(session){
 const remaining=session.availableSeats;
 if(!Number.isInteger(remaining))return {label:'Disponibilidade indisponível',bookable:false};
 if(remaining===0)return {label:session.activeSeats===0?'Sem assentos ativos':'Lotada',bookable:false};
 const low=remaining<=5||remaining<=session.activeSeats*.15;
 return {label:low?`Últimos lugares · ${remaining}`:`${remaining} ${remaining===1?'lugar disponível':'lugares disponíveis'}`,bookable:true,low};
}

const shortDate=date=>date.split('-').slice(1).reverse().join('/');

export function SessionAlternatives({availability,localId,date,onSelect}){
 if(availability.error)return <p role="alert" className="my-3 text-sm">{availability.error}</p>;
 const options=availability.items.filter(item=>item.nextDate&&(item.localId!==localId||item.nextDate!==date))
  .sort((a,b)=>Number(b.localId===localId)-Number(a.localId===localId)||`${a.nextDate}${a.nextTime}`.localeCompare(`${b.nextDate}${b.nextTime}`)).slice(0,3);
 if(!options.length)return null;
 return <section aria-label="Horários alternativos" className="my-4 grid gap-2 rounded-lg border border-dashed border-border p-3 text-sm">
  <h3 className="font-semibold">Horários alternativos</h3>
  {options.map(item=><button key={item.localId} type="button" className="flex min-h-10 flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-md border border-border px-3 py-2 text-left hover:border-primary focus-visible:outline-2 focus-visible:outline-ring" onClick={()=>onSelect(item.localId,item.nextDate)}>
   <span>{item.name}</span><strong className="text-primary">{shortDate(item.nextDate)} · {item.nextTime}</strong>
  </button>)}
 </section>;
}
