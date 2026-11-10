"use client";

import TablePagination from '@/components/ui/table-pagination';
import { useDeferredValue, useRef, useState } from "react";
import { Archive, Pencil, Plus, RotateCcw, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { catalogRequest, useAdminCatalogList } from "@/hooks/admin/use-admin-catalog";
import CatalogLayout, { CatalogState } from "./catalog-layout";
import styles from "./catalog.module.css";

export default function GenresAdmin() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Todos");
  const [dialog, setDialog] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const search = useDeferredValue(query.trim().toLocaleLowerCase("pt-BR"));
  const list = useAdminCatalogList(`genres?limit=20${status === "Todos" ? "" : `&status=${status}`}${search ? `&q=${encodeURIComponent(search)}` : ''}`);
  const visible = list.items;

  function open(type, genre = null) { setError(""); setNotice(""); setDialog({ type, genre }); }
  function close() { if (!pending) setDialog(null); }
  async function run(task, message) {
    if (lock.current) return;
    lock.current = true; setPending(true); setError("");
    try { await task(); setDialog(null); setNotice(message); list.reload(); }
    catch (cause) { setError(cause.message); }
    finally { lock.current = false; setPending(false); }
  }
  function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nome = String(form.get("nome") ?? "").trim();
    if (!nome || nome.length > 100) { setError("Informe um nome de até 100 caracteres."); return; }
    const genre = dialog?.genre;
    run(() => catalogRequest(genre ? `genres/${genre.id_genero}` : "genres", { method: genre ? "PATCH" : "POST", body: { nome, status: String(form.get("status")) } }), genre ? "Gênero atualizado." : "Gênero cadastrado.");
  }
  const genre = dialog?.genre;
  return <CatalogLayout title="Gêneros" description="Organize as categorias usadas no catálogo de filmes." action={<button type="button" className={styles.primary} onClick={() => open("form")}><Plus size={16} aria-hidden="true" />Novo gênero</button>}>
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    <section className={styles.panel} aria-labelledby="genres-title">
      <header className={styles.panelHeader}><div><h2 id="genres-title">Gêneros cadastrados</h2><p>Edite o nome ou a disponibilidade de cada gênero.</p></div><span className={styles.count}>{list.items.length} carregados</span></header>
      <div className={styles.toolbar}><label className={styles.search}><Search size={16} aria-hidden="true" /><span className="sr-only">Filtrar gêneros carregados</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar gêneros carregados" /></label><label className={styles.filter}>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option>Todos</option><option value="ATIVO">Ativos</option><option value="INATIVO">Inativos</option></select></label></div>
      {visible.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de gêneros" tabIndex={0}><table className={styles.table}><caption className="sr-only">Gêneros cadastrados no catálogo administrativo</caption><thead><tr><th scope="col">Gênero</th><th scope="col">Identificador</th><th scope="col">Status</th><th scope="col" aria-label="Ações" /></tr></thead><tbody>{visible.map((item) => <tr key={item.id_genero}><th scope="row">{item.nome}</th><td className={styles.muted}>#{item.id_genero}</td><td><span className={`${styles.badge} ${item.status === "INATIVO" ? styles.inactive : ""}`}>{item.status === "ATIVO" ? "Ativo" : "Inativo"}</span></td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Editar gênero" aria-label={`Editar ${item.nome}`} onClick={() => open("form", item)}><Pencil size={16} aria-hidden="true" /></button><button type="button" className={`${styles.iconButton} ${item.status === "ATIVO" ? styles.destructive : ""}`} title={item.status === "ATIVO" ? "Arquivar gênero" : "Reativar gênero"} aria-label={`${item.status === "ATIVO" ? "Arquivar" : "Reativar"} ${item.nome}`} onClick={() => open("status", item)}>{item.status === "ATIVO" ? <Archive size={16} aria-hidden="true" /> : <RotateCcw size={16} aria-hidden="true" />}</button></div></td></tr>)}</tbody></table></div>}
      <CatalogState list={list} empty="Nenhum gênero encontrado para este status." noun="gêneros" />
      {!list.loading && !list.error && list.items.length > 0 && visible.length === 0 && <p className={styles.state}>Nenhum gênero carregado corresponde à busca.{list.nextCursor ? " Carregue mais registros para ampliar a busca." : ""}</p>}
      <TablePagination list={list} />
    </section>
    <Dialog open={Boolean(dialog)} onOpenChange={(value) => { if (!value) close(); }}><DialogContent className={styles.dialog}>
      <DialogTitle className={styles.dialogTitle}>{dialog?.type === "status" ? `${genre?.status === "ATIVO" ? "Arquivar" : "Reativar"} gênero` : genre ? "Editar gênero" : "Novo gênero"}</DialogTitle>
      {dialog?.type === "form" && <><DialogDescription className={styles.dialogDescription}>Informe o nome exibido no catálogo.</DialogDescription><form key={genre?.id_genero ?? "new"} className={styles.form} onSubmit={save}><label className={styles.wide}>Nome<input name="nome" required maxLength={100} defaultValue={genre?.nome ?? ""} /></label><label>Status<select name="status" defaultValue={genre?.status ?? "ATIVO"}><option value="ATIVO">Ativo</option><option value="INATIVO">Inativo</option></select></label>{error && <p className={`${styles.error} ${styles.wide}`} role="alert">{error}</p>}<div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={close}>Cancelar</button><button type="submit" className={styles.primary} disabled={pending}>{pending ? "Salvando…" : genre ? "Salvar alterações" : "Cadastrar gênero"}</button></div></form></>}
      {dialog?.type === "status" && <><DialogDescription className={styles.dialogDescription}>{genre?.status === "ATIVO" ? `Arquivar ${genre?.nome} remove o gênero das opções ativas. O registro permanece no admin.` : `Reativar ${genre?.nome} devolve o gênero às opções ativas.`}</DialogDescription>{error && <p className={styles.error} role="alert">{error}</p>}<div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={close}>Cancelar</button><button type="button" className={genre?.status === "ATIVO" ? styles.danger : styles.primary} disabled={pending} onClick={() => run(() => catalogRequest(`genres/${genre.id_genero}`, { method: genre.status === "ATIVO" ? "DELETE" : "PATCH", body: genre.status === "ATIVO" ? undefined : { status: "ATIVO" } }), genre?.status === "ATIVO" ? "Gênero arquivado." : "Gênero reativado.")}>{pending ? "Aguarde…" : genre?.status === "ATIVO" ? "Arquivar gênero" : "Reativar gênero"}</button></div></>}
    </DialogContent></Dialog>
  </CatalogLayout>;
}
