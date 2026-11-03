'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useAdminCatalogList } from '@/hooks/admin/use-admin-catalog';
import { pricingRequest } from '@/hooks/admin/use-admin-pricing';
import { useAdminSchedule } from '@/hooks/admin/use-admin-schedule';
import { useAdminSnacks } from '@/hooks/admin/use-admin-snacks';
import { useAdminStreaming } from '@/hooks/admin/use-admin-streaming';
import PricingLayout, { categories, money } from './pricing-layout';
import styles from '../catalog/catalog.module.css';

const fields = {
  inputs: [{ key: 'custo_receita', label: 'Custo da receita' }, { key: 'custo_parceria', label: 'Custo da parceria' }],
  sessions: [{ key: 'custo_local_dia', label: 'Custo diário do local' }, { key: 'custo_exibicao', label: 'Custo da exibição' }],
  films: [{ key: 'custo_streaming_dia', label: 'Custo por dia de aluguel' }, { key: 'custo_streaming_compra', label: 'Custo da compra digital' }],
  combos: [{ key: 'custo_operacional', label: 'Custo operacional' }],
  plans: [{ key: 'custo_beneficios_mensal', label: 'Benefícios mensais' }, { key: 'custo_beneficios_anual', label: 'Benefícios anuais' }, { key: 'combo_gratis_mes', label: 'Combos gratuitos por mês', count: true }]
};
const labels = { inputs: 'Insumo', sessions: 'Sessão', films: 'Filme', combos: 'Combo', plans: 'Plano' };
const categoriesByKind = { inputs: ['INPUT'], sessions: ['SESSION'], films: ['RENTAL', 'PURCHASE'], combos: ['COMBO'], plans: ['PLAN'] };
const price = text => /^(0|[1-9]\d{0,7})\.\d{2}$/.test(text);
const itemId = (kind, item) => ({ inputs: item.id_insumo, sessions: item.id_sessao, films: item.id_filme, combos: item.id_combo, plans: item.id })[kind];
const itemName = (kind, item) => {
  if (kind === 'sessions') return `${item.titulo_filme ?? 'Sessão'} · ${item.data} ${item.horario_inicio?.slice(0, 5) ?? ''} · ${item.nome_local ?? `Cinema #${item.id_local}`}`;
  if (kind === 'films') return item.titulo;
  if (kind === 'plans') return item.name;
  return `${item.nome} · ${item.id_local ? `Cinema #${item.id_local}` : 'Sem cinema'}`;
};

