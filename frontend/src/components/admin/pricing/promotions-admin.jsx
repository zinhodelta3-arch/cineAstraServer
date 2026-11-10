'use client';

import TablePagination from '@/components/ui/table-pagination';
import { useRef, useState } from 'react';
import { Archive, Pencil, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { pricingRequest, usePricingList } from '@/hooks/admin/use-admin-pricing';
import PricingLayout, { PricingState, categories, dateTime, localDateTime, percent, toBps, utcTime } from './pricing-layout';
import styles from '../catalog/catalog.module.css';

const currentState = row => !row.active ? 'Inativa' : utcTime(row.endsAt).getTime() <= Date.now() ? 'Encerrada' : utcTime(row.startsAt).getTime() > Date.now() ? 'Agendada' : 'Ativa';

export default function PromotionsAdmin() {
  const list = usePricingList('promotions?limit=20');
  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const item = dialog?.item;
  function open(type, row = null) { setError(''); setNotice(''); setDialog({ type, item: row }); }
  function close() { if (!lock.current) setDialog(null); }
  async function run(task, message) {
    if (lock.current) return;
    lock.current = true; setPending(true); setError('');
    try { await task(); setDialog(null); setNotice(message); list.reload(); }
    catch (cause) { setError(cause.message); }
    finally { lock.current = false; setPending(false); }
  }
  function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') ?? '').trim();
    const start = new Date(String(form.get('startsAt') ?? ''));
    const end = new Date(String(form.get('endsAt') ?? ''));
    let discountBps;
    try { discountBps = toBps(form.get('discountPercent')); }
    catch (cause) { setError(cause.message); return; }
    if (!name || name.length > 120 || discountBps < 1 || !Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) { setError('Confira nome, desconto e período da promoção.'); return; }
    const body = {
      nome: name, desconto_bps: discountBps, publico_geral: form.has('publicGeneral'),
      inicio: start.toISOString(), fim: end.toISOString(), ativo: form.has('active')
    };
    if (!item) body.categoria = String(form.get('category'));
    if (item) {
      const previous = { nome: item.name, desconto_bps: item.discountBps, publico_geral: item.publicGeneral, inicio: utcTime(item.startsAt).toISOString(), fim: utcTime(item.endsAt).toISOString(), ativo: item.active };
      for (const key of Object.keys(body)) if (body[key] === previous[key]) delete body[key];
      if (!Object.keys(body).length) { setError('Nenhuma alteração para salvar.'); return; }
    }
    run(() => pricingRequest(item ? `promotions/${item.id}` : 'promotions', { method: item ? 'PATCH' : 'POST', body }), item ? 'Promoção atualizada.' : 'Promoção criada.');
  }

  return <PricingLayout title="Promoções" description="Configure descontos por categoria e período." action={<button type="button" className={styles.primary} onClick={() => open('form')}><Plus size={16} aria-hidden="true" />Nova promoção</button>}>
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    <section className={styles.panel} aria-labelledby="promotions-title"><header className={styles.panelHeader}><div><h2 id="promotions-title">Promoções cadastradas</h2><p>Mais recentes primeiro.</p></div><span className={styles.count}>{list.items.length} carregadas</span></header>
      <PricingState list={list} empty="Nenhuma promoção cadastrada." noun="promoções" />
      {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de promoções; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Promoções</caption><thead><tr><th scope="col">Promoção</th><th scope="col">Categoria</th><th scope="col">Desconto</th><th scope="col">Início</th><th scope="col">Fim</th><th scope="col">Status</th><th scope="col">Ações</th></tr></thead><tbody>{list.items.map(row => <tr key={row.id}><th scope="row">{row.name}<small className={styles.muted}> · #{row.id}</small></th><td>{categories[row.category] ?? row.category}</td><td>{percent(row.discountBps)}</td><td>{dateTime(row.startsAt)}</td><td>{dateTime(row.endsAt)}</td><td><span className={`${styles.badge} ${currentState(row) === 'Ativa' ? '' : styles.inactive}`}>{currentState(row)}</span></td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Editar promoção" aria-label={`Editar promoção ${row.name}`} onClick={() => open('form', row)}><Pencil size={16} aria-hidden="true" /></button>{row.active && <button type="button" className={styles.iconButton} title="Arquivar promoção" aria-label={`Arquivar promoção ${row.name}`} onClick={() => open('archive', row)}><Archive size={16} aria-hidden="true" /></button>}</div></td></tr>)}</tbody></table></div>}
      <TablePagination list={list} />
    </section>
    <Dialog open={Boolean(dialog)} onOpenChange={value => { if (!value) close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{dialog?.type === 'archive' ? 'Arquivar promoção' : item ? 'Editar promoção' : 'Nova promoção'}</DialogTitle><DialogDescription className={styles.dialogDescription}>{dialog?.type === 'archive' ? `A promoção ${item?.name} deixará de ser aplicada.` : 'Defina a categoria, o desconto e o período de validade.'}</DialogDescription>
      {dialog?.type === 'form' && <form key={item?.id ?? 'new'} className={styles.form} onSubmit={save}><label className={styles.wide}>Nome<input name="name" defaultValue={item?.name ?? ''} maxLength={120} required /></label><label>Categoria<select name="category" defaultValue={item?.category ?? 'SESSION'} disabled={Boolean(item)}>{Object.entries(categories).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Desconto (%)<input name="discountPercent" type="number" min="0.01" max="100" step="0.01" defaultValue={item ? item.discountBps / 100 : ''} required /></label><label>Início<input name="startsAt" type="datetime-local" defaultValue={localDateTime(item?.startsAt)} required /></label><label>Fim<input name="endsAt" type="datetime-local" defaultValue={localDateTime(item?.endsAt)} required /></label><div className={`${styles.checks} ${styles.wide}`}><label><input name="publicGeneral" type="checkbox" defaultChecked={item?.publicGeneral ?? false} />Público geral</label><label><input name="active" type="checkbox" defaultChecked={item?.active ?? true} />Ativa</label></div><div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={close}>Cancelar</button><button type="submit" className={styles.primary} disabled={pending}>{pending ? 'Salvando…' : 'Salvar promoção'}</button></div></form>}
      {dialog?.type === 'archive' && <div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={close}>Cancelar</button><button type="button" className={styles.danger} disabled={pending} onClick={() => run(() => pricingRequest(`promotions/${item.id}`, { method: 'DELETE' }), 'Promoção arquivada.')}>{pending ? 'Aguarde…' : 'Arquivar'}</button></div>}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </DialogContent></Dialog>
  </PricingLayout>;
}
