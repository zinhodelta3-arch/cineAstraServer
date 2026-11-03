'use client';

import { useState } from 'react';
import { Eye, EyeOff, Pencil, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { marketingRequest, useAdminMarketing, useMarketingActions } from '@/hooks/admin/use-admin-marketing';
import MarketingLayout, { MarketingFooter, MarketingState } from './marketing-layout';
import styles from '../catalog/catalog.module.css';

const definitions = {
  banners: { title: 'Banners', noun: 'banners', description: 'Organize os destaques exibidos nas páginas do CineAstra.' },
  experiences: { title: 'Experiências', noun: 'experiências', description: 'Apresente as experiências oferecidas pelo cinema.' },
  partners: { title: 'Parceiros', noun: 'parceiros', description: 'Mantenha as informações dos parceiros do CineAstra.' }
};
const placements = { 'cinema-home': 'Início do cinema', 'streaming-home': 'Início do streaming', astrasnack: 'AstraSnack' };
const urlValue = value => value ? value.trim() : null;

export default function PromotionalAdmin({ kind }) {
  const config = definitions[kind];
  const [active, setActive] = useState(''), [placement, setPlacement] = useState('');
  const params = new URLSearchParams({ limit: '20' });
  if (active) params.set('active', active);
  if (kind === 'banners' && placement) params.set('placement', placement);
  const list = useAdminMarketing(`${kind}?${params}`);
  const actions = useMarketingActions(list), item = actions.dialog?.item;

  function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget), value = key => String(form.get(key) ?? '').trim();
    const body = { slug: value('slug').toLowerCase(), title: value('title'), summary: value('summary'), description: urlValue(value('description')), imageUrl: urlValue(value('imageUrl')), imageAlt: urlValue(value('imageAlt')), targetUrl: urlValue(value('targetUrl')), ctaLabel: urlValue(value('ctaLabel')), tag: urlValue(value('tag')), active: form.get('active') === 'on' };
    if (kind === 'banners') body.placement = value('placement');
    if (kind === 'experiences') { body.priceLabel = urlValue(value('priceLabel')); body.unit = urlValue(value('unit')); body.details = value('details').split('\n').map(line => line.trim()).filter(Boolean); }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug) || !body.title || !body.summary || body.imageUrl && !body.imageAlt) { actions.setError('Confira o identificador, título, resumo e texto alternativo da imagem.'); return; }
    if (kind === 'experiences' && (body.details.length > 20 || body.details.some(line => line.length > 250))) { actions.setError('Informe até 20 detalhes, com no máximo 250 caracteres cada.'); return; }
    actions.run(() => marketingRequest(`${kind}${item ? `/${item.id}` : ''}`, { method: item ? 'PATCH' : 'POST', body }), item ? `${config.title.slice(0, -1)} atualizado.` : `${config.title.slice(0, -1)} cadastrado.`);
  }

  return <MarketingLayout title={config.title} description={config.description} action={<button type="button" className={styles.primary} onClick={() => actions.open('form')}><Plus size={16} aria-hidden="true" />Novo registro</button>}>
    {actions.notice && <p className={styles.notice} role="status">{actions.notice}</p>}
    <section className={styles.panel} aria-labelledby="promotional-title"><header className={styles.panelHeader}><div><h2 id="promotional-title">{config.title} cadastrados</h2><p>Ative apenas os registros prontos para aparecer no site.</p></div><span className={styles.count}>{list.items.length} carregados</span></header>
      <div className={styles.toolbar}><label className={styles.filter}>Status<select value={active} onChange={event => setActive(event.target.value)}><option value="">Todos</option><option value="true">Ativos</option><option value="false">Inativos</option></select></label>{kind === 'banners' && <label className={styles.filter}>Página<select value={placement} onChange={event => setPlacement(event.target.value)}><option value="">Todas</option>{Object.entries(placements).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>}</div>
      <MarketingState list={list} empty={`Nenhum registro de ${config.title.toLowerCase()} encontrado.`} noun={config.noun} />
      {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label={`Tabela de ${config.title.toLowerCase()}; deslize horizontalmente em telas pequenas`} tabIndex={0}><table className={styles.table}><caption className="sr-only">{config.title}</caption><thead><tr><th scope="col">Conteúdo</th><th scope="col">Identificador</th>{kind === 'banners' && <th scope="col">Página</th>}<th scope="col">Destino</th><th scope="col">Status</th><th scope="col">Ações</th></tr></thead><tbody>{list.items.map(row => <tr key={row.id}><th scope="row"><span className={styles.filmCell}>{row.imageUrl && <span className={styles.imageThumb}><img src={row.imageUrl} alt="" loading="lazy" /></span>}<span>{row.title}<small className={styles.muted}> · #{row.id}</small><div className={styles.muted}>{row.summary}</div></span></span></th><td>{row.slug}</td>{kind === 'banners' && <td>{placements[row.placement] ?? row.placement}</td>}<td>{row.targetUrl || '—'}</td><td><span className={`${styles.badge} ${row.active ? '' : styles.inactive}`}>{row.active ? 'Ativo' : 'Inativo'}</span></td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Editar conteúdo" aria-label={`Editar ${row.title}`} onClick={() => actions.open('form', row)}><Pencil size={16} aria-hidden="true" /></button><button type="button" className={styles.iconButton} title={row.active ? 'Desativar' : 'Ativar'} aria-label={`${row.active ? 'Desativar' : 'Ativar'} ${row.title}`} onClick={() => actions.open('status', row)}>{row.active ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}</button></div></td></tr>)}</tbody></table></div>}
      {list.error && list.items.length > 0 && <p className={styles.error} role="alert">{list.error}</p>}<MarketingFooter list={list} noun={config.noun} />
    </section>
    <Dialog open={Boolean(actions.dialog)} onOpenChange={value => { if (!value) actions.close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{actions.dialog?.type === 'form' ? item ? 'Editar conteúdo' : 'Novo conteúdo' : item?.active ? 'Desativar conteúdo' : 'Ativar conteúdo'}</DialogTitle><DialogDescription className={styles.dialogDescription}>{item?.title ?? config.description}</DialogDescription>
      {actions.dialog?.type === 'form' && <form key={item?.id ?? 'new'} className={styles.form} onSubmit={save}><label>Identificador<input name="slug" defaultValue={item?.slug ?? ''} maxLength={100} placeholder="nome-do-conteudo" required /></label><label>Título<input name="title" defaultValue={item?.title ?? ''} maxLength={150} required /></label><label className={styles.wide}>Resumo<input name="summary" defaultValue={item?.summary ?? ''} maxLength={500} required /></label><label className={styles.wide}>Descrição<textarea name="description" defaultValue={item?.description ?? ''} maxLength={5000} /></label><label>Imagem (caminho interno ou HTTPS)<input name="imageUrl" defaultValue={item?.imageUrl ?? ''} maxLength={2048} /></label><label>Texto alternativo da imagem<input name="imageAlt" defaultValue={item?.imageAlt ?? ''} maxLength={200} /></label><label>Destino (caminho interno ou HTTPS)<input name="targetUrl" defaultValue={item?.targetUrl ?? ''} maxLength={2048} /></label><label>Texto do botão<input name="ctaLabel" defaultValue={item?.ctaLabel ?? ''} maxLength={80} /></label><label>Etiqueta<input name="tag" defaultValue={item?.tag ?? ''} maxLength={80} /></label>{kind === 'banners' && <label>Página<select name="placement" defaultValue={item?.placement ?? 'cinema-home'}>{Object.entries(placements).map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>}{kind === 'experiences' && <><label>Preço exibido<input name="priceLabel" defaultValue={item?.priceLabel ?? ''} maxLength={100} /></label><label>Unidade<input name="unit" defaultValue={item?.unit ?? ''} maxLength={150} /></label><label className={styles.wide}>Detalhes (um por linha)<textarea name="details" defaultValue={item?.details?.join('\n') ?? ''} /></label></>}<div className={`${styles.wide} ${styles.checks}`}><label><input type="checkbox" name="active" defaultChecked={item?.active ?? false} />Ativo no site</label></div><div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="submit" className={styles.primary} disabled={actions.pending}>{actions.pending ? 'Salvando…' : 'Salvar conteúdo'}</button></div></form>}
      {actions.dialog?.type === 'status' && <div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={actions.close}>Voltar</button><button type="button" className={styles.primary} disabled={actions.pending} onClick={() => actions.run(() => marketingRequest(`${kind}/${item.id}`, { method: 'PATCH', body: { active: !item.active } }), item.active ? 'Conteúdo desativado.' : 'Conteúdo ativado.')}>{actions.pending ? 'Aguarde…' : item?.active ? 'Desativar' : 'Ativar'}</button></div>}{actions.error && <p className={styles.error} role="alert">{actions.error}</p>}
    </DialogContent></Dialog>
  </MarketingLayout>;
}
