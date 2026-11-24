'use client';

import {useMemo,useRef,useState} from 'react';
import {Armchair,MoveHorizontal,Plus} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent,DialogDescription,DialogTitle} from '@/components/ui/dialog';
import useSeatLayout from '@/hooks/use-seat-layout';
import SeatMap from './seat-map';
import RoomScenePublisher from './room-scene-publisher';
import {seatFromRoom,seatType} from './seat-layout.mjs';
import styles from './seat-selection.module.css';

const placeNames={CINEMA:'Cinema',DRIVE_IN:'Drive-in',SALAO_EVENTOS:'Salão de eventos',ESTACIONAMENTO:'Estacionamento',
  ESTADIO:'Estádio',PRACA:'Praça',ESPACO_PUBLICO:'Espaço público',OUTRO:'Outro espaço'};
const eventSpaces=new Set(['SALAO_EVENTOS','ESTADIO','PRACA','ESPACO_PUBLICO','OUTRO']);
const templates={
  cinema:{label:'Cinema com corredor central',rows:4,blocks:2,width:5,gap:1},
  vip:{label:'Sala VIP',rows:3,blocks:2,width:3,gap:2},
  drive:{label:'Drive-in em setores',rows:3,blocks:2,width:4,gap:2},
  event:{label:'Plateia de evento',rows:4,blocks:3,width:4,gap:1},
  row:{label:'Fileiras inteiras',rows:1,blocks:1,width:8,gap:0}
};
const maxPosition=2147483647;
function nextRow(value,index) {
  let number=[...value].reduce((count,char)=>count*26+char.charCodeAt(0)-64,0)+index;
  let row='';
  while(number){number--;row=String.fromCharCode(65+number%26)+row;number=Math.floor(number/26);}
  return row;
}
const key=(row,number)=>`${row}:${number}`;
const countActive=rows=>rows.filter(row=>row.status==='ATIVA').length;
function duplicate(records,field) {
  const seen=new Set();
  for(const record of records) {
    const position=field==='position'?record.posicao_visual??record.numero:record.numero;
    const slot=key(record.fileira,position);
    if(seen.has(slot))return `A fileira ${record.fileira} já tem um assento com ${field==='position'?'a posição':'o número'} ${position}.`;
    seen.add(slot);
  }
  return '';
}

