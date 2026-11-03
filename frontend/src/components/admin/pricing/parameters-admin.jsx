'use client';

import { useRef, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { pricingRequest, usePricingList } from '@/hooks/admin/use-admin-pricing';
import PricingLayout, { PricingState, categories, percent, toBps } from './pricing-layout';
import styles from '../catalog/catalog.module.css';

const fields = [
  { name: 'markupBps', key: 'markup_bps', label: 'Markup', max: 30000 },
  { name: 'minMarginBps', key: 'margem_alerta_bps', label: 'Margem de alerta' },
  { name: 'discountCapBps', key: 'teto_desconto_bps', label: 'Teto de desconto' },
  { name: 'halfProjectionBps', key: 'meia_projecao_bps', label: 'Projeção de meia' },
  { name: 'comboStepBps', key: 'combo_passo_bps', label: 'Passo do combo' }
];

export default function ParametersAdmin() {
  const list = usePricingList('parameters');
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  function open(row) { setError(''); setNotice(''); setItem(row); }
  function close() { if (!lock.current) setItem(null); }
  async function save(event) {
    event.preventDefault();
    if (!item || lock.current) return;
    const form = new FormData(event.currentTarget);
    let body;
    try {
      body = Object.fromEntries(fields.map(field => [field.key, toBps(form.get(field.key), field.max ?? 10000)]));
      const occupancy = Number(form.get('ocupacao_referencia'));
      if (!Number.isInteger(occupancy) || occupancy < 1 || occupancy > 65535) throw new Error('Informe uma ocupação de referência válida.');
      body.ocupacao_referencia = occupancy;
      body = Object.fromEntries(Object.entries(body).filter(([key, value]) => value !== (key === 'ocupacao_referencia' ? item.referenceOccupancy : item[fields.find(field => field.key === key)?.name])));
      if (!Object.keys(body).length) throw new Error('Nenhuma alteração para salvar.');
    } catch (cause) { setError(cause.message); return; }
    lock.current = true; setPending(true); setError('');
    try { await pricingRequest(`parameters/${item.category}`, { method: 'PUT', body }); setItem(null); setNotice('Parâmetros atualizados.'); list.reload(); }
    catch (cause) { setError(cause.message); }
    finally { lock.current = false; setPending(false); }
  }

  return <PricingLayout title="Parâmetros" description="Defina as regras usadas no cálculo dos preços e descontos.">
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    <section className={styles.panel} aria-labelledby="parameters-title"><header className={styles.panelHeader}><div><h2 id="parameters-title">Parâmetros por categoria</h2><p>Valores percentuais são exibidos em %.</p></div><span className={styles.count}>{list.items.length} categorias</span></header>
      <PricingState list={list} empty="Nenhum parâmetro cadastrado." noun="parâmetros" />
      {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de parâmetros; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Parâmetros de precificação</caption><thead><tr><th scope="col">Categoria</th><th scope="col">Markup</th><th scope="col">Margem alerta</th><th scope="col">Teto desconto</th><th scope="col">Ocupação</th><th scope="col">Ações</th></tr></thead><tbody>{list.items.map(row => <tr key={row.category}><th scope="row">{categories[row.category] ?? row.category}</th><td>{percent(row.markupBps)}</td><td>{percent(row.minMarginBps)}</td><td>{percent(row.discountCapBps)}</td><td>{row.referenceOccupancy}</td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Editar parâmetros" aria-label={`Editar parâmetros de ${categories[row.category] ?? row.category}`} onClick={() => open(row)}><Pencil size={16} aria-hidden="true" /></button></div></td></tr>)}</tbody></table></div>}
    </section>
    <Dialog open={Boolean(item)} onOpenChange={value => { if (!value) close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>Parâmetros · {categories[item?.category] ?? item?.category}</DialogTitle><DialogDescription className={styles.dialogDescription}>Informe percentuais com até duas casas decimais.</DialogDescription>
      {item && <form key={item.category} className={styles.form} onSubmit={save}>{fields.map(field => <label key={field.key}>{field.label} (%)<input name={field.key} type="number" min="0" max={(field.max ?? 10000) / 100} step="0.01" defaultValue={item[field.name] / 100} required /></label>)}<label>Ocupação de referência<input name="ocupacao_referencia" type="number" min="1" max="65535" defaultValue={item.referenceOccupancy} required /></label><div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={close}>Cancelar</button><button type="submit" className={styles.primary} disabled={pending}>{pending ? 'Salvando…' : 'Salvar parâmetros'}</button></div></form>}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </DialogContent></Dialog>
  </PricingLayout>;
}
