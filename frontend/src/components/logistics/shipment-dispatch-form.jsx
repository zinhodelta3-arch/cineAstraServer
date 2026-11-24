'use client';

import { useState } from 'react';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import styles from '@/components/admin/catalog/catalog.module.css';

const kilometers = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const transportName = row => row.identificacao ? `${row.nome} · ${row.identificacao}` : row.nome;

export default function ShipmentDispatchForm({ shipment, request, edit = false, pending, onSubmit, onClose }) {
  const list = usePaginatedList(`logistics/${shipment.id_logistica}/dispatch-options?limit=10`, request);
  const [selected, setSelected] = useState(null);
  const { route, preferred } = list.data ?? {};
  const savedId = shipment.id_transporte ?? '';
  const choice = selected ?? (edit ? savedId : preferred?.id_transporte ?? '');
  const options = [...list.items];
  if (preferred && !options.some(row => row.id_transporte === preferred.id_transporte)) options.unshift(preferred);
  if (edit && savedId && !options.some(row => row.id_transporte === savedId)) options.unshift({ id_transporte: savedId, nome: shipment.nome_transporte || `Transporte #${savedId}` });

  function save(event) {
    event.preventDefault();
    if (!edit) return onSubmit({ transportId: choice });
    const note = new FormData(event.currentTarget).get('note').trim() || null;
    onSubmit({ note, ...(selected !== null && selected !== savedId && { transportId: selected || null }) });
  }

  return <form className={styles.form} onSubmit={save}>
    {list.loading && <p className={`${styles.hint} ${styles.wide}`} role="status">Consultando rota e transportes…</p>}
    {list.error && <div className={styles.wide} role="alert"><p className={styles.error}>{list.error}</p><button type="button" className={styles.secondary} onClick={list.reload}>Tentar novamente</button></div>}
    {list.data && <p className={`${styles.hint} ${styles.wide}`}>{route ? `Rota cadastrada · ${kilometers.format(Number(route.distancia_km))} km · ${route.tempo_estimado_min} min de viagem estimada` : 'Sem rota de referência para este percurso.'}</p>}
    <label className={styles.wide}>{edit ? 'Transporte planejado' : 'Transporte'}<select value={choice} required={!edit} disabled={list.loading || pending} onChange={event => setSelected(event.target.value)}>
      <option value="">{edit ? 'Definir no envio' : 'Selecione um transporte'}</option>
      {options.map(row => <option key={row.id_transporte} value={row.id_transporte}>{transportName(row)}{row.id_transporte === preferred?.id_transporte ? ' (sugerido)' : ''}</option>)}
    </select></label>
    {!edit && list.data && !options.length && <p className={`${styles.hint} ${styles.wide}`}>Nenhum transporte ativo e livre para este fornecedor.</p>}
    {list.nextCursor && <button type="button" className={styles.secondary} disabled={list.loadingMore || pending} onClick={list.loadMore}>Mais transportes</button>}
    {edit && <label className={styles.wide}>Observação<textarea name="note" defaultValue={shipment.observacao ?? ''} maxLength={2000} /></label>}
    <div className={`${styles.dialogActions} ${styles.wide}`}>
      <button type="button" className={styles.secondary} onClick={onClose} disabled={pending}>Voltar</button>
      <button type="submit" className={styles.primary} disabled={pending || (!edit && (!choice || Boolean(list.error) || list.loading))}>{pending ? 'Aguarde…' : edit ? 'Salvar entrega' : 'Confirmar envio'}</button>
    </div>
  </form>;
}
