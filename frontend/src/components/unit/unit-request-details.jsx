'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { unitOperation } from '@/hooks/unit/use-unit-data';
import UnitLayout, { label, dateTime } from './unit-layout';
import styles from './unit.module.css';

export default function UnitRequestDetails({id}) {
  const [result,setResult]=useState(null);
  useEffect(()=>{
    if(!id)return;
    const controller=new AbortController();
    unitOperation(`/requests/${id}`,{signal:controller.signal}).then(data=>{
      if(!controller.signal.aborted)setResult({data});
    }).catch(error=>{if(!controller.signal.aborted)setResult({error:error.message});});
    return ()=>controller.abort();
  },[id]);
  const detail=result?.data;
  return <UnitLayout title={id?`Solicitação de reposição #${id}`:'Solicitação de reposição'} description="Consulte o item, a decisão e o andamento da entrega.">
    <section className={styles.panel}><div className={styles.body}>
      {!id&&<p role="alert">Solicitação inválida.</p>}
      {id&&!result&&<p role="status">Carregando solicitação…</p>}
      {result?.error&&<p role="alert">{result.error}</p>}
      {detail&&<dl className={styles.list}>
        <div><dt>Item</dt><dd>{detail.nome_item||'—'}</dd></div>
        <div><dt>Quantidade</dt><dd>{detail.quantidade}</dd></div>
        <div><dt>Situação</dt><dd>{label(detail.status)}</dd></div>
        {detail.status_supervisao&&<div><dt>Supervisão</dt><dd>{label(detail.status_supervisao)}</dd></div>}
        <div><dt>Registrada em</dt><dd>{dateTime(detail.data_solicitacao)}</dd></div>
        {detail.entrega&&<div><dt>Entrega #{detail.entrega.id_logistica}</dt><dd>{label(detail.entrega.status)}</dd></div>}
        {detail.observacao&&<div><dt>Observação</dt><dd className="whitespace-pre-wrap break-words">{detail.observacao}</dd></div>}
      </dl>}
      <Link href="/unidade/astrasnack" prefetch={false} className={styles.secondary}>Abrir operação do AstraSnack</Link>
    </div></section>
  </UnitLayout>;
}
