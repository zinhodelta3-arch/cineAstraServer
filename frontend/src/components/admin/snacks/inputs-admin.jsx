"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { Archive, Boxes, Images, Pencil, Plus, RotateCcw, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAdminVenues } from "@/hooks/admin/use-admin-venues";
import { snackRequest, useAdminSnacks, useSnackActions } from "@/hooks/admin/use-admin-snacks";
import SnackLayout, { SnackState } from "./snack-layout";
import styles from "../catalog/catalog.module.css";

function inputFields(form, existing) {
  const value = (key) => String(form.get(key) ?? "").trim();
  const minimum = Number(value("quantidade_minima"));
  const price = Number(value("preco"));
  if (!value("nome") || value("nome").length > 150 || !Number.isInteger(minimum) || minimum < 0 || minimum > 2147483647 || !Number.isFinite(price) || price < 0 || price > 99999999.99) throw new Error("Confira nome, estoque mínimo e preço.");
  const body = { nome: value("nome"), descricao: value("descricao") || null, categoria: value("categoria") || null, quantidade_minima: minimum, preco: price.toFixed(2), venda_avulsa: form.has("venda_avulsa") };
  if (!existing) return { ...body, supplierId: value("supplierId"), localId: value("localId") };
  body.status = value("status");
  return Object.fromEntries(Object.entries(body).filter(([key, entry]) => entry !== existing[key]));
}

