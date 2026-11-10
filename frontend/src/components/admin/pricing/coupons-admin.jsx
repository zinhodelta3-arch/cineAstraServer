'use client';

import TablePagination from '@/components/ui/table-pagination';
import { useRef, useState } from 'react';
import { Archive, Pencil, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { pricingRequest, usePricingList } from '@/hooks/admin/use-admin-pricing';
import PricingLayout, { PricingState } from './pricing-layout';
import styles from '../catalog/catalog.module.css';

const activeState = row => !row.active ? 'Inativo' : String(row.expiresOn).slice(0, 10) < new Date().toISOString().slice(0, 10) ? 'Expirado' : 'Ativo';

export default function CouponsAdmin() {
  const list = usePricingList('coupons?limit=20');
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
    const code = String(form.get('code') ?? '').trim().toUpperCase();
    const discount = String(form.get('discountPercent') ?? '').trim().replace(',', '.');
    const expiresOn = String(form.get('expiresOn') ?? '');
    const usageLimit = Number(form.get('usageLimit'));
    if (!/^[A-Z0-9_-]{1,50}$/.test(code) || !/^\d{1,3}(?:\.\d{1,2})?$/.test(discount) || Number(discount) <= 0 || Number(discount) > 100 || !/^\d{4}-\d{2}-\d{2}$/.test(expiresOn) || !Number.isInteger(usageLimit) || usageLimit < 0 || usageLimit > 2147483647) { setError('Confira o código, o desconto, a validade e o limite de usos.'); return; }
    const body = { codigo: code, desconto: Number(discount).toFixed(2), validade: expiresOn, limite_uso: usageLimit, ativo: form.has('active') };
    if (item) {
      const previous = { codigo: item.code, desconto: String(item.discountPercent), validade: String(item.expiresOn).slice(0, 10), limite_uso: item.usageLimit, ativo: item.active };
      for (const key of Object.keys(body)) if (body[key] === previous[key]) delete body[key];
      if (!Object.keys(body).length) { setError('Nenhuma alteração para salvar.'); return; }
    }
    run(() => pricingRequest(item ? `coupons/${item.id}` : 'coupons', { method: item ? 'PATCH' : 'POST', body }), item ? 'Cupom atualizado.' : 'Cupom criado.');
  }

  return <PricingLayout title="Cupons" description="Gerencie códigos de desconto e limites de uso." action={<button type="button" className={styles.primary} onClick={() => open('form')}><Plus size={16} aria-hidden="true" />Novo cupom</button>}>
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    <section className={styles.panel} aria-labelledby="coupons-title"><header className={styles.panelHeader}><div><h2 id="coupons-title">Cupons cadastrados</h2><p>Mais recentes primeiro.</p></div><span className={styles.count}>{list.items.length} carregados</span></header>
      <PricingState list={list} empty="Nenhum cupom cadastrado." noun="cupons" />
      {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de cupons; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Cupons de desconto</caption><thead><tr><th scope="col">Código</th><th scope="col">Desconto</th><th scope="col">Validade</th><th scope="col">Limite de usos</th><th scope="col">Status</th><th scope="col">Ações</th></tr></thead><tbody>{list.items.map(row => <tr key={row.id}><th scope="row">{row.code}<small className={styles.muted}> · #{row.id}</small></th><td>{Number(row.discountPercent).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}%</td><td>{String(row.expiresOn).slice(0, 10).split('-').reverse().join('/')}</td><td>{row.usageLimit === 0 ? 'Sem limite' : row.usageLimit}</td><td><span className={`${styles.badge} ${activeState(row) === 'Ativo' ? '' : styles.inactive}`}>{activeState(row)}</span></td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Editar cupom" aria-label={`Editar cupom ${row.code}`} onClick={() => open('form', row)}><Pencil size={16} aria-hidden="true" /></button>{row.active && <button type="button" className={styles.iconButton} title="Arquivar cupom" aria-label={`Arquivar cupom ${row.code}`} onClick={() => open('archive', row)}><Archive size={16} aria-hidden="true" /></button>}</div></td></tr>)}</tbody></table></div>}
      <TablePagination list={list} />
    </section>
    <Dialog open={Boolean(dialog)} onOpenChange={value => { if (!value) close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{dialog?.type === 'archive' ? 'Arquivar cupom' : item ? 'Editar cupom' : 'Novo cupom'}</DialogTitle><DialogDescription className={styles.dialogDescription}>{dialog?.type === 'archive' ? `O cupom ${item?.code} deixará de ser aplicado.` : 'Defina o desconto, a validade e o limite de usos.'}</DialogDescription>
      {dialog?.type === 'form' && <form key={item?.id ?? 'new'} className={styles.form} onSubmit={save}><label>Código<input name="code" defaultValue={item?.code ?? ''} maxLength={50} placeholder="EXEMPLO10" required /></label><label>Desconto (%)<input name="discountPercent" type="number" min="0.01" max="100" step="0.01" defaultValue={item?.discountPercent ?? ''} required /></label><label>Validade<input name="expiresOn" type="date" defaultValue={item ? String(item.expiresOn).slice(0, 10) : ''} required /></label><label>Limite de usos<input name="usageLimit" type="number" min="0" max="2147483647" defaultValue={item?.usageLimit ?? 0} required /></label><div className={`${styles.checks} ${styles.wide}`}><label><input name="active" type="checkbox" defaultChecked={item?.active ?? true} />Ativo</label></div><p className={`${styles.hint} ${styles.wide}`}>Use zero para não limitar a quantidade de usos.</p><div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={close}>Cancelar</button><button type="submit" className={styles.primary} disabled={pending}>{pending ? 'Salvando…' : 'Salvar cupom'}</button></div></form>}
      {dialog?.type === 'archive' && <div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={close}>Cancelar</button><button type="button" className={styles.danger} disabled={pending} onClick={() => run(() => pricingRequest(`coupons/${item.id}`, { method: 'DELETE' }), 'Cupom arquivado.')}>{pending ? 'Aguarde…' : 'Arquivar'}</button></div>}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </DialogContent></Dialog>
  </PricingLayout>;
}
