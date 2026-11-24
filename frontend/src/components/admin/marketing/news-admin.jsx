'use client';

import { ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { marketingRequest, useAdminMarketing, useMarketingActions } from '@/hooks/admin/use-admin-marketing';
import { articlePath, newsCategories } from '@/lib/content/cineastra-news.mjs';
import MarketingLayout, { dateTime, MarketingFooter, MarketingState } from './marketing-layout';
import styles from '../catalog/catalog.module.css';

export default function NewsAdmin() {
  const list = useAdminMarketing('news?limit=20');
  const actions = useMarketingActions(list);
  const item = actions.dialog?.item;
  const removing = actions.dialog?.type === 'delete';
  function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = {
      categoria: form.get('categoria'),
      titulo: form.get('titulo'),
      resumo: form.get('resumo'),
      corpo: form.get('corpo'),
      destaque: form.has('destaque'),
      publicar: form.get('publicar') === 'published',
    };
    actions.run(() => marketingRequest(item ? `news/${item.id}` : 'news', { method: item ? 'PATCH' : 'POST', body }),
      body.publicar ? 'Notícia publicada no CineAstraNews.' : 'Rascunho salvo.');
  }
  return <MarketingLayout title="Notícias" description="Escreva e publique as matérias que aparecem no CineAstraNews e no badge do Cinema."
    action={<button type="button" className={styles.primary} onClick={() => actions.open('form')}><Plus size={16} aria-hidden="true" />Nova notícia</button>}>
    {actions.notice && <p className={styles.notice} role="status">{actions.notice}</p>}
    <section className={styles.panel} aria-label="Notícias cadastradas">
      <MarketingState list={list} empty="Nenhuma notícia cadastrada." noun="notícias" />
      {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de notícias" tabIndex={0}>
        <table className={styles.table}>
          <thead><tr><th scope="col">Matéria</th><th scope="col">Categoria</th><th scope="col">Publicação</th><th scope="col">Ações</th></tr></thead>
          <tbody>{list.items.map(row => <tr key={row.id}>
            <th scope="row">{row.titulo}{row.destaque && <div className={styles.muted}>Destaque</div>}</th>
            <td>{row.categoria}</td><td>{row.publishedAt ? dateTime(row.publishedAt) : 'Rascunho'}</td>
            <td><div className={styles.actions}>
              {row.publishedAt && <a className={styles.iconButton} href={articlePath(row.id)} target="_blank" rel="noreferrer" aria-label={`Ver ${row.titulo} no site`}><ExternalLink size={16} aria-hidden="true" /></a>}
              <button type="button" className={styles.iconButton} aria-label={`Editar ${row.titulo}`} onClick={() => actions.open('form', row)}><Pencil size={16} aria-hidden="true" /></button>
              <button type="button" className={`${styles.iconButton} ${styles.destructive}`} aria-label={`Excluir ${row.titulo}`} onClick={() => actions.open('delete', row)}><Trash2 size={16} aria-hidden="true" /></button>
            </div></td>
          </tr>)}</tbody>
        </table>
      </div>}
      {list.error && list.items.length > 0 && <p className={styles.error} role="alert">{list.error}</p>}
      <MarketingFooter list={list} noun="notícias" />
    </section>
    <Dialog open={Boolean(actions.dialog)} onOpenChange={open => { if (!open) actions.close(); }}>
      <DialogContent className={styles.dialog}>
        <DialogTitle className={styles.dialogTitle}>{removing ? 'Excluir notícia' : item ? 'Editar notícia' : 'Nova notícia'}</DialogTitle>
        <DialogDescription className={styles.dialogDescription}>{removing ? `“${item.titulo}” será retirada do mural e do badge.` : 'Escolha Rascunho para revisar a matéria ou Publicada para exibi-la no site.'}</DialogDescription>
        {removing ? <div className={styles.dialogActions}>
          <button type="button" className={styles.secondary} onClick={actions.close}>Voltar</button>
          <button type="button" className={styles.danger} disabled={actions.pending} onClick={() => actions.run(() => marketingRequest(`news/${item.id}`, { method: 'DELETE' }), 'Notícia excluída.')}>{actions.pending ? 'Excluindo…' : 'Excluir notícia'}</button>
        </div> : <form key={item?.id ?? 'new'} className={styles.form} onSubmit={save}>
          <label className={styles.wide}>Título<input name="titulo" defaultValue={item?.titulo} required minLength={3} maxLength={180} /></label>
          <label><span id="news-category-label">Categoria</span><select name="categoria" aria-labelledby="news-category-label" defaultValue={item?.categoria ?? 'Comunidade'}>{newsCategories.map(category => <option key={category}>{category}</option>)}</select></label>
          <label><span id="news-visibility-label">Visibilidade</span><select name="publicar" aria-labelledby="news-visibility-label" defaultValue={item?.publishedAt ? 'published' : 'draft'}><option value="draft">Rascunho</option><option value="published">Publicada</option></select></label>
          <label className={styles.wide}>Resumo<textarea rows={2} name="resumo" defaultValue={item?.resumo} required minLength={3} maxLength={400} /></label>
          <label className={styles.wide}>Texto da matéria<textarea rows={7} name="corpo" defaultValue={item?.corpo} required minLength={3} maxLength={10000} /></label>
          <div className={styles.checks}><label><input type="checkbox" name="destaque" defaultChecked={item?.destaque} /> Marcar como destaque</label></div>
          <div className={`${styles.dialogActions} ${styles.wide}`}>
            <button type="button" className={styles.secondary} onClick={actions.close}>Voltar</button>
            <button type="submit" className={styles.primary} disabled={actions.pending}>{actions.pending ? 'Salvando…' : 'Salvar notícia'}</button>
          </div>
        </form>}
        {actions.error && <p className={styles.error} role="alert">{actions.error}</p>}
      </DialogContent>
    </Dialog>
  </MarketingLayout>;
}