function SeatBatch({layout,submit,pending,screenLabel}) {
  const firstTemplate=layout.spaceType==='DRIVE_IN'||layout.spaceType==='ESTACIONAMENTO'?'drive'
    : eventSpaces.has(layout.spaceType)?'event':layout.room.tipo==='VIP'?'vip':'cinema';
  const [template,setTemplate]=useState(firstTemplate);
  function fitPreset(value) {
    const preset=templates[value];
    const remaining=Math.max(1,layout.room.capacidade-countActive(layout.seats));
    const blocks=Math.min(preset.blocks,remaining);
    const width=Math.min(preset.width,Math.floor(remaining/blocks));
    return {...preset,blocks,width,rows:Math.min(preset.rows,Math.floor(remaining/(blocks*width)))};
  }
  const [config,setConfig]=useState(()=>({...fitPreset(firstTemplate),firstRow:'A',firstNumber:1,firstPosition:1}));
  const [special,setSpecial]=useState({});
  const [selected,setSelected]=useState(null);
  const {rows,blocks,width,gap,firstRow,firstNumber,firstPosition}=config;
  const total=rows*blocks*width, rowSize=blocks*width;
  const lastPosition=firstPosition+rowSize+(blocks-1)*gap-1;
  const valid=/^[A-Z]{1,4}$/.test(firstRow)&&[rows,blocks,width,firstNumber,firstPosition].every(value=>Number.isInteger(value)&&value>0)
    &&Number.isInteger(gap)&&gap>=0&&rows<=100&&blocks<=12&&width<=100&&gap<=12&&total<=400
    &&lastPosition<=maxPosition&&firstNumber+rowSize-1<=maxPosition;
  const draft=valid?Array.from({length:total},(_,index)=>{
    const indexInRow=index%rowSize;
    const fileira=nextRow(firstRow,Math.floor(index/rowSize)),numero=firstNumber+indexInRow;
    const id_assento=key(fileira,numero);
    return {id_assento,fileira,numero,status:'ATIVA',tipo:special[id_assento]??'COMUM',
      posicao_visual:firstPosition+indexInRow+Math.floor(indexInRow/width)*gap};
  }):[];
  const chosen=draft.find(row=>row.id_assento===selected);
  const all=[...layout.seats,...draft];
  const error=!valid?'Confira as medidas. Cada lote permite até 400 lugares.'
    :countActive(all)>layout.room.capacidade?`A sala tem espaço para mais ${Math.max(0,layout.room.capacidade-countActive(layout.seats))} assentos ativos.`
    :duplicate(all,'number')||duplicate(all,'position');
  const preview=(error?draft:all).map(seatFromRoom);
  const update=(name,value)=>setConfig(current=>({...current,[name]:value}));
  function changeTemplate(value) {
    setTemplate(value);setSpecial({});setSelected(null);
    setConfig(current=>({...current,...fitPreset(value)}));
  }
  return <form className={styles.layoutForm} onSubmit={event=>{
    event.preventDefault();
    if(error||!draft.length)return;
    submit('batch',{seats:draft.map(({fileira,numero,posicao_visual,tipo,status})=>({fileira,numero,posicao_visual,tipo,status}))});
  }}>
    <div className={styles.layoutFields}>
      <label>Modelo inicial<select value={template} onChange={event=>changeTemplate(event.target.value)}>
        {Object.entries(templates).map(([value,preset])=><option key={value} value={value}>{preset.label}</option>)}
      </select></label>
      <label>Primeira fileira<input value={firstRow} maxLength={4} pattern="[A-Z]{1,4}" onChange={event=>update('firstRow',event.target.value.toUpperCase())} required /></label>
      {[
        ['rows','Fileiras',1,100],['blocks','Blocos por fileira',1,12],['width','Assentos por bloco',1,100],
        ['gap','Largura do corredor',0,12],['firstNumber','Primeiro número',1,maxPosition],['firstPosition','Primeira posição',1,maxPosition]
      ].map(([name,label,min,max])=><label key={name}>{label}<input type="number" min={min} max={max} value={config[name]|| (config[name]===0?0:'')}
        onChange={event=>update(name,event.target.value===''?null:Number(event.target.value))} required /></label>)}
    </div>
    {error&&<p className="text-sm text-destructive" role="alert">{error}</p>}
    <p className="text-sm font-semibold">{draft.length} lugares na prévia</p>
    <SeatMap seats={preview} selectedSeat={selected} onSeatSelect={id=>setSelected(draft.some(row=>row.id_assento===id)?id:null)} screenLabel={screenLabel} />
    {chosen&&<label className={styles.specialField}>Tipo de {chosen.fileira}{chosen.numero}<select value={chosen.tipo} onChange={event=>setSpecial(current=>({...current,[chosen.id_assento]:event.target.value}))}>
      {Object.entries(seatType).map(([value,label])=><option key={value} value={value}>{label}</option>)}
    </select></label>}
    <div className="flex justify-end"><Button type="submit" disabled={pending||Boolean(error)||!draft.length}>{pending?'Salvando…':'Cadastrar assentos'}</Button></div>
  </form>;
}

function PositionEditor({layout,submit,pending,screenLabel}) {
  const [row,setRow]=useState('');
  const [start,setStart]=useState('1');
  const [shift,setShift]=useState('1');
  const rows=[...new Set(layout.seats.map(seat=>seat.fileira))];
  const valid=Number.isInteger(Number(start))&&Number(start)>0&&Number.isInteger(Number(shift))&&Number(shift)!==0;
  const moves=[];
  const model=layout.seats.map(seat=>{
    const position=seat.posicao_visual??seat.numero;
    if(!valid||(row&&seat.fileira!==row)||position<Number(start))return seat;
    const next=position+Number(shift);
    moves.push({seatId:seat.id_assento,position:next});
    return {...seat,posicao_visual:next};
  });
  const error=!moves.length?'Escolha um trecho com assentos.'
    :moves.length>400?'Selecione até 400 assentos por vez.'
    :moves.some(move=>move.position<1||move.position>maxPosition)?'O deslocamento deixa assentos fora do mapa.':duplicate(model,'position');
  return <form className={styles.layoutForm} onSubmit={event=>{event.preventDefault();if(!error)submit('positions',{moves});}}>
    <div className={styles.layoutFields}>
      <label>Fileira<select value={row} onChange={event=>setRow(event.target.value)}><option value="">Todas</option>{rows.map(label=><option key={label}>{label}</option>)}</select></label>
      <label>A partir da posição<input type="number" min="1" required value={start} onChange={event=>setStart(event.target.value)} /></label>
      <label>Deslocar colunas<input type="number" min={-maxPosition} max={maxPosition} required value={shift} onChange={event=>setShift(event.target.value)} /></label>
    </div>
    <p className="text-sm text-muted-foreground">Use um valor positivo para mover à direita e um negativo para mover à esquerda.</p>
    {error&&<p className="text-sm text-destructive" role="alert">{error}</p>}
    <SeatMap seats={(error?layout.seats:model).map(seatFromRoom)} screenLabel={screenLabel} />
    <div className="flex justify-end"><Button type="submit" disabled={pending||Boolean(error)}>{pending?'Salvando…':'Aplicar posições'}</Button></div>
  </form>;
}

