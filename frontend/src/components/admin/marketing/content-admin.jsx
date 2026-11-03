'use client';

import { useEffect, useState } from 'react';
import { Eye, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { marketingRequest } from '@/hooks/admin/use-admin-marketing';
import MarketingLayout, { dateTime } from './marketing-layout';
import styles from '../catalog/catalog.module.css';
import local from './marketing.module.css';

const sections = [
  ['business', 'Empresa'], ['team', 'Equipe'], ['history', 'História'], ['reputation', 'Reputação'], ['partners', 'Parceiros'],
  ['social-campaigns', 'Campanhas sociais'], ['terms', 'Termos'], ['privacy', 'Privacidade'], ['faq', 'Perguntas frequentes']
];
const emptyFaq = () => [{ question: '', answer: '' }];

export default function ContentAdmin() {
  const [documents, setDocuments] = useState({}), [loading, setLoading] = useState(true), [loadError, setLoadError] = useState('');
  const [dialog, setDialog] = useState(null), [faqItems, setFaqItems] = useState(emptyFaq), [pending, setPending] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true); setLoadError('');
    Promise.allSettled(sections.map(([slug]) => marketingRequest(`content/${slug}`, { signal: abort.signal }))).then(results => {
      if (abort.signal.aborted) return;
      const next = {};
      results.forEach((result, index) => { if (result.status === 'fulfilled') next[sections[index][0]] = result.value.published === false ? null : result.value; });
      const failed = results.filter(result => result.status === 'rejected');
      setDocuments(next);
      if (failed.length) setLoadError(failed[0].reason?.message ?? 'Não foi possível consultar todos os conteúdos.');
    }).finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [revision]);
  function open(type, slug) { setError(''); setNotice(''); const current = documents[slug]; setFaqItems(current?.body?.items?.length ? current.body.items : emptyFaq()); setDialog({ type, slug, current }); }
  function close() { if (!pending) setDialog(null); }
  function updateFaq(index, key, value) { setFaqItems(items => items.map((item, position) => position === index ? { ...item, [key]: value } : item)); }
  async function publish(event) {
    event.preventDefault();
    if (pending || !dialog) return;
    const form = new FormData(event.currentTarget), value = key => String(form.get(key) ?? '').trim();
    const body = dialog.slug === 'business' ? {
      legalName: value('legalName'), cnpj: value('cnpj').replace(/\D/g, ''), physicalAddress: value('physicalAddress'), email: value('email'),
      supportChannels: value('supportChannels').split('\n').map(line => line.trim()).filter(Boolean)
    } : dialog.slug === 'faq' ? { items: faqItems.map(item => ({ question: item.question.trim(), answer: item.answer.trim() })) } : { text: value('text') };
    const payload = { slug: dialog.slug, version: value('version'), title: value('title'), body, source: value('source') };
    if (!/^[A-Za-z0-9._-]{1,50}$/.test(payload.version) || payload.title.length < 2 || !payload.source) { setError('Confira versão, título e URL da fonte.'); return; }
    if (dialog.slug === 'faq' && (!faqItems.length || faqItems.some(item => item.question.trim().length < 3 || !item.answer.trim()))) { setError('Preencha ao menos uma pergunta e resposta.'); return; }
    if (dialog.slug === 'business' && (body.cnpj.length !== 14 || body.physicalAddress.length < 10 || !body.supportChannels.length || body.supportChannels.length > 10 || body.supportChannels.some(channel => channel.length < 3 || channel.length > 200))) { setError('Confira CNPJ, endereço e até 10 canais de suporte.'); return; }
    setPending(true); setError('');
    try { await marketingRequest('content', { method: 'POST', body: payload }); setDialog(null); setNotice(`Versão ${payload.version} de ${sections.find(([slug]) => slug === payload.slug)?.[1]} publicada.`); setRevision(value => value + 1); }
    catch (cause) { setError(cause.message); }
    finally { setPending(false); }
  }

  return <MarketingLayout title="Conteúdo" description="Consulte as versões atuais e publique informações institucionais.">
    {notice && <p className={styles.notice} role="status">{notice}</p>}{loadError && <p className={styles.error} role="alert">{loadError} <button type="button" onClick={() => setRevision(value => value + 1)}>Tentar novamente</button></p>}
    <section className={styles.panel} aria-labelledby="content-title"><header className={styles.panelHeader}><div><h2 id="content-title">Conteúdo publicado</h2><p>Cada publicação substitui a versão exibida para aquele assunto.</p></div><span className={styles.count}>{sections.length} assuntos</span></header>
      {loading ? <p className={styles.state} role="status">Carregando conteúdo…</p> : <div className={styles.tableWrap} role="region" aria-label="Tabela de conteúdo; deslize horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Conteúdo institucional</caption><thead><tr><th scope="col">Assunto</th><th scope="col">Título atual</th><th scope="col">Versão</th><th scope="col">Publicado em</th><th scope="col">Ações</th></tr></thead><tbody>{sections.map(([slug, name]) => { const row = documents[slug], known = Object.hasOwn(documents, slug); return <tr key={slug}><th scope="row">{name}</th><td>{known ? row?.title ?? 'Ainda não publicado' : 'Consulta indisponível'}</td><td>{row?.version ?? '—'}</td><td>{dateTime(row?.publishedAt)}</td><td><div className={styles.actions}>{row && <button type="button" className={styles.iconButton} title="Ver conteúdo" aria-label={`Ver ${name}`} onClick={() => open('detail', slug)}><Eye size={16} aria-hidden="true" /></button>}<button type="button" className={styles.iconButton} title="Publicar versão" aria-label={`Publicar ${name}`} onClick={() => open('publish', slug)}><Plus size={16} aria-hidden="true" /></button></div></td></tr>; })}</tbody></table></div>}
      <footer className={styles.footer}><span>Versão atual de cada assunto</span></footer>
    </section>
    <Dialog open={Boolean(dialog)} onOpenChange={value => { if (!value) close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{dialog?.type === 'publish' ? `Publicar ${sections.find(([slug]) => slug === dialog.slug)?.[1]}` : dialog?.current?.title}</DialogTitle><DialogDescription className={styles.dialogDescription}>{dialog?.type === 'publish' ? 'A nova versão passa a ser exibida assim que for publicada.' : `Versão ${dialog?.current?.version ?? '—'} · ${dateTime(dialog?.current?.publishedAt)}`}</DialogDescription>
      {dialog?.type === 'detail' && dialog.current && <><dl className={styles.detailGrid}><div><dt>Fonte</dt><dd>{dialog.current.source}</dd></div><div><dt>Versão</dt><dd>{dialog.current.version}</dd></div></dl><h3 className={local.previewHeading}>Conteúdo</h3>{dialog.slug === 'business' ? <dl className={styles.detailGrid}><div><dt>Razão social</dt><dd>{dialog.current.body.legalName}</dd></div><div><dt>CNPJ</dt><dd>{dialog.current.body.cnpj}</dd></div><div><dt>Endereço</dt><dd>{dialog.current.body.physicalAddress}</dd></div><div><dt>E-mail</dt><dd>{dialog.current.body.email}</dd></div><div><dt>Canais de suporte</dt><dd>{dialog.current.body.supportChannels?.join(', ')}</dd></div></dl> : dialog.slug === 'faq' ? dialog.current.body.items?.map((entry, index) => <div key={index}><h4 className={local.previewHeading}>{entry.question}</h4><p className={local.preview}>{entry.answer}</p></div>) : <p className={local.preview}>{dialog.current.body.text}</p>}</>}
      {dialog?.type === 'publish' && <form key={dialog.slug} className={styles.form} onSubmit={publish}><label>Versão<input name="version" maxLength={50} placeholder="1.0" required /></label><label>Título<input name="title" maxLength={200} defaultValue={dialog.current?.title ?? ''} required /></label><label className={styles.wide}>Fonte (URL)<input name="source" type="url" maxLength={500} defaultValue={dialog.current?.source ?? ''} placeholder="https://..." required /></label>
        {dialog.slug === 'business' ? <><label className={styles.wide}>Razão social<input name="legalName" maxLength={200} defaultValue={dialog.current?.body?.legalName ?? ''} required /></label><label>CNPJ<input name="cnpj" inputMode="numeric" maxLength={18} defaultValue={dialog.current?.body?.cnpj ?? ''} required /></label><label className={styles.wide}>Endereço físico<textarea name="physicalAddress" maxLength={500} defaultValue={dialog.current?.body?.physicalAddress ?? ''} required /></label><label>E-mail<input name="email" type="email" maxLength={150} defaultValue={dialog.current?.body?.email ?? ''} required /></label><label className={styles.wide}>Canais de suporte (um por linha)<textarea name="supportChannels" defaultValue={dialog.current?.body?.supportChannels?.join('\n') ?? ''} required /></label></> : dialog.slug === 'faq' ? <div className={styles.wide}><h3 className={local.previewHeading}>Perguntas e respostas</h3>{faqItems.map((item, index) => <div key={index} className={styles.filmPicker}><label>Pergunta<input value={item.question} onChange={event => updateFaq(index, 'question', event.target.value)} maxLength={500} required /></label><label>Resposta<textarea value={item.answer} onChange={event => updateFaq(index, 'answer', event.target.value)} maxLength={20000} required /></label><button type="button" className={styles.secondary} onClick={() => setFaqItems(items => items.filter((_, position) => position !== index))} disabled={faqItems.length === 1}>Remover pergunta</button></div>)}<button type="button" className={styles.secondary} onClick={() => setFaqItems(items => [...items, { question: '', answer: '' }])} disabled={faqItems.length >= 100}>Adicionar pergunta</button></div> : <label className={styles.wide}>Texto<textarea name="text" maxLength={20000} defaultValue={dialog.current?.body?.text ?? ''} required /></label>}
        <div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={close}>Cancelar</button><button type="submit" className={styles.primary} disabled={pending}>{pending ? 'Publicando…' : 'Publicar versão'}</button></div></form>}{error && <p className={styles.error} role="alert">{error}</p>}
    </DialogContent></Dialog>
  </MarketingLayout>;
}
