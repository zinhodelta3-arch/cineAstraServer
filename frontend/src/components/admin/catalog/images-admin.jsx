"use client";

import TablePagination from '@/components/ui/table-pagination';
import { useDeferredValue, useEffect, useRef, useState } from "react";
import { ImagePlus, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { publicAsset } from "@/lib/api/public-api.mjs";
import { catalogRequest, useAdminCatalogList } from "@/hooks/admin/use-admin-catalog";
import CatalogLayout, { CatalogState } from "./catalog-layout";
import styles from "./catalog.module.css";

const types = [{ value: "CAPA", label: "Capa" }, { value: "BANNER", label: "Banner" }, { value: "ALTERNATIVA", label: "Alternativa" }];
const typeLabel = (value) => types.find((type) => type.value === value)?.label ?? value;
const bannerContexts = { GERAL:"Todas as áreas", CINEMA_HOME:"Início do cinema", CINEMA_FILME:"Página do filme", STREAMING_HOME:"Início do streaming" };
const bannerDevices = { DESKTOP:"Desktop", TABLET:"Tablet", MOBILE:"Celular" };

function imageFields(form) {
  const ordem = Number(form.get("ordem"));
  const texto = String(form.get("texto_alternativo") ?? "").trim();
  if (!Number.isInteger(ordem) || ordem < 0 || ordem > 4294967295) throw new Error("Informe uma ordem válida.");
  if (texto.length > 255) throw new Error("O texto alternativo deve ter até 255 caracteres.");
  const tipo = String(form.get("tipo"));
  const contexto_banner = tipo === "BANNER" ? String(form.get("contexto_banner") ?? "GERAL") : "GERAL";
  const dispositivo_banner = contexto_banner === "GERAL" ? "PADRAO" : String(form.get("dispositivo_banner"));
  return { tipo, texto_alternativo: texto || null, ordem, principal: contexto_banner === "GERAL" && form.has("principal"), contexto_banner, dispositivo_banner };
}

export default function ImagesAdmin() {
  const [query, setQuery] = useState("");
  const [film, setFilm] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState(null);
  const [type, setType] = useState("CAPA");
  const [bannerContext, setBannerContext] = useState("GERAL");
  const lock = useRef(false);
  const search = useDeferredValue(query.trim());
  const params = new URLSearchParams({ limit: "20" });
  if (search) params.set("titulo", search);
  const films = useAdminCatalogList(`films?${params}`);
  const images = useAdminCatalogList(film ? `films/${film.id_filme}/images?limit=20` : null);

  useEffect(() => {
    const filmId = new URLSearchParams(window.location.search).get("filme");
    if (!/^[1-9]\d*$/.test(filmId ?? "")) return;
    let active = true;
    catalogRequest(`films/${filmId}`).then((result) => { if (active) setFilm(result); }).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function open(mode, image = null) { setError(""); setNotice(""); setPreview(null); setType(image?.tipo ?? "CAPA"); setBannerContext(image?.contexto_banner ?? "GERAL"); setDialog({ type: mode, image }); }
  function close() { if (!pending) { setDialog(null); setPreview(null); } }
  function selectFilm(item) { if (pending) return; setFilm(item); setDialog(null); setError(""); setNotice(""); window.history.replaceState(null, "", `/admin/filmes/imagens?filme=${item.id_filme}`); }

  async function run(task, message) {
    if (lock.current) return;
    lock.current = true; setPending(true); setError("");
    try { await task(); setDialog(null); setPreview(null); setNotice(message); images.reload(); films.reload(); }
    catch (cause) { setError(cause.message); }
    finally { lock.current = false; setPending(false); }
  }

  function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    let fields;
    try { fields = imageFields(form); }
    catch (cause) { setError(cause.message); return; }
    const existing = dialog?.image;
    if (existing) return run(() => catalogRequest(`films/${film.id_filme}/images/${existing.id_imagem}`, { method: "PATCH", body: fields }), "Imagem atualizada.");
    const file = form.get("image");
    if (!(file instanceof File) || !file.size || file.size > 5_242_880 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("Selecione uma imagem JPG, PNG ou WebP de até 5 MB."); return; }
    return run(async () => {
      const upload = new FormData(); upload.set("image", file);
      const staged = await catalogRequest("uploads", { method: "POST", body: upload });
      try { await catalogRequest(`films/${film.id_filme}/images`, { method: "POST", body: { stagingKey: staged.key, ...fields } }); }
      finally { await catalogRequest(`uploads/${staged.key}`, { method: "DELETE" }).catch(() => {}); }
    }, "Imagem adicionada.");
  }

  const image = dialog?.image;
  return <CatalogLayout title="Imagens" description="Gerencie capas, banners e imagens adicionais de cada filme." action={<button type="button" className={styles.primary} onClick={() => open("form")} disabled={!film}><Plus size={16} aria-hidden="true" />Adicionar imagem</button>}>
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    <section className={styles.filmPicker} aria-labelledby="picker-title"><h2 id="picker-title">Selecione um filme</h2><label className={styles.search}><Search size={16} aria-hidden="true" /><span className="sr-only">Buscar filme pelo título</span><input type="search" maxLength={200} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar filme" /></label>
      {film && <p className={styles.hint}>Selecionado: <strong>{film.titulo}</strong></p>}
      <div className={styles.pickerList}>{films.items.map((item) => <button key={item.id_filme} type="button" aria-pressed={film?.id_filme === item.id_filme} onClick={() => selectFilm(item)}>{item.titulo}</button>)}</div>
      <CatalogState list={films} empty="Nenhum filme encontrado." noun="filmes" />
      {films.nextCursor && <button type="button" className={styles.secondary} onClick={films.loadMore} disabled={films.loadingMore}>{films.loadingMore ? "Carregando…" : "Carregar mais filmes"}</button>}
    </section>
    <section className={styles.panel} aria-labelledby="images-title"><header className={styles.panelHeader}><div><h2 id="images-title">{film ? `Galeria · ${film.titulo}` : "Galeria de imagens"}</h2><p>{film ? "Capas, banners e alternativas cadastradas para este filme." : "Selecione um filme para visualizar e editar sua galeria."}</p></div>{film && <span className={styles.count}>{images.items.length} carregadas</span>}</header>
      {!film && <p className={styles.state}>Selecione um filme acima para começar.</p>}
      {film && <><CatalogState list={images} empty="Este filme ainda não tem imagens cadastradas." noun="imagens" />{images.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de imagens; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Imagens do filme {film.titulo}</caption><thead><tr><th scope="col">Imagem</th><th scope="col">Tipo</th><th scope="col">Texto alternativo</th><th scope="col">Ordem</th><th scope="col">Principal</th><th scope="col" aria-label="Ações" /></tr></thead><tbody>{images.items.map((item) => <tr key={item.id_imagem}><th scope="row"><span className={styles.filmCell}><span className={styles.imageThumb}>{publicAsset(item.url) && <img src={publicAsset(item.url)} alt="" />}</span><span className={styles.muted}>#{item.id_imagem}</span></span></th><td>{typeLabel(item.tipo)}{item.tipo === "BANNER" && <span className="block text-xs text-muted-foreground">{bannerContexts[item.contexto_banner] ?? bannerContexts.GERAL}{bannerDevices[item.dispositivo_banner] && ` · ${bannerDevices[item.dispositivo_banner]}`}</span>}</td><td>{item.texto_alternativo || <span className={styles.muted}>Sem descrição</span>}</td><td>{item.ordem}</td><td>{item.principal ? <span className={styles.badge}>Sim</span> : <span className={styles.muted}>Não</span>}</td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Editar imagem" aria-label={`Editar imagem ${item.id_imagem}`} onClick={() => open("form", item)}><Pencil size={16} aria-hidden="true" /></button><button type="button" className={`${styles.iconButton} ${styles.destructive}`} title="Excluir imagem" aria-label={`Excluir imagem ${item.id_imagem}`} onClick={() => open("delete", item)}><Trash2 size={16} aria-hidden="true" /></button></div></td></tr>)}</tbody></table></div>}
        <TablePagination list={images} /></>}
    </section>
    <Dialog open={Boolean(dialog)} onOpenChange={(value) => { if (!value) close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{dialog?.type === "delete" ? "Excluir imagem" : image ? "Editar imagem" : "Adicionar imagem"}</DialogTitle>
      {dialog?.type === "form" && <><DialogDescription className={styles.dialogDescription}>{image ? "Atualize a posição e a descrição da imagem." : "Envie uma imagem JPG, PNG ou WebP de até 5 MB."}</DialogDescription><form key={image?.id_imagem ?? "new"} className={styles.form} onSubmit={save}>
        {!image && <label className={styles.wide}>Arquivo de imagem<input name="image" type="file" accept="image/jpeg,image/png,image/webp" required onChange={(event) => { const file = event.target.files?.[0]; setPreview(file ? URL.createObjectURL(file) : null); }} /></label>}
        {preview && <div className={styles.wide}><img src={preview} alt="Prévia da imagem selecionada" style={{ maxWidth: "100%", maxHeight: 180, objectFit: "contain" }} /></div>}
        <label>Tipo<select name="tipo" value={type} onChange={event=>setType(event.target.value)}>{types.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
        <label>Ordem<input name="ordem" type="number" min="0" max="4294967295" required defaultValue={image?.ordem ?? 0} /></label>
        {type === "BANNER" && <>
          <label>Área<select name="contexto_banner" value={bannerContext} onChange={event=>setBannerContext(event.target.value)}>{Object.entries(bannerContexts).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
          {bannerContext !== "GERAL" && <label>Dispositivo<select name="dispositivo_banner" defaultValue={bannerDevices[image?.dispositivo_banner] ? image.dispositivo_banner : "DESKTOP"}>{Object.entries(bannerDevices).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>}
        </>}
        <label className={styles.wide}>Texto alternativo<input name="texto_alternativo" maxLength={255} defaultValue={image?.texto_alternativo ?? ""} placeholder="Descreva o conteúdo da imagem" /></label>
        {type !== "BANNER" || bannerContext === "GERAL" ? <div className={`${styles.checks} ${styles.wide}`}><label><input type="checkbox" name="principal" defaultChecked={image?.principal ?? false} /> Imagem principal do tipo selecionado</label></div> : <p className={`${styles.hint} ${styles.wide}`}>Se houver mais de um banner para esta área e dispositivo, será usado o de menor ordem.</p>}
        {error && <p className={`${styles.error} ${styles.wide}`} role="alert">{error}</p>}
        <div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={close} disabled={pending}>Cancelar</button><button type="submit" className={styles.primary} disabled={pending}><ImagePlus size={16} aria-hidden="true" />{pending ? "Salvando…" : image ? "Salvar alterações" : "Adicionar imagem"}</button></div>
      </form></>}
      {dialog?.type === "delete" && <><DialogDescription className={styles.dialogDescription}>Excluir esta imagem da galeria de {film?.titulo}? Esta ação não pode ser desfeita.</DialogDescription>{error && <p className={styles.error} role="alert">{error}</p>}<div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={close}>Cancelar</button><button type="button" className={styles.danger} disabled={pending} onClick={() => run(() => catalogRequest(`films/${film.id_filme}/images/${image.id_imagem}`, { method: "DELETE" }), "Imagem excluída.")}>{pending ? "Excluindo…" : "Excluir imagem"}</button></div></>}
    </DialogContent></Dialog>
  </CatalogLayout>;
}
