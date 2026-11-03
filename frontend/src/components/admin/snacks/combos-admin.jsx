"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import { Archive, Images, ListPlus, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAdminVenues } from "@/hooks/admin/use-admin-venues";
import { snackRequest, useAdminSnacks, useSnackActions } from "@/hooks/admin/use-admin-snacks";
import SnackLayout, { SnackState } from "./snack-layout";
import styles from "../catalog/catalog.module.css";

function details(form) {
  const name = String(form.get("nome") ?? "").trim();
  const description = String(form.get("descricao") ?? "").trim();
  const price = Number(form.get("preco"));
  if (!name || name.length > 150 || !Number.isFinite(price) || price < 0 || price > 99999999.99) throw new Error("Confira o nome e o preço do combo.");
  return { nome: name, descricao: description || null, preco: price.toFixed(2) };
}

export default function CombosAdmin() {
  const [query, setQuery] = useState("");
  const [localId, setLocalId] = useState("");
  const [active, setActive] = useState("Todos");
  const [formLocalId, setFormLocalId] = useState("");
  const [inputChoice, setInputChoice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [composition, setComposition] = useState([]);
  const [compositionLoading, setCompositionLoading] = useState(false);
  const [compositionLoaded, setCompositionLoaded] = useState(false);
  const [compositionError, setCompositionError] = useState("");
  const [retry, setRetry] = useState(0);
  const search = useDeferredValue(query.trim());
  const params = new URLSearchParams({ limit: "20" });
  if (search) params.set("q", search);
  if (localId) params.set("localId", localId);
  if (active !== "Todos") params.set("active", active);
  const list = useAdminSnacks(`combos?${params}`);
  const locals = useAdminVenues("locations?limit=100");
  const actions = useSnackActions(list);
  const inputs = useAdminSnacks(formLocalId && ["form", "composition"].includes(actions.dialog?.type) ? `inputs?limit=100&localId=${formLocalId}&status=DISPONIVEL` : null);
  const item = actions.dialog?.item;
  useEffect(() => {
    if (actions.dialog?.type !== "composition" || !item) return;
    let active = true;
    setCompositionLoading(true); setCompositionLoaded(false); setCompositionError("");
    snackRequest(`combos/${item.id_combo}`).then((detail) => {
      if (active) { setComposition(detail.items.map((part) => ({ inputId: part.id_insumo, quantidade: part.quantidade, nome: part.nome }))); setCompositionLoaded(true); }
    }).catch((cause) => { if (active) setCompositionError(cause.message); }).finally(() => { if (active) setCompositionLoading(false); });
    return () => { active = false; };
  }, [actions.dialog?.type, item?.id_combo, retry]);

  function open(type, row = null) { setComposition([]); setCompositionError(""); setInputChoice(""); setQuantity("1"); setFormLocalId(row?.id_local ?? ""); actions.open(type, row); }
  function addPart() {
    const count = Number(quantity);
    const input = inputs.items.find((row) => row.id_insumo === inputChoice);
    if (!input || !Number.isInteger(count) || count < 1 || count > 2147483647) { setCompositionError("Selecione um insumo e uma quantidade válida."); return; }
    if (composition.some((part) => part.inputId === inputChoice)) { setCompositionError("Este insumo já está na composição."); return; }
    if (composition.length >= 100) { setCompositionError("O combo aceita até 100 insumos."); return; }
    setComposition((value) => [...value, { inputId: inputChoice, quantidade: count, nome: input.nome }]); setCompositionError(""); setInputChoice(""); setQuantity("1");
  }
  function validateParts() {
    if (!composition.length) throw new Error("Adicione ao menos um insumo à composição.");
    if (composition.some((part) => !Number.isInteger(part.quantidade) || part.quantidade < 1 || part.quantidade > 2147483647)) throw new Error("Confira a quantidade de cada insumo.");
    return composition.map((part) => ({ inputId: part.inputId, quantidade: part.quantidade }));
  }
  function save(event) {
    event.preventDefault();
    let body;
    try { body = details(new FormData(event.currentTarget)); if (!item) { if (!formLocalId) throw new Error("Selecione um cinema."); body = { ...body, localId: formLocalId, items: validateParts() }; } }
    catch (cause) { actions.setError(cause.message); return; }
    if (item) {
      body = Object.fromEntries(Object.entries(body).filter(([key, value]) => value !== item[key]));
      if (!Object.keys(body).length) { actions.setError("Nenhuma alteração para salvar."); return; }
    }
    actions.run(() => snackRequest(item ? `combos/${item.id_combo}` : "combos", { method: item ? "PATCH" : "POST", body }), item ? "Combo atualizado." : "Combo cadastrado.");
  }
  function saveComposition() {
    let items;
    try { items = validateParts(); } catch (cause) { setCompositionError(cause.message); return; }
    actions.run(() => snackRequest(`combos/${item.id_combo}/items`, { method: "PUT", body: { items } }), "Composição atualizada.");
  }
  const localName = (id) => locals.items.find((local) => local.id_local === id)?.nome ?? (id ? `Cinema #${id}` : "Sem cinema");

  function compositionEditor() {
    return <div className={styles.wide}>
      <div className={styles.compositionControls}><label>Insumo<select value={inputChoice} onChange={(event) => setInputChoice(event.target.value)}><option value="">Selecione</option>{inputs.items.map((input) => <option key={input.id_insumo} value={input.id_insumo}>{input.nome}</option>)}</select></label><label>Quantidade<input type="number" min="1" max="2147483647" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label><button type="button" className={styles.secondary} onClick={addPart}><ListPlus size={16} aria-hidden="true" />Adicionar</button></div>
      <ul className={styles.compositionList}>{composition.map((part) => <li key={part.inputId}><span>{part.nome} <small className={styles.muted}>#{part.inputId}</small></span><label>Qtd.<input type="number" min="1" max="2147483647" value={part.quantidade} onChange={(event) => { const next = Number(event.target.value); setComposition((value) => value.map((row) => row.inputId === part.inputId ? { ...row, quantidade: next } : row)); setCompositionError(""); }} /></label><button type="button" className={styles.iconButton} title="Remover insumo" aria-label={`Remover ${part.nome}`} onClick={() => { setComposition((value) => value.filter((row) => row.inputId !== part.inputId)); setCompositionError(""); }}><Trash2 size={16} aria-hidden="true" /></button></li>)}</ul>
      {!composition.length && <p className={styles.hint}>Adicione pelo menos um insumo do mesmo cinema.</p>}
      {inputs.error && <p className={styles.error} role="alert">{inputs.error}</p>}{compositionError && <p className={styles.error} role="alert">{compositionError}</p>}
      {inputs.nextCursor && <button type="button" className={styles.secondary} onClick={inputs.loadMore} disabled={inputs.loadingMore}>{inputs.loadingMore ? "Carregando…" : "Mais insumos"}</button>}
    </div>;
  }

  return <SnackLayout title="Combos" description="Monte ofertas com insumos do mesmo cinema." action={<button type="button" className={styles.primary} onClick={() => open("form")}><Plus size={16} aria-hidden="true" />Novo combo</button>}>
    {actions.notice && <p className={styles.notice} role="status">{actions.notice}</p>}
    <section className={styles.panel} aria-labelledby="combos-title"><header className={styles.panelHeader}><div><h2 id="combos-title">Combos cadastrados</h2><p>Edite a oferta e sua composição separadamente.</p></div><span className={styles.count}>{list.items.length} carregados</span></header>
      <div className={styles.toolbar}><label className={styles.search}><Search size={16} aria-hidden="true" /><span className="sr-only">Buscar combo</span><input type="search" maxLength={150} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar combo" /></label><label className={styles.filter}>Cinema<select value={localId} onChange={(event) => setLocalId(event.target.value)}><option value="">Todos</option>{locals.items.map((local) => <option key={local.id_local} value={local.id_local}>{local.nome}</option>)}</select></label><label className={styles.filter}>Status<select value={active} onChange={(event) => setActive(event.target.value)}><option>Todos</option><option value="true">Ativos</option><option value="false">Arquivados</option></select></label>{locals.nextCursor && <button type="button" className={styles.secondary} onClick={locals.loadMore} disabled={locals.loadingMore}>Mais cinemas</button>}</div>
      <SnackState list={list} empty="Nenhum combo encontrado para estes filtros." noun="combos" />
      {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de combos; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Combos do AstraSnack</caption><thead><tr><th scope="col">Combo</th><th scope="col">Cinema</th><th scope="col">Insumos</th><th scope="col">Preço</th><th scope="col">Status</th><th scope="col" aria-label="Ações" /></tr></thead><tbody>{list.items.map((row) => <tr key={row.id_combo}><th scope="row">{row.nome}<small className={styles.muted}> · #{row.id_combo}</small></th><td>{localName(row.id_local)}</td><td>{row.itemCount}</td><td>R$ {Number(row.preco).toFixed(2).replace(".", ",")}</td><td><span className={`${styles.badge} ${!row.ativo ? styles.inactive : ""}`}>{row.ativo ? "Ativo" : "Arquivado"}</span></td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Editar combo" aria-label={`Editar ${row.nome}`} disabled={!row.ativo} onClick={() => open("form", row)}><Pencil size={16} aria-hidden="true" /></button><Link className={styles.iconButton} href={`/admin/astrasnack/imagens?combo=${row.id_combo}`} title="Ver imagens" aria-label={`Imagens de ${row.nome}`}><Images size={16} aria-hidden="true" /></Link><button type="button" className={styles.iconButton} title="Editar composição" aria-label={`Composição de ${row.nome}`} disabled={!row.ativo} onClick={() => open("composition", row)}><ListPlus size={16} aria-hidden="true" /></button><button type="button" className={`${styles.iconButton} ${styles.destructive}`} title="Arquivar combo" aria-label={`Arquivar ${row.nome}`} disabled={!row.ativo} onClick={() => open("archive", row)}><Archive size={16} aria-hidden="true" /></button></div></td></tr>)}</tbody></table></div>}
      <footer className={styles.footer}><span>Exibindo {list.items.length} combos{list.nextCursor ? " · há mais registros" : ""}</span><button type="button" onClick={list.loadMore} disabled={!list.nextCursor || list.loadingMore}>{list.loadingMore ? "Carregando…" : "Carregar mais"}</button></footer>
    </section>
    <Dialog open={Boolean(actions.dialog)} onOpenChange={(value) => { if (!value) actions.close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{actions.dialog?.type === "archive" ? "Arquivar combo" : actions.dialog?.type === "composition" ? `Composição · ${item?.nome}` : item ? "Editar combo" : "Novo combo"}</DialogTitle>
      {actions.dialog?.type === "form" && <><DialogDescription className={styles.dialogDescription}>Use insumos disponíveis do mesmo cinema. Depois do cadastro, a composição pode ser editada separadamente.</DialogDescription><form key={item?.id_combo ?? "new"} className={styles.form} onSubmit={save}>
        {!item && <label className={styles.wide}>Cinema<select value={formLocalId} onChange={(event) => { setFormLocalId(event.target.value); setComposition([]); setInputChoice(""); }} required><option value="">Selecione</option>{locals.items.filter((local) => local.status === "ATIVO").map((local) => <option key={local.id_local} value={local.id_local}>{local.nome}</option>)}</select></label>}
        {item && <p className={`${styles.hint} ${styles.wide}`}>{localName(item.id_local)}. O cinema do combo não pode ser alterado.</p>}
        <label className={styles.wide}>Nome<input name="nome" required maxLength={150} defaultValue={item?.nome ?? ""} /></label><label>Preço (R$)<input name="preco" type="number" min="0" max="99999999.99" step="0.01" required defaultValue={item?.preco ?? ""} /></label><label className={styles.wide}>Descrição<textarea name="descricao" maxLength={10000} defaultValue={item?.descricao ?? ""} /></label>
        {!item && compositionEditor()}{actions.error && <p className={`${styles.error} ${styles.wide}`} role="alert">{actions.error}</p>}
        <div className={`${styles.dialogActions} ${styles.wide}`}>{locals.nextCursor && !item && <button type="button" className={styles.secondary} onClick={locals.loadMore} disabled={locals.loadingMore}>Mais cinemas</button>}<button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="submit" className={styles.primary} disabled={actions.pending}>{actions.pending ? "Salvando…" : item ? "Salvar alterações" : "Cadastrar combo"}</button></div>
      </form></>}
      {actions.dialog?.type === "composition" && <><DialogDescription className={styles.dialogDescription}>Altere a quantidade ou substitua os insumos deste combo.</DialogDescription>{compositionLoading ? <p role="status">Carregando composição…</p> : compositionLoaded ? compositionEditor() : <div>{compositionError && <p className={styles.error} role="alert">{compositionError}</p>}<button type="button" className={styles.secondary} onClick={() => setRetry((value) => value + 1)}>Tentar novamente</button></div>}{actions.error && <p className={styles.error} role="alert">{actions.error}</p>}<div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="button" className={styles.primary} onClick={saveComposition} disabled={actions.pending || !compositionLoaded || Boolean(compositionError)}>{actions.pending ? "Salvando…" : "Salvar composição"}</button></div></>}
      {actions.dialog?.type === "archive" && <><DialogDescription className={styles.dialogDescription}>Arquivar {item?.nome}? O combo deixará de aparecer para compra.</DialogDescription>{actions.error && <p className={styles.error} role="alert">{actions.error}</p>}<div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="button" className={styles.danger} disabled={actions.pending} onClick={() => actions.run(() => snackRequest(`combos/${item.id_combo}`, { method: "DELETE" }), "Combo arquivado.")}>{actions.pending ? "Aguarde…" : "Arquivar combo"}</button></div></>}
    </DialogContent></Dialog>
  </SnackLayout>;
}
