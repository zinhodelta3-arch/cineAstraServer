'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Radio } from 'lucide-react';
import { operationKey } from '@/lib/api/operation-key.mjs';
import { unitOperation, useUnitList } from '@/hooks/unit/use-unit-data';
import UnitLayout, { UnitFeedback, UnitListState } from './unit-layout';
import styles from './unit.module.css';

const alertTypes=[
  ['stock','Insumos com estoque baixo','/unidade/astrasnack'],
  ['supply','Solicitações de reposição pendentes','/unidade/astrasnack'],
  ['orders','Pedidos presenciais pendentes','/unidade/atendimento'],
  ['sessions','Sessões atrasadas','/unidade/sessoes'],
  ['absences','Ingressos sem presença registrada nas últimas 24 horas','/unidade/atendimento'],
  ['equipment','Equipamentos em manutenção ou indisponíveis','/unidade/astrasnack'],
];

export default function UnitCommunication() {
  const [snapshot,setSnapshot]=useState(null);
  const [alertError,setAlertError]=useState('');
  const [version,setVersion]=useState(0);
  const [audience,setAudience]=useState('ALL');
  const [search,setSearch]=useState('');
  const [selected,setSelected]=useState([]);
  const [feedback,setFeedback]=useState({});
  const [pending,setPending]=useState(false);
  const attempt=useRef(null);
  const recipients=useUnitList(audience==='SELECTED'?`/communications/recipients?limit=20${search?`&q=${encodeURIComponent(search)}`:''}`:null,unitOperation);

  useEffect(()=>{
    const controller=new AbortController();
    unitOperation('/communications/alerts',{signal:controller.signal}).then(data=>{
      if(!controller.signal.aborted)setSnapshot(data);
    }).catch(error=>{
      if(!controller.signal.aborted)setAlertError(error.message);
    });
    return ()=>controller.abort();
  },[version]);

  const toggle=id=>setSelected(ids=>ids.includes(id)?ids.filter(value=>value!==id):[...ids,id]);

  async function send(event) {
    event.preventDefault();
    if(pending)return;
    const form=event.currentTarget;
    const fields=new FormData(form);
    const body={title:fields.get('title').trim(),message:fields.get('message').trim(),audience,
      ...(audience==='SELECTED'&&{recipientIds:[...selected].sort()})};
    if(!body.title||!body.message||audience==='SELECTED'&&!selected.length){
      setFeedback({error:'Preencha o assunto, a mensagem e escolha os destinatários.'});
      return;
    }
    const content=JSON.stringify(body);
    setPending(true);setFeedback({});
    try {
      if(attempt.current?.content!==content)attempt.current={content,key:operationKey()};
      const result=await unitOperation('/communications',{method:'POST',body:{...body,requestId:attempt.current.key}});
      attempt.current=null;
      form.reset();setAudience('ALL');setSelected([]);setSearch('');
      setFeedback({notice:result.delivered?`Comunicado enviado a ${result.delivered} colaborador(es).`:'O comunicado já havia sido enviado.'});
    } catch(error){setFeedback({error:error.message});}
    finally{setPending(false);}
  }

  return <UnitLayout title="Comunicação da unidade" description="Envie comunicados à equipe e acompanhe as ocorrências do cinema." location={snapshot?.location.name}>
    <section className={styles.panel} aria-labelledby="unit-alerts">
      <div className={styles.panelHeader}><div><h2 id="unit-alerts">Alertas da unidade</h2><p>Dados da operação do seu cinema.</p></div>
        <button type="button" className={styles.secondary} disabled={!snapshot&&!alertError} onClick={()=>{setSnapshot(null);setAlertError('');setVersion(value=>value+1);}}>Atualizar alertas</button>
      </div>
      <div className={styles.body}>
        <UnitFeedback error={alertError} />
        {!snapshot&&!alertError&&<p role="status">Carregando alertas…</p>}
        {snapshot&&<ul className={styles.list}>{alertTypes.map(([key,title,href])=>{
          const count=snapshot.counts[key];
          return <li key={key}><strong>{title}</strong>{count>0?<Link href={href} prefetch={false} className={styles.secondary} aria-label={`${count} · ${title}`}>{count} · Ver operação</Link>:<span className={styles.muted}>0</span>}</li>;
        })}</ul>}
      </div>
    </section>
    <section className={styles.panel} aria-labelledby="unit-broadcast">
      <div className={styles.panelHeader}><div><h2 id="unit-broadcast">Novo comunicado</h2><p>O aviso aparece nas notificações dos colaboradores com vínculo ativo na unidade.</p></div></div>
      <div className={styles.body}>
        <UnitFeedback {...feedback} />
        {audience==='SELECTED'&&<form className={styles.row} onSubmit={event=>{event.preventDefault();setSearch(new FormData(event.currentTarget).get('q').trim());}}>
          <label className="flex flex-wrap items-center gap-2">Buscar colaborador<input name="q" type="search" maxLength={100} className="rounded-md border border-input bg-background px-3 py-2" /></label>
          <button type="submit" className={styles.secondary}>Buscar</button>
        </form>}
        <form className={styles.form} onSubmit={send}>
          <label>Destinatários<select value={audience} disabled={pending} onChange={event=>setAudience(event.target.value)}><option value="ALL">Todos os colaboradores ativos da unidade</option><option value="SELECTED">Selecionar colaboradores</option></select></label>
          {audience==='SELECTED'&&<fieldset className="col-span-full rounded-lg border border-border p-3">
            <legend className="px-1 text-sm font-semibold">Colaboradores selecionados ({selected.length})</legend>
            <UnitListState list={recipients} empty="Nenhum colaborador encontrado." />
            <ul className="max-h-52 space-y-1 overflow-y-auto">{recipients.items.map(member=><li key={member.id}><label className="flex min-h-9 items-center gap-2">
              <input type="checkbox" checked={selected.includes(member.id)} disabled={pending||selected.length>=100&&!selected.includes(member.id)} onChange={()=>toggle(member.id)} />{member.name}
            </label></li>)}</ul>
            {recipients.nextCursor&&<button type="button" className={styles.secondary} onClick={recipients.loadMore} disabled={recipients.loadingMore}>Mais colaboradores</button>}
            {selected.length>0&&<button type="button" className={styles.secondary} disabled={pending} onClick={()=>setSelected([])}>Limpar seleção</button>}
          </fieldset>}
          <label>Assunto<input name="title" maxLength={170} required disabled={pending} /></label>
          <label className="col-span-full">Mensagem<textarea name="message" rows={4} maxLength={2000} required disabled={pending} /></label>
          <div className="col-span-full"><button type="submit" className={styles.primary} disabled={pending||!snapshot||audience==='SELECTED'&&!selected.length}><Radio size={16} aria-hidden="true" />{pending?'Enviando…':'Enviar comunicado'}</button></div>
        </form>
      </div>
    </section>
  </UnitLayout>;
}
