'use client';

import { useState } from 'react';
import { CalendarClock, Eye, Pencil, Plus, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { marketingRequest, useAdminMarketing, useMarketingActions } from '@/hooks/admin/use-admin-marketing';
import MarketingLayout, { dateTime, label, MarketingFooter, MarketingState } from './marketing-layout';
import styles from '../catalog/catalog.module.css';
import local from './marketing.module.css';

export default function CampaignsAdmin() {
  const list = useAdminMarketing('campaigns?limit=20');
  const categories = useAdminMarketing('categories');
  const actions = useMarketingActions(list), item = actions.dialog?.item;
  const [recent, setRecent] = useState(null);
  const categoryName = id => categories.items.find(row => row.id === id)?.name ?? `Categoria #${id}`;
  function open(type, row = null) { setRecent(null); actions.open(type, row); }
  function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget), body = {
      categoryId: String(form.get('categoryId') ?? ''), name: String(form.get('name') ?? '').trim(), subject: String(form.get('subject') ?? '').trim(),
      html: String(form.get('html') ?? ''), text: String(form.get('text') ?? '').trim()
    };
    if (!body.categoryId || !body.name || !body.subject || !body.html.trim() || !body.text) { actions.setError('Preencha categoria, nome, assunto e os conteúdos HTML e texto.'); return; }
    actions.run(() => marketingRequest(`campaigns${item ? `/${item.id}` : ''}`, { method: item ? 'PATCH' : 'POST', body }), item ? 'Campanha atualizada.' : result => `Campanha #${result.id} criada.`, result => { if (!item) setRecent(result); });
  }
  function schedule(event) {
    event.preventDefault();
    const input = String(new FormData(event.currentTarget).get('at') ?? ''), at = new Date(input);
    if (!input || !Number.isFinite(at.getTime()) || at.getTime() <= Date.now()) { actions.setError('Escolha uma data e hora futuras.'); return; }
    actions.run(() => marketingRequest(`campaigns/${item.id}/schedule`, { method: 'POST', body: { at: at.toISOString().replace('.000Z', 'Z') } }), 'Campanha agendada.');
  }

  return <MarketingLayout title="Campanhas" description="Prepare e agende as comunicações da newsletter." action={<button type="button" className={styles.primary} onClick={() => open('form')}><Plus size={16} aria-hidden="true" />Nova campanha</button>}>
    {actions.notice && <p className={styles.notice} role="status">{actions.notice}{recent?.status === 'RASCUNHO' && <> <button type="button" className={local.previewLink} onClick={() => actions.open('form', recent)}>Editar</button> · <button type="button" className={local.previewLink} onClick={() => actions.open('schedule', recent)}>Agendar agora</button></>}</p>}
    <section className={styles.panel} aria-labelledby="campaigns-title"><header className={styles.panelHeader}><div><h2 id="campaigns-title">Campanhas da newsletter</h2><p>O envio começa na data agendada, conforme as inscrições ativas.</p></div><span className={styles.count}>{list.items.length} carregadas</span></header>
      <MarketingState list={list} empty="Nenhuma campanha cadastrada." noun="campanhas" />{list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de campanhas; deslize horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Campanhas da newsletter</caption><thead><tr><th scope="col">Campanha</th><th scope="col">Categoria</th><th scope="col">Status</th><th scope="col">Agendada para</th><th scope="col">Ações</th></tr></thead><tbody>{list.items.map(row => <tr key={row.id}><th scope="row">{row.name}<small className={styles.muted}> · #{row.id}</small><div className={styles.muted}>{row.subject}</div></th><td>{categoryName(row.categoryId)}</td><td><span className={`${styles.badge} ${row.status === 'RASCUNHO' || row.status === 'AGENDADA' ? '' : styles.inactive}`}>{label(row.status)}</span></td><td>{dateTime(row.scheduledAt)}</td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Ver campanha" aria-label={`Ver ${row.name}`} onClick={() => open('detail', row)}><Eye size={16} aria-hidden="true" /></button>{row.status === 'RASCUNHO' && <><button type="button" className={styles.iconButton} title="Editar campanha" aria-label={`Editar ${row.name}`} onClick={() => open('form', row)}><Pencil size={16} aria-hidden="true" /></button><button type="button" className={styles.iconButton} title="Agendar campanha" aria-label={`Agendar ${row.name}`} onClick={() => open('schedule', row)}><CalendarClock size={16} aria-hidden="true" /></button></>}{['RASCUNHO', 'AGENDADA', 'ENVIANDO'].includes(row.status) && <button type="button" className={`${styles.iconButton} ${styles.destructive}`} title="Cancelar campanha" aria-label={`Cancelar ${row.name}`} onClick={() => open('cancel', row)}><XCircle size={16} aria-hidden="true" /></button>}</div></td></tr>)}</tbody></table></div>}
      {list.error && list.items.length > 0 && <p className={styles.error} role="alert">{list.error}</p>}<MarketingFooter list={list} noun="campanhas" />
    </section>
    <Dialog open={Boolean(actions.dialog)} onOpenChange={value => { if (!value) actions.close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{actions.dialog?.type === 'form' ? item ? 'Editar campanha' : 'Nova campanha' : actions.dialog?.type === 'schedule' ? 'Agendar campanha' : actions.dialog?.type === 'cancel' ? 'Cancelar campanha' : 'Detalhes da campanha'}</DialogTitle><DialogDescription className={styles.dialogDescription}>{item?.subject ?? 'Monte o conteúdo e escolha uma categoria ativa.'}</DialogDescription>
      {actions.dialog?.type === 'form' && <form key={item?.id ?? 'new'} className={styles.form} onSubmit={save}><label>Categoria<select name="categoryId" defaultValue={item?.categoryId ?? ''} required><option value="">Selecione</option>{categories.items.filter(row => row.active).map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label><label>Nome interno<input name="name" maxLength={150} defaultValue={item?.name ?? ''} required /></label><label className={styles.wide}>Assunto do e-mail<input name="subject" maxLength={200} defaultValue={item?.subject ?? ''} required /></label><label className={styles.wide}>Conteúdo HTML<textarea name="html" maxLength={100000} defaultValue={item?.html ?? ''} required /></label><label className={styles.wide}>Versão em texto<textarea name="text" maxLength={100000} defaultValue={item?.text ?? ''} required /></label><p className={`${styles.hint} ${styles.wide}`}>HTML permitido: títulos, parágrafos, listas, links HTTPS ou de e-mail e formatação básica.</p>{categories.error && <p className={`${styles.error} ${styles.wide}`} role="alert">{categories.error}</p>}<div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="submit" className={styles.primary} disabled={actions.pending}>{actions.pending ? 'Salvando…' : 'Salvar campanha'}</button></div></form>}
      {actions.dialog?.type === 'detail' && item && <><dl className={styles.detailGrid}><div><dt>Categoria</dt><dd>{categoryName(item.categoryId)}</dd></div><div><dt>Status</dt><dd>{label(item.status)}</dd></div><div><dt>Agendada para</dt><dd>{dateTime(item.scheduledAt)}</dd></div><div><dt>Concluída em</dt><dd>{dateTime(item.completedAt)}</dd></div></dl><h3 className={local.previewHeading}>Conteúdo em texto</h3><pre className={local.preview}>{item.text}</pre><h3 className={local.previewHeading}>Código HTML</h3><pre className={local.preview}>{item.html}</pre></>}
      {actions.dialog?.type === 'schedule' && <form className={styles.form} onSubmit={schedule}><label className={styles.wide}>Data e hora do envio<input name="at" type="datetime-local" required /></label><div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={actions.close}>Voltar</button><button type="submit" className={styles.primary} disabled={actions.pending}>{actions.pending ? 'Agendando…' : 'Agendar'}</button></div></form>}
      {actions.dialog?.type === 'cancel' && <div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={actions.close}>Voltar</button><button type="button" className={styles.danger} disabled={actions.pending} onClick={() => actions.run(() => marketingRequest(`campaigns/${item.id}/cancel`, { method: 'POST' }), 'Campanha cancelada.')}>{actions.pending ? 'Aguarde…' : 'Cancelar campanha'}</button></div>}{actions.error && <p className={styles.error} role="alert">{actions.error}</p>}
    </DialogContent></Dialog>
  </MarketingLayout>;
}