export default function RoomSeatWorkspace({path,request,canManage,revision=0,onAdd,onEdit,onArchive,onChanged}) {
  const resource=useSeatLayout(`${path}/seat-map`,request,revision);
  const [dialog,setDialog]=useState(null),[selected,setSelected]=useState(null);
  const [pending,setPending]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const lock=useRef(false);
  const layout=resource.data;
  const seats=useMemo(()=>(layout?.seats??[]).map(seatFromRoom),[layout]);
  const current=layout?.seats.find(row=>row.id_assento===selected);
  const screenLabel=eventSpaces.has(layout?.spaceType)?'Palco':'Tela';
  async function submit(type,body) {
    if(lock.current)return;
    lock.current=true;setPending(true);setError('');
    try {
      await request(`${path}/${type==='batch'?'seats/batch':'seat-map'}`,{method:type==='batch'?'POST':'PATCH',body});
      setNotice(type==='batch'?'Assentos cadastrados.':'Posições atualizadas.');
      setDialog(null);resource.reload();onChanged?.();
    } catch(cause){setError(cause.message);}
    finally{lock.current=false;setPending(false);}
  }
  if(resource.loading)return <p role="status">Carregando mapa da sala…</p>;
  if(resource.error)return <div role="alert" className="space-y-2"><p>{resource.error}</p><Button variant="outline" onClick={resource.reload}>Tentar novamente</Button></div>;
  if(!layout)return null;
  return <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">{placeNames[layout.spaceType]} · {countActive(layout.seats)} de {layout.room.capacidade} lugares ativos</p>
      {canManage&&<div className="flex flex-wrap gap-2">
        {onAdd&&<Button type="button" variant="outline" disabled={layout.structureLocked} onClick={onAdd}><Plus size={15} aria-hidden="true" />Novo assento</Button>}
        <Button type="button" variant="outline" disabled={layout.structureLocked} onClick={()=>{setError('');setNotice('');setDialog('batch');}}><Armchair size={15} aria-hidden="true" />Cadastrar em lote</Button>
        <Button type="button" variant="outline" disabled={!seats.length} onClick={()=>{setError('');setNotice('');setDialog('positions');}}><MoveHorizontal size={15} aria-hidden="true" />Ajustar corredores</Button>
      </div>}
    </div>
    {canManage&&layout.structureLocked&&<p className="text-sm text-muted-foreground">Esta sala tem sessões vinculadas. Você pode reorganizar as posições e os corredores.</p>}
    {notice&&<p role="status" className="text-sm">{notice}</p>}
    {current&&<div className="flex flex-wrap items-center gap-2 rounded-md border border-border p-3 text-sm">
      <strong>{current.fileira}{current.numero} · {seatType[current.tipo]}</strong><span>Posição {current.posicao_visual??current.numero}</span>
      {canManage&&onEdit&&<Button size="sm" variant="outline" onClick={()=>onEdit(current)}>Editar assento</Button>}
      {canManage&&onArchive&&!layout.structureLocked&&current.status==='ATIVA'&&<Button size="sm" variant="outline" onClick={()=>onArchive(current)}>Arquivar</Button>}
    </div>}
    <SeatMap seats={seats} onSeatSelect={setSelected} selectedSeat={selected} screenLabel={screenLabel} />
    {canManage&&<RoomScenePublisher key={path} path={path} request={request} seats={layout.seats} />}
    <Dialog open={Boolean(dialog)} onOpenChange={open=>{if(!open&&!lock.current)setDialog(null);}}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-4xl">
        <DialogTitle>{dialog==='batch'?'Cadastrar assentos em lote':'Ajustar corredores e posições'}</DialogTitle>
        <DialogDescription>{dialog==='batch'?'Escolha um modelo, ajuste as medidas e selecione os lugares especiais na prévia.':'Confira a prévia antes de aplicar. Os lugares mantêm seus números, tipos e estados.'}</DialogDescription>
        {error&&<p className="text-sm text-destructive" role="alert">{error}</p>}
        {dialog==='batch'&&<SeatBatch layout={layout} submit={submit} pending={pending} screenLabel={screenLabel} />}
        {dialog==='positions'&&<PositionEditor layout={layout} submit={submit} pending={pending} screenLabel={screenLabel} />}
      </DialogContent>
    </Dialog>
  </div>;
}
