'use client';

import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { Archive, Eye, Pencil, Plus, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { streamingAdminRequest, useAdminStreaming } from '@/hooks/admin/use-admin-streaming';
import { snackRequest, useAdminSnacks } from '@/hooks/admin/use-admin-snacks';
import StreamingLayout, { StreamingState, money } from './streaming-layout';
import styles from '../catalog/catalog.module.css';

function values(form) {
  const name = String(form.get('name') ?? '').trim();
  const description = String(form.get('description') ?? '').trim();
  const maxMembers = Number(form.get('maxMembers'));
  const freeCombosPerMonth = Number(form.get('freeCombosPerMonth'));
  const freeComboId = String(form.get('freeComboId') ?? '').trim();
  if (!name || name.length > 100 || description.length > 5000 || !Number.isInteger(maxMembers) || maxMembers < 1 || maxMembers > 100) throw new Error('Confira o nome, a descrição e o limite de membros.');
  if (![0, 1].includes(freeCombosPerMonth) || (freeCombosPerMonth === 1 && (!/^[1-9]\d{0,9}$/.test(freeComboId) || BigInt(freeComboId) > 4294967295n))) throw new Error('Informe um combo válido quando houver benefício mensal.');
  return { name, description: description || null, maxMembers, catalogAccess: form.has('catalogAccess'), freeCombosPerMonth, freeComboId: freeCombosPerMonth ? freeComboId : null };
}

export default function PlansAdmin() {
  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState(false);
  const [benefitCount, setBenefitCount] = useState(0);
  const [comboChoice, setComboChoice] = useState('');
  const [comboQuery, setComboQuery] = useState('');
  const [currentCombo, setCurrentCombo] = useState(null);
  const lock = useRef(false);
  const list = useAdminStreaming('plans?limit=20');
  const item = dialog?.item;
  const search = useDeferredValue(comboQuery.trim());
  const combos = useAdminSnacks(dialog?.type === 'form' && benefitCount === 1 ? `combos?limit=100&active=true${search ? `&q=${encodeURIComponent(search)}` : ''}` : null);

  useEffect(() => {
    if (!item?.freeComboId || !['form', 'view'].includes(dialog?.type)) return;
    const abort = new AbortController();
    snackRequest(`combos/${item.freeComboId}`, { signal: abort.signal }).then(combo => { if (!abort.signal.aborted) setCurrentCombo(combo); }).catch(() => { if (!abort.signal.aborted) setCurrentCombo(null); });
    return () => abort.abort();
  }, [dialog?.type, item?.freeComboId]);

  function open(type, row = null) { setError(''); setNotice(''); setBenefitCount(row?.freeCombosPerMonth ?? 0); setComboChoice(row?.freeComboId ?? ''); setComboQuery(''); setCurrentCombo(null); setDialog({ type, item: row }); }
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
    let body;
    try { body = values(new FormData(event.currentTarget)); }
    catch (cause) { setError(cause.message); return; }
    if (item) {
      body = Object.fromEntries(Object.entries(body).filter(([key, value]) => value !== item[key]));
      if (!Object.keys(body).length) { setError('Nenhuma alteração para salvar.'); return; }
    }
    run(() => streamingAdminRequest(item ? `plans/${item.id}` : 'plans', { method: item ? 'PATCH' : 'POST', body }), item ? 'Plano atualizado.' : 'Plano cadastrado.');
  }
  function changeActive() {
    if (!item) return;
    run(() => streamingAdminRequest(`plans/${item.id}`, item.active ? { method: 'DELETE' } : { method: 'PATCH', body: { active: true } }), item.active ? 'Plano arquivado.' : 'Plano ativado.');
  }

  return <StreamingLayout title="Planos" description="Gerencie os planos de assinatura e consulte os preços publicados." action={<button type="button" className={styles.primary} onClick={() => open('form')}><Plus size={16} aria-hidden="true" />Novo plano</button>}>
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    <section className={styles.panel} aria-labelledby="plans-title"><header className={styles.panelHeader}><div><h2 id="plans-title">Planos cadastrados</h2><p>Os preços são publicados no fluxo de precificação.</p></div><span className={styles.count}>{list.items.length} carregados</span></header>
      <StreamingState list={list} empty="Nenhum plano cadastrado." noun="planos" />
      {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de planos; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Planos de assinatura</caption><thead><tr><th scope="col">Plano</th><th scope="col">Membros</th><th scope="col">Mensal</th><th scope="col">Anual</th><th scope="col">Catálogo</th><th scope="col">Status</th><th scope="col">Ações</th></tr></thead><tbody>{list.items.map(row => <tr key={row.id}><th scope="row">{row.name}<small className={styles.muted}> · #{row.id}</small></th><td>{row.maxMembers}</td><td>{money(row.monthlyPrice)}</td><td>{money(row.annualPrice)}</td><td>{row.catalogAccess ? 'Incluído' : 'Não incluído'}</td><td><span className={`${styles.badge} ${row.active ? '' : styles.inactive}`}>{row.active ? 'Ativo' : 'Inativo'}</span></td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Ver detalhes" aria-label={`Ver plano ${row.name}`} onClick={() => open('view', row)}><Eye size={16} aria-hidden="true" /></button><button type="button" className={styles.iconButton} title="Editar plano" aria-label={`Editar plano ${row.name}`} onClick={() => open('form', row)}><Pencil size={16} aria-hidden="true" /></button><button type="button" className={styles.iconButton} title={row.active ? 'Arquivar plano' : 'Ativar plano'} aria-label={`${row.active ? 'Arquivar' : 'Ativar'} plano ${row.name}`} onClick={() => open('status', row)}>{row.active ? <Archive size={16} aria-hidden="true" /> : <RotateCcw size={16} aria-hidden="true" />}</button></div></td></tr>)}</tbody></table></div>}
      <footer className={styles.footer}><span>Exibindo {list.items.length} planos{list.nextCursor ? ' · há mais' : ''}</span><button type="button" onClick={list.loadMore} disabled={!list.nextCursor || list.loadingMore}>{list.loadingMore ? 'Carregando…' : 'Carregar mais'}</button></footer>
    </section>
    <Dialog open={Boolean(dialog)} onOpenChange={value => { if (!value) close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{dialog?.type === 'form' ? item ? 'Editar plano' : 'Novo plano' : dialog?.type === 'status' ? item?.active ? 'Arquivar plano' : 'Ativar plano' : item?.name}</DialogTitle><DialogDescription className={styles.dialogDescription}>{dialog?.type === 'status' ? item?.active ? 'O plano deixará de aparecer para novas contratações.' : 'A ativação exige preços e custos de benefícios válidos.' : 'Dados do plano de assinatura.'}</DialogDescription>
      {dialog?.type === 'form' && <form key={item?.id ?? 'new'} className={styles.form} onSubmit={save}><label className={styles.wide}>Nome<input name="name" defaultValue={item?.name ?? ''} maxLength={100} required /></label><label>Limite de membros<input name="maxMembers" type="number" min={1} max={100} defaultValue={item?.maxMembers ?? 1} required /></label><label>Combos gratuitos por mês<select name="freeCombosPerMonth" value={benefitCount} onChange={event => { const next = Number(event.target.value); setBenefitCount(next); if (!next) setComboChoice(''); }}><option value="0">Nenhum</option><option value="1">Um</option></select></label>{benefitCount === 1 && <div className={`${styles.wide} ${styles.comboPicker}`}><label>Combo do benefício<select name="freeComboId" value={comboChoice} onChange={event => setComboChoice(event.target.value)} required><option value="">Selecione um combo ativo</option>{comboChoice && !combos.items.some(combo => combo.id_combo === comboChoice) && <option value={comboChoice}>{currentCombo?.id_combo === comboChoice ? `${currentCombo.nome} · #${comboChoice}` : `Combo #${comboChoice} (atual ou fora da busca)`}</option>}{combos.items.map(combo => <option key={combo.id_combo} value={combo.id_combo}>{combo.nome} · {combo.id_local ? `Cinema #${combo.id_local}` : 'Sem cinema'} · #{combo.id_combo}</option>)}</select></label><label>Buscar combo<input type="search" value={comboQuery} onChange={event => setComboQuery(event.target.value)} maxLength={150} placeholder="Nome do combo" /></label>{combos.loading && <p className={styles.hint} role="status">Carregando combos…</p>}{combos.error && <p className={styles.error} role="alert">{combos.error}</p>}{currentCombo?.id_combo === comboChoice && !currentCombo.ativo && <p className={styles.hint}>O combo atual está inativo. Selecione outro antes de ativar o plano.</p>}{combos.nextCursor && <button type="button" className={styles.secondary} onClick={combos.loadMore} disabled={combos.loadingMore}>{combos.loadingMore ? 'Carregando…' : 'Mais combos'}</button>}</div>}<div className={styles.checks}><label><input type="checkbox" name="catalogAccess" defaultChecked={item?.catalogAccess ?? false} />Acesso ao catálogo</label></div><label className={styles.wide}>Descrição<textarea name="description" defaultValue={item?.description ?? ''} maxLength={5000} /></label><div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={close}>Cancelar</button><button type="submit" className={styles.primary} disabled={pending}>{pending ? 'Salvando…' : 'Salvar plano'}</button></div></form>}
      {dialog?.type === 'view' && item && <dl className={styles.detailGrid}><div><dt>Nome</dt><dd>{item.name}</dd></div><div><dt>Status</dt><dd>{item.active ? 'Ativo' : 'Inativo'}</dd></div><div><dt>Mensal</dt><dd>{money(item.monthlyPrice)}</dd></div><div><dt>Anual</dt><dd>{money(item.annualPrice)}</dd></div><div><dt>Limite de membros</dt><dd>{item.maxMembers}</dd></div><div><dt>Catálogo</dt><dd>{item.catalogAccess ? 'Incluído' : 'Não incluído'}</dd></div><div><dt>Combo mensal</dt><dd>{item.freeComboId ? currentCombo?.id_combo === item.freeComboId ? `${currentCombo.nome} · #${item.freeComboId}` : `#${item.freeComboId}` : 'Nenhum'}</dd></div><div><dt>Custo mensal de benefícios</dt><dd>{money(item.monthlyBenefitCost)}</dd></div><div><dt>Custo anual de benefícios</dt><dd>{money(item.annualBenefitCost)}</dd></div><div><dt>Descrição</dt><dd>{item.description || '—'}</dd></div></dl>}
      {dialog?.type === 'status' && <div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={close}>Cancelar</button><button type="button" className={item?.active ? styles.danger : styles.primary} disabled={pending} onClick={changeActive}>{pending ? 'Aguarde…' : item?.active ? 'Arquivar plano' : 'Ativar plano'}</button></div>}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </DialogContent></Dialog>
  </StreamingLayout>;
}