export default function InputsAdmin() {
  const [query, setQuery] = useState("");
  const [localId, setLocalId] = useState("");
  const [status, setStatus] = useState("Todos");
  const [formSupplierId, setFormSupplierId] = useState("");
  const [formLocalId, setFormLocalId] = useState("");
  const [grantPending, setGrantPending] = useState(false);
  const [grantError, setGrantError] = useState("");
  const search = useDeferredValue(query.trim().toLocaleLowerCase("pt-BR"));
  const params = new URLSearchParams({ limit: "20" });
  if (localId) params.set("localId", localId);
  if (status !== "Todos") params.set("status", status);
  const list = useAdminSnacks(`inputs?${params}`);
  const categories = useAdminSnacks("inputs/categories?limit=100");
  const suppliers = useAdminSnacks("suppliers?limit=100&status=ATIVO");
  const locals = useAdminVenues("locations?limit=100");
  const grants = useAdminSnacks(formSupplierId && formLocalId ? `suppliers/${formSupplierId}/locations?limit=100` : null);
  const actions = useSnackActions(list);
  const item = actions.dialog?.item;
  const visible = list.items.filter((row) => `${row.nome} ${row.categoria ?? ""}`.toLocaleLowerCase("pt-BR").includes(search));
  const grant = grants.items.find((row) => row.id_local === formLocalId && row.status === "ATIVO");

  function open(type, row = null) { setGrantError(""); setFormSupplierId(row?.id_fornecedor ?? ""); setFormLocalId(row?.id_local ?? ""); actions.open(type, row); }
  async function authorize() {
    if (!formSupplierId || !formLocalId || grantPending) return;
    setGrantPending(true); setGrantError("");
    try { await snackRequest(`suppliers/${formSupplierId}/locations`, { method: "POST", body: { localId: formLocalId } }); grants.reload(); }
    catch (cause) { setGrantError(cause.message); }
    finally { setGrantPending(false); }
  }
  function save(event) {
    event.preventDefault();
    let body;
    try { body = inputFields(new FormData(event.currentTarget), item); }
    catch (cause) { actions.setError(cause.message); return; }
    if (!item && (!body.supplierId || !body.localId)) { actions.setError("Selecione o fornecedor e o cinema."); return; }
    if (!item && !grant) { actions.setError("Autorize o fornecedor para este cinema antes de cadastrar o insumo."); return; }
    if (item && !Object.keys(body).length) { actions.setError("Nenhuma alteração para salvar."); return; }
    actions.run(() => snackRequest(item ? `inputs/${item.id_insumo}` : "inputs", { method: item ? "PATCH" : "POST", body }), item ? "Insumo atualizado." : "Insumo cadastrado.");
  }
  const supplierName = (id) => suppliers.items.find((supplier) => supplier.id_fornecedor === id)?.nome_cine || suppliers.items.find((supplier) => supplier.id_fornecedor === id)?.razao_social || `Fornecedor #${id}`;
  const localName = (id) => locals.items.find((local) => local.id_local === id)?.nome || `Cinema #${id}`;

  return <SnackLayout title="Insumos" description="Gerencie os produtos avulsos e os ingredientes usados nos combos." action={<button type="button" className={styles.primary} onClick={() => open("form")}><Plus size={16} aria-hidden="true" />Novo insumo</button>}>
    {actions.notice && <p className={styles.notice} role="status">{actions.notice}</p>}
    <section className={styles.panel} aria-labelledby="inputs-title"><header className={styles.panelHeader}><div><h2 id="inputs-title">Catálogo de insumos</h2><p>O estoque é atualizado na aba Estoque.</p></div><span className={styles.count}>{list.items.length} carregados</span></header>
      <div className={styles.toolbar}><label className={styles.search}><Search size={16} aria-hidden="true" /><span className="sr-only">Filtrar insumos carregados</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar insumos carregados" /></label><label className={styles.filter}>Cinema<select value={localId} onChange={(event) => setLocalId(event.target.value)}><option value="">Todos</option>{locals.items.map((local) => <option key={local.id_local} value={local.id_local}>{local.nome}</option>)}</select></label><label className={styles.filter}>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option>Todos</option><option value="DISPONIVEL">Disponíveis</option><option value="INDISPONIVEL">Indisponíveis</option></select></label>{locals.nextCursor && <button type="button" className={styles.secondary} onClick={locals.loadMore} disabled={locals.loadingMore}>Mais cinemas</button>}</div>
      {visible.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de insumos; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Insumos do AstraSnack</caption><thead><tr><th scope="col">Insumo</th><th scope="col">Cinema</th><th scope="col">Fornecedor</th><th scope="col">Estoque</th><th scope="col">Preço</th><th scope="col">Venda avulsa</th><th scope="col">Status</th><th scope="col" aria-label="Ações" /></tr></thead><tbody>{visible.map((row) => <tr key={row.id_insumo}><th scope="row">{row.nome}<small className={styles.muted}> · #{row.id_insumo}</small></th><td>{localName(row.id_local)}</td><td>{supplierName(row.id_fornecedor)}</td><td>{row.quantidade}</td><td>R$ {Number(row.preco).toFixed(2).replace(".", ",")}</td><td>{row.venda_avulsa ? "Sim" : "Não"}</td><td><span className={`${styles.badge} ${row.status !== "DISPONIVEL" ? styles.inactive : ""}`}>{row.status === "DISPONIVEL" ? "Disponível" : "Indisponível"}</span></td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Editar insumo" aria-label={`Editar ${row.nome}`} onClick={() => open("form", row)}><Pencil size={16} aria-hidden="true" /></button><Link className={styles.iconButton} href={`/admin/astrasnack/imagens?insumo=${row.id_insumo}`} title="Ver imagens" aria-label={`Imagens de ${row.nome}`}><Images size={16} aria-hidden="true" /></Link><Link className={styles.iconButton} href={`/admin/astrasnack/estoque?insumo=${row.id_insumo}`} title="Ver estoque" aria-label={`Estoque de ${row.nome}`}><Boxes size={16} aria-hidden="true" /></Link><button type="button" className={`${styles.iconButton} ${row.status === "DISPONIVEL" ? styles.destructive : ""}`} title={row.status === "DISPONIVEL" ? "Arquivar insumo" : "Reativar insumo"} aria-label={`${row.status === "DISPONIVEL" ? "Arquivar" : "Reativar"} ${row.nome}`} onClick={() => open("status", row)}>{row.status === "DISPONIVEL" ? <Archive size={16} aria-hidden="true" /> : <RotateCcw size={16} aria-hidden="true" />}</button></div></td></tr>)}</tbody></table></div>}
      <SnackState list={list} empty="Nenhum insumo encontrado para estes filtros." noun="insumos" />
      {!list.loading && !list.error && list.items.length > 0 && !visible.length && <p className={styles.state}>Nenhum insumo carregado corresponde à busca.{list.nextCursor ? " Carregue mais registros para ampliar a busca." : ""}</p>}
      <footer className={styles.footer}><span>Exibindo {visible.length} de {list.items.length} insumos carregados{list.nextCursor ? " · há mais registros" : ""}</span><button type="button" onClick={list.loadMore} disabled={!list.nextCursor || list.loadingMore}>{list.loadingMore ? "Carregando…" : "Carregar mais"}</button></footer>
    </section>
    <Dialog open={Boolean(actions.dialog)} onOpenChange={(value) => { if (!value) actions.close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{actions.dialog?.type === "status" ? `${item?.status === "DISPONIVEL" ? "Arquivar" : "Reativar"} insumo` : item ? "Editar insumo" : "Novo insumo"}</DialogTitle>
      {actions.dialog?.type === "form" && <><DialogDescription className={styles.dialogDescription}>Cadastre o item para um fornecedor autorizado neste cinema. A quantidade é controlada pelo estoque.</DialogDescription><form key={item?.id_insumo ?? "new"} className={styles.form} onSubmit={save}>
        {!item && <><label>Fornecedor<select name="supplierId" value={formSupplierId} onChange={(event) => setFormSupplierId(event.target.value)} required><option value="">Selecione</option>{suppliers.items.map((supplier) => <option key={supplier.id_fornecedor} value={supplier.id_fornecedor}>{supplier.nome_cine || supplier.razao_social}</option>)}</select></label><label>Cinema<select name="localId" value={formLocalId} onChange={(event) => setFormLocalId(event.target.value)} required><option value="">Selecione</option>{locals.items.filter((local) => local.status === "ATIVO").map((local) => <option key={local.id_local} value={local.id_local}>{local.nome}</option>)}</select></label>
          {formSupplierId && formLocalId && <div className={styles.wide}>{grants.loading ? <p className={styles.hint}>Verificando autorização…</p> : grant ? <p className={styles.hint}>Fornecedor autorizado para este cinema.</p> : <button type="button" className={styles.secondary} onClick={authorize} disabled={grantPending}>{grantPending ? "Autorizando…" : "Autorizar fornecedor neste cinema"}</button>}{grantError && <p className={styles.error} role="alert">{grantError}</p>}{grants.error && <p className={styles.error} role="alert">{grants.error}</p>}</div>}</>}
        {item && <p className={`${styles.hint} ${styles.wide}`}>{supplierName(item.id_fornecedor)} · {localName(item.id_local)}. Esses vínculos não podem ser alterados após o cadastro.</p>}
        <label className={styles.wide}>Nome<input name="nome" required maxLength={150} defaultValue={item?.nome ?? ""} /></label><label>Categoria<select name="categoria" defaultValue={item?.categoria ?? ""}><option value="">Sem categoria</option>{item?.categoria && !categories.items.some(row => row.name === item.categoria) && <option value={item.categoria}>{item.categoria}</option>}{categories.items.map(row => <option key={row.name} value={row.name}>{row.name}</option>)}</select></label>{categories.error && <p role="alert">{categories.error}</p>}{categories.nextCursor && <button type="button" className={styles.secondary} onClick={categories.loadMore} disabled={categories.loadingMore}>Mais categorias</button>}<label>Preço (R$)<input name="preco" type="number" min="0" max="99999999.99" step="0.01" required defaultValue={item?.preco ?? ""} /></label><label>Estoque mínimo<input name="quantidade_minima" type="number" min="0" max="2147483647" required defaultValue={item?.quantidade_minima ?? 0} /></label>{item && <label>Status<select name="status" defaultValue={item.status}><option value="DISPONIVEL">Disponível</option><option value="INDISPONIVEL">Indisponível</option></select></label>}<label className={styles.wide}>Descrição<textarea name="descricao" maxLength={10000} defaultValue={item?.descricao ?? ""} /></label><div className={`${styles.checks} ${styles.wide}`}><label><input type="checkbox" name="venda_avulsa" defaultChecked={item?.venda_avulsa ?? false} /> Produto vendido avulso</label></div>
        <div className={`${styles.dialogActions} ${styles.wide}`}>{suppliers.nextCursor && <button type="button" className={styles.secondary} onClick={suppliers.loadMore} disabled={suppliers.loadingMore}>Mais fornecedores</button>}{locals.nextCursor && <button type="button" className={styles.secondary} onClick={locals.loadMore} disabled={locals.loadingMore}>Mais cinemas</button>}{grants.nextCursor && <button type="button" className={styles.secondary} onClick={grants.loadMore} disabled={grants.loadingMore}>Mais vínculos</button>}</div>
        {actions.error && <p className={`${styles.error} ${styles.wide}`} role="alert">{actions.error}</p>}
        <div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="submit" className={styles.primary} disabled={actions.pending || grantPending}>{actions.pending ? "Salvando…" : item ? "Salvar alterações" : "Cadastrar insumo"}</button></div>
      </form></>}
      {actions.dialog?.type === "status" && <><DialogDescription className={styles.dialogDescription}>{item?.status === "DISPONIVEL" ? `Arquivar ${item?.nome}? O item deixará de estar disponível para venda.` : `Reativar ${item?.nome}? O fornecedor e o cinema precisam estar autorizados.`}</DialogDescription>{actions.error && <p className={styles.error} role="alert">{actions.error}</p>}<div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="button" className={item?.status === "DISPONIVEL" ? styles.danger : styles.primary} disabled={actions.pending} onClick={() => actions.run(() => snackRequest(`inputs/${item.id_insumo}`, { method: item.status === "DISPONIVEL" ? "DELETE" : "PATCH", body: item.status === "DISPONIVEL" ? undefined : { status: "DISPONIVEL" } }), item?.status === "DISPONIVEL" ? "Insumo arquivado." : "Insumo reativado.")}>{actions.pending ? "Aguarde…" : item?.status === "DISPONIVEL" ? "Arquivar insumo" : "Reativar insumo"}</button></div></>}
    </DialogContent></Dialog>
  </SnackLayout>;
}
