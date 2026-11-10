'use client';

import TablePagination from '@/components/ui/table-pagination';
import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { ImagePlus, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { publicAsset } from '@/lib/api/public-api.mjs';
import { catalogRequest } from '@/hooks/admin/use-admin-catalog';
import { snackRequest, useAdminSnacks } from '@/hooks/admin/use-admin-snacks';
import SnackLayout, { SnackState } from './snack-layout';
import styles from '../catalog/catalog.module.css';
import local from './snack-images.module.css';

const kinds = { inputs: { label: 'Insumos', id: 'id_insumo', query: 'insumo' }, combos: { label: 'Combos', id: 'id_combo', query: 'combo' } };
const types = { PRINCIPAL: 'Principal', ALTERNATIVA: 'Alternativa' };
const validId = value => /^[1-9]\d{0,9}$/.test(value ?? '') && BigInt(value) <= 4294967295n;

export default function SnackImagesAdmin() {
  const [kind, setKind] = useState('inputs'), [query, setQuery] = useState(''), [selected, setSelected] = useState(null);
  const [dialog, setDialog] = useState(null), [preview, setPreview] = useState(null), [pending, setPending] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const lock = useRef(false), search = useDeferredValue(query.trim());
  const inputs = useAdminSnacks(kind === 'inputs' ? 'inputs?limit=100' : null);
  const combos = useAdminSnacks(kind === 'combos' ? `combos?limit=100${search ? `&q=${encodeURIComponent(search)}` : ''}` : null);
  const products = kind === 'inputs' ? inputs : combos;
  const itemId = selected?.[kinds[kind].id];
  const images = useAdminSnacks(itemId ? `${kind}/${itemId}/images?limit=20` : null);
  const visible = kind === 'inputs' && search ? products.items.filter(item => item.nome.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR'))) : products.items;
  const image = dialog?.image;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search), nextKind = params.has('combo') ? 'combos' : 'inputs', id = params.get(kinds[nextKind].query);
    setKind(nextKind);
    if (!validId(id)) return;
    const abort = new AbortController();
    snackRequest(`${nextKind}/${id}`, { signal: abort.signal }).then(item => { if (!abort.signal.aborted) setSelected(item); }).catch(() => {});
    return () => abort.abort();
  }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function choose(item) {
    if (pending) return;
    setSelected(item); setDialog(null); setError(''); setNotice('');
    window.history.replaceState(null, '', `/admin/astrasnack/imagens?${kinds[kind].query}=${item[kinds[kind].id]}`);
  }
  function changeKind(nextKind) {
    if (pending) return;
    setKind(nextKind); setSelected(null); setQuery(''); setError(''); setNotice('');
    window.history.replaceState(null, '', '/admin/astrasnack/imagens');
  }
  function open(type, row = null) { setError(''); setNotice(''); setPreview(null); setDialog({ type, image: row }); }
  function close() { if (!lock.current) { setDialog(null); setPreview(null); } }
  async function run(task, message) {
    if (lock.current) return;
    lock.current = true; setPending(true); setError('');
    try { await task(); setDialog(null); setPreview(null); setNotice(message); images.reload(); }
    catch (cause) { setError(cause.message); }
    finally { lock.current = false; setPending(false); }
  }
  function save(event) {
    event.preventDefault();
    if (!itemId) return;
    const form = new FormData(event.currentTarget), ordem = Number(form.get('ordem')), tipo = String(form.get('tipo') ?? ''), texto = String(form.get('texto_alternativo') ?? '').trim();
    if (!Number.isInteger(ordem) || ordem < 0 || ordem > 4294967295 || !Object.hasOwn(types, tipo) || texto.length > 255) { setError('Confira o tipo, a ordem e o texto alternativo.'); return; }
    const fields = { tipo, ordem, texto_alternativo: texto || null };
    if (image) return run(() => snackRequest(`${kind}/${itemId}/images/${image.id_imagem}`, { method: 'PATCH', body: fields }), 'Imagem atualizada.');
    const file = form.get('image');
    if (!(file instanceof File) || !file.size || file.size > 5_242_880 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Selecione uma imagem JPG, PNG ou WebP de até 5 MB.'); return; }
    return run(async () => {
      const upload = new FormData(); upload.set('image', file);
      const staged = await catalogRequest('uploads', { method: 'POST', body: upload });
      try { await snackRequest(`${kind}/${itemId}/images`, { method: 'POST', body: { stagingKey: staged.key, ...fields } }); }
      finally { await catalogRequest(`uploads/${staged.key}`, { method: 'DELETE' }).catch(() => {}); }
    }, 'Imagem adicionada.');
  }

  return <SnackLayout title="Imagens do AstraSnack" description="Gerencie as imagens dos insumos e combos cadastrados." action={<button type="button" className={styles.primary} onClick={() => open('form')} disabled={!selected}><Plus size={16} aria-hidden="true" />Adicionar imagem</button>}>
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    <section className={styles.filmPicker} aria-labelledby="snack-image-picker"><div className={local.pickerHeader}><h2 id="snack-image-picker">Selecione um produto</h2><p>{selected ? `Selecionado: ${selected.nome}` : 'Escolha um insumo ou combo para abrir a galeria.'}</p></div><div className={styles.pickerControl}><label>Tipo<select value={kind} onChange={event => changeKind(event.target.value)}><option value="inputs">Insumos</option><option value="combos">Combos</option></select></label><label>Busca<input type="search" maxLength={150} value={query} onChange={event => setQuery(event.target.value)} placeholder={kind === 'inputs' ? 'Buscar entre os carregados' : 'Buscar combo'} /></label></div>
      <div className={styles.pickerList}>{visible.map(item => <button key={item[kinds[kind].id]} type="button" aria-pressed={itemId === item[kinds[kind].id]} onClick={() => choose(item)}>{item.nome} · #{item[kinds[kind].id]}</button>)}</div>
      <SnackState list={products} empty={`Nenhum ${kind === 'inputs' ? 'insumo' : 'combo'} cadastrado.`} noun={kind === 'inputs' ? 'insumos' : 'combos'} />
      {!products.loading && !products.error && products.items.length > 0 && visible.length === 0 && <p className={styles.hint}>Nenhum item carregado corresponde à busca.</p>}
      {products.nextCursor && <button type="button" className={styles.secondary} onClick={products.loadMore} disabled={products.loadingMore}>{products.loadingMore ? 'Carregando…' : `Mais ${kinds[kind].label.toLowerCase()}`}</button>}
    </section>
    <section className={styles.panel} aria-labelledby="snack-images-title"><header className={styles.panelHeader}><div><h2 id="snack-images-title">{selected ? `Galeria · ${selected.nome}` : 'Galeria de imagens'}</h2><p>{selected ? 'A imagem principal aparece primeiro nos pontos de venda.' : 'Selecione um produto para ver suas imagens.'}</p></div>{selected && <span className={styles.count}>{images.items.length} carregadas</span>}</header>
      {!selected && <p className={styles.state}>Selecione um produto acima para começar.</p>}
      {selected && <><SnackState list={images} empty="Este produto ainda não tem imagens cadastradas." noun="imagens" />{images.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de imagens; deslize horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Imagens de {selected.nome}</caption><thead><tr><th scope="col">Imagem</th><th scope="col">Tipo</th><th scope="col">Texto alternativo</th><th scope="col">Ordem</th><th scope="col">Ações</th></tr></thead><tbody>{images.items.map(row => <tr key={row.id_imagem}><th scope="row"><span className={styles.filmCell}><span className={styles.imageThumb}>{publicAsset(row.url) && <img src={publicAsset(row.url)} alt="" onError={event => { event.currentTarget.hidden = true; }} />}</span><span className={styles.muted}>#{row.id_imagem}</span></span></th><td><span className={row.tipo === 'PRINCIPAL' ? styles.badge : styles.muted}>{types[row.tipo] ?? row.tipo}</span></td><td>{row.texto_alternativo || <span className={styles.muted}>Sem descrição</span>}</td><td>{row.ordem}</td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Editar imagem" aria-label={`Editar imagem ${row.id_imagem}`} onClick={() => open('form', row)}><Pencil size={16} aria-hidden="true" /></button><button type="button" className={`${styles.iconButton} ${styles.destructive}`} title="Excluir imagem" aria-label={`Excluir imagem ${row.id_imagem}`} onClick={() => open('delete', row)}><Trash2 size={16} aria-hidden="true" /></button></div></td></tr>)}</tbody></table></div>}
        <TablePagination list={images} /></>}
    </section>
    <Dialog open={Boolean(dialog)} onOpenChange={value => { if (!value) close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{dialog?.type === 'delete' ? 'Excluir imagem' : image ? 'Editar imagem' : 'Adicionar imagem'}</DialogTitle>
      {dialog?.type === 'form' && <><DialogDescription className={styles.dialogDescription}>{image ? `Atualize a imagem de ${selected?.nome}.` : `Envie uma imagem JPG, PNG ou WebP de até 5 MB para ${selected?.nome}.`}</DialogDescription><form key={image?.id_imagem ?? 'new'} className={styles.form} onSubmit={save}>{!image && <label className={styles.wide}>Arquivo de imagem<input name="image" type="file" accept="image/jpeg,image/png,image/webp" required onChange={event => { const file = event.target.files?.[0]; setPreview(file ? URL.createObjectURL(file) : null); }} /></label>}{preview && <div className={styles.wide}><img className={local.preview} src={preview} alt="Prévia da imagem selecionada" /></div>}<label>Tipo<select name="tipo" defaultValue={image?.tipo ?? 'ALTERNATIVA'}><option value="PRINCIPAL">Principal</option><option value="ALTERNATIVA">Alternativa</option></select></label><label>Ordem<input name="ordem" type="number" min="0" max="4294967295" defaultValue={image?.ordem ?? 0} required /></label><label className={styles.wide}>Texto alternativo<input name="texto_alternativo" maxLength={255} defaultValue={image?.texto_alternativo ?? ''} placeholder="Descreva a imagem" /></label>{error && <p className={`${styles.error} ${styles.wide}`} role="alert">{error}</p>}<div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={close} disabled={pending}>Cancelar</button><button type="submit" className={styles.primary} disabled={pending}><ImagePlus size={16} aria-hidden="true" />{pending ? 'Salvando…' : image ? 'Salvar alterações' : 'Adicionar imagem'}</button></div></form></>}
      {dialog?.type === 'delete' && <><DialogDescription className={styles.dialogDescription}>Excluir esta imagem de {selected?.nome}? Esta ação não pode ser desfeita.</DialogDescription>{error && <p className={styles.error} role="alert">{error}</p>}<div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={close}>Voltar</button><button type="button" className={styles.danger} disabled={pending} onClick={() => run(() => snackRequest(`${kind}/${itemId}/images/${image.id_imagem}`, { method: 'DELETE' }), 'Imagem excluída.')}>{pending ? 'Excluindo…' : 'Excluir imagem'}</button></div></>}
    </DialogContent></Dialog>
  </SnackLayout>;
}