export default function CostsAdmin() {
  const [kind, setKind] = useState('plans');
  const [id, setId] = useState('');
  const [query, setQuery] = useState('');
  const [resource, setResource] = useState(null);
  const [category, setCategory] = useState('PLAN');
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [published, setPublished] = useState(null);
  const generation = useRef(0);
  const lock = useRef(false);
  const inputs = useAdminSnacks(kind === 'inputs' ? 'inputs?limit=100' : null);
  const sessions = useAdminSchedule(kind === 'sessions' ? 'sessions?limit=100' : null);
  const films = useAdminCatalogList(kind === 'films' ? 'films?limit=100' : null);
  const combos = useAdminSnacks(kind === 'combos' ? 'combos?limit=100' : null);
  const plans = useAdminStreaming(kind === 'plans' ? 'plans?limit=100' : null);
  const items = { inputs, sessions, films, combos, plans }[kind];
  const filtered = items.items.filter(item => `${itemName(kind, item)} #${itemId(kind, item)}`.toLocaleLowerCase('pt-BR').includes(query.trim().toLocaleLowerCase('pt-BR')));
  const selected = items.items.find(item => itemId(kind, item) === id);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const initialKind = query.get('tipo'), initialId = query.get('id');
    if (fields[initialKind] && /^[1-9]\d{0,9}$/.test(initialId ?? '')) { setKind(initialKind); setCategory(categoriesByKind[initialKind][0]); setId(initialId); }
  }, []);
  function changeKind(value) { if (lock.current) return; generation.current += 1; setKind(value); setId(''); setQuery(''); setCategory(categoriesByKind[value][0]); setResource(null); setPublished(null); setLoading(false); setError(''); setNotice(''); }
  function changeId(value) { if (lock.current) return; generation.current += 1; setId(value); setResource(null); setPublished(null); setLoading(false); setError(''); setNotice(''); }
  async function load(event) {
    event.preventDefault();
    if (lock.current) return;
    if (!/^[1-9]\d{0,9}$/.test(id) || BigInt(id) > 4294967295n) { setError('Informe um ID válido.'); return; }
    const current = ++generation.current;
    setLoading(true); setError(''); setNotice(''); setResource(null); setPublished(null);
    try { const value = await pricingRequest(`costs/${kind}/${id}`); if (current === generation.current) setResource(value); }
    catch (cause) { if (current === generation.current) setError(cause.message); }
    finally { if (current === generation.current) setLoading(false); }
  }
  async function save(event) {
    event.preventDefault();
    if (!resource || lock.current) return;
    const form = new FormData(event.currentTarget), body = {};
    for (const field of fields[kind]) {
      const raw = String(form.get(field.key) ?? '').trim().replace(',', '.');
      if (field.count) {
        const number = Number(raw);
        if (!Number.isInteger(number) || number < 0 || number > 1) { setError('O plano admite zero ou um combo gratuito por mês.'); return; }
        body[field.key] = number;
      } else if (!raw && kind === 'films') {
        continue;
      } else if (!price(raw)) { setError(`Informe ${field.label.toLocaleLowerCase('pt-BR')} com duas casas decimais.`); return; }
      else body[field.key] = raw;
    }
    if (!Object.keys(body).length) { setError('Preencha ao menos um custo.'); return; }
    lock.current = true; setPending(true); setError('');
    try { setResource(await pricingRequest(`costs/${kind}/${id}`, { method: 'PUT', body })); setPublished(null); setNotice('Custos atualizados.'); }
    catch (cause) { setError(cause.message); }
    finally { lock.current = false; setPending(false); }
  }
  async function publish() {
    if (!resource || lock.current) return;
    lock.current = true; setPending(true); setError('');
    try { const result = await pricingRequest(`publish/${category}/${id}`, { method: 'POST' }); setPublished(result); setNotice('Preço publicado.'); setConfirm(false); }
    catch (cause) { setError(cause.message); }
    finally { lock.current = false; setPending(false); }
  }

  return <PricingLayout title="Custos e preços" description="Cadastre os custos de cada item e publique o preço calculado.">
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    <section className={styles.filmPicker} aria-labelledby="costs-picker-title">
      <h2 id="costs-picker-title">Selecione o item</h2>
      <form className={styles.pickerControl} onSubmit={load}>
        <label>Tipo<select value={kind} onChange={event => changeKind(event.target.value)} disabled={pending}>{Object.keys(fields).map(value => <option key={value} value={value}>{labels[value]}</option>)}</select></label>
        <label>Buscar entre os itens carregados<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={`Buscar ${labels[kind].toLocaleLowerCase('pt-BR')}`} disabled={pending} /></label>
        <label className={styles.costItemPicker}>{labels[kind]}<select value={id} onChange={event => changeId(event.target.value)} disabled={pending || items.loading} required>
          <option value="">Selecione {labels[kind].toLocaleLowerCase('pt-BR')}</option>
          {id && !filtered.some(item => itemId(kind, item) === id) && <option value={id}>{selected ? `${itemName(kind, selected)} · #${id}` : `${labels[kind]} #${id}`}</option>}
          {filtered.map(item => <option key={itemId(kind, item)} value={itemId(kind, item)}>{itemName(kind, item)} · #{itemId(kind, item)}</option>)}
        </select></label>
        <button type="submit" className={styles.primary} disabled={loading || pending || items.loading || !id}><Search size={16} aria-hidden="true" />{loading ? 'Carregando…' : 'Consultar custos'}</button>
      </form>
      {items.loading && <p className={styles.hint} role="status">Carregando {labels[kind].toLocaleLowerCase('pt-BR')}…</p>}
      {items.error && <div role="alert"><p className={styles.error}>{items.error}</p><button type="button" className={styles.secondary} onClick={items.reload}>Tentar novamente</button></div>}
      {!items.loading && !items.error && !items.items.length && <p className={styles.hint}>Nenhum item cadastrado nesta categoria.</p>}
      {items.nextCursor && <button type="button" className={styles.secondary} onClick={items.loadMore} disabled={items.loadingMore || pending}>{items.loadingMore ? 'Carregando…' : 'Carregar mais itens'}</button>}
    </section>
    {error && !resource && <p className={styles.error} role="alert">{error}</p>}
    {resource && <section className={styles.panel} aria-labelledby="costs-title"><header className={styles.panelHeader}><div><h2 id="costs-title">{labels[kind]} #{id}</h2><p>Salve os custos antes de publicar um novo preço.</p></div></header>
      <form className={`${styles.form} ${styles.pricingForm}`} onSubmit={save}>{fields[kind].map(field => <label key={field.key}>{field.label}{field.count ? <input name={field.key} type="number" min="0" max="1" defaultValue={resource[field.key] ?? 0} required /> : <input name={field.key} inputMode="decimal" defaultValue={resource[field.key] ?? ''} placeholder={kind === 'films' ? 'Opcional' : '0.00'} required={kind !== 'films'} />}</label>)}<div className={`${styles.dialogActions} ${styles.wide}`}><button type="submit" className={styles.primary} disabled={pending}>{pending ? 'Salvando…' : 'Salvar custos'}</button></div></form>
      <div className={styles.pricingPublish}><label>Categoria do preço<select value={category} onChange={event => setCategory(event.target.value)}>{categoriesByKind[kind].map(value => <option key={value} value={value}>{categories[value]}</option>)}</select></label><button type="button" className={styles.secondary} onClick={() => { setConfirm(true); setError(''); }} disabled={pending}><Send size={16} aria-hidden="true" />Publicar preço</button></div>
      {published && <p className={styles.notice} role="status">{categories[published.category]}: {money(published.price)}{published.annualPrice != null ? ` · Anual: ${money(published.annualPrice)}` : ''}</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </section>}
    <Dialog open={confirm} onOpenChange={value => { if (!value && !lock.current) setConfirm(false); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>Publicar preço</DialogTitle><DialogDescription className={styles.dialogDescription}>O preço de {categories[category]?.toLocaleLowerCase('pt-BR')} para {labels[kind]?.toLocaleLowerCase('pt-BR')} #{id} será calculado com os custos e parâmetros atuais.</DialogDescription><div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={() => setConfirm(false)} disabled={pending}>Cancelar</button><button type="button" className={styles.primary} onClick={publish} disabled={pending}>{pending ? 'Publicando…' : 'Confirmar publicação'}</button></div>{error && <p className={styles.error} role="alert">{error}</p>}</DialogContent></Dialog>
  </PricingLayout>;
}
