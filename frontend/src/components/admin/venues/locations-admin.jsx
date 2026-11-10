"use client";

import TablePagination from '@/components/ui/table-pagination';
import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { Archive, DoorOpen, Pencil, Plus, RotateCcw, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAdminVenues, useVenueActions, venueRequest } from "@/hooks/admin/use-admin-venues";
import VenueLayout, { VenueState } from "./venue-layout";
import styles from "../catalog/catalog.module.css";

const nullable = ["cep", "logradouro", "numero", "complemento", "bairro", "telefone"];
const statusName = { ATIVO: "Ativo", INATIVO: "Inativo", MANUTENCAO: "Manutenção" };

function readFields(form) {
  const value = (key) => String(form.get(key) ?? "").trim();
  const body = { nome: value("nome"), cidade: value("cidade"), estado: value("estado").toUpperCase(), status: value("status") };
  for (const key of nullable) body[key] = value(key) || null;
  if (!body.nome || !body.cidade || !/^[A-Z]{2}$/.test(body.estado)) throw new Error("Informe nome, cidade e UF válida.");
  if (body.cep && !/^\d{5}-\d{3}$/.test(body.cep)) throw new Error("Informe o CEP no formato 00000-000.");
  return body;
}

export default function LocationsAdmin() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Todos");
  const search = useDeferredValue(query.trim().toLocaleLowerCase("pt-BR"));
  const list = useAdminVenues(`locations?limit=20${status === "Todos" ? "" : `&status=${status}`}${search ? `&q=${encodeURIComponent(search)}` : ''}`);
  const actions = useVenueActions(list);
  const visible = list.items;
  const item = actions.dialog?.item;

  function save(event) {
    event.preventDefault();
    let body;
    try { body = readFields(new FormData(event.currentTarget)); }
    catch (error) { actions.setError(error.message); return; }
    if (item) {
      body = Object.fromEntries(Object.entries(body).filter(([key, value]) => value !== item[key]));
      if (!Object.keys(body).length) { actions.setError("Nenhuma alteração para salvar."); return; }
    }
    actions.run(() => venueRequest(item ? `locations/${item.id_local}` : "locations", { method: item ? "PATCH" : "POST", body }), item ? "Cinema atualizado." : "Cinema cadastrado.");
  }

  return <VenueLayout title="Cinemas" description="Gerencie os locais de exibição e seus dados de atendimento." action={<button type="button" className={styles.primary} onClick={() => actions.open("form")}><Plus size={16} aria-hidden="true" />Novo cinema</button>}>
    {actions.notice && <p className={styles.notice} role="status">{actions.notice}</p>}
    <section className={styles.panel} aria-labelledby="locations-title"><header className={styles.panelHeader}><div><h2 id="locations-title">Cinemas cadastrados</h2><p>Selecione um cinema para administrar suas salas.</p></div><span className={styles.count}>{list.items.length} carregados</span></header>
      <div className={styles.toolbar}><label className={styles.search}><Search size={16} aria-hidden="true" /><span className="sr-only">Filtrar cinemas carregados</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar cinemas carregados" /></label><label className={styles.filter}>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option>Todos</option><option value="ATIVO">Ativos</option><option value="INATIVO">Inativos</option><option value="MANUTENCAO">Manutenção</option></select></label></div>
      {visible.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de cinemas; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Cinemas cadastrados</caption><thead><tr><th scope="col">Cinema</th><th scope="col">Cidade</th><th scope="col">CEP</th><th scope="col">Status</th><th scope="col" aria-label="Ações" /></tr></thead><tbody>{visible.map((row) => <tr key={row.id_local}><th scope="row">{row.nome}</th><td>{row.cidade}, {row.estado}</td><td className={styles.muted}>{row.cep || "—"}</td><td><span className={`${styles.badge} ${row.status !== "ATIVO" ? styles.inactive : ""}`}>{statusName[row.status] ?? row.status}</span></td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Editar cinema" aria-label={`Editar ${row.nome}`} onClick={() => actions.open("form", row)}><Pencil size={16} aria-hidden="true" /></button><Link href={`/admin/locais/salas?local=${row.id_local}`} className={styles.iconButton} title="Ver salas" aria-label={`Salas de ${row.nome}`}><DoorOpen size={16} aria-hidden="true" /></Link><button type="button" className={`${styles.iconButton} ${row.status !== "INATIVO" ? styles.destructive : ""}`} title={row.status === "INATIVO" ? "Reativar cinema" : "Arquivar cinema"} aria-label={`${row.status === "INATIVO" ? "Reativar" : "Arquivar"} ${row.nome}`} onClick={() => actions.open("status", row)}>{row.status === "INATIVO" ? <RotateCcw size={16} aria-hidden="true" /> : <Archive size={16} aria-hidden="true" />}</button></div></td></tr>)}</tbody></table></div>}
      <VenueState list={list} empty="Nenhum cinema encontrado para este status." noun="cinemas" />
      {!list.loading && !list.error && list.items.length > 0 && !visible.length && <p className={styles.state}>Nenhum cinema carregado corresponde à busca.{list.nextCursor ? " Carregue mais registros para ampliar a busca." : ""}</p>}
      <TablePagination list={list} />
    </section>
    <Dialog open={Boolean(actions.dialog)} onOpenChange={(value) => { if (!value) actions.close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{actions.dialog?.type === "status" ? `${item?.status === "INATIVO" ? "Reativar" : "Arquivar"} cinema` : item ? "Editar cinema" : "Novo cinema"}</DialogTitle>
      {actions.dialog?.type === "form" && <><DialogDescription className={styles.dialogDescription}>Cadastre os dados do cinema. Salas e assentos são administrados nas próximas abas.</DialogDescription><form key={item?.id_local ?? "new"} className={styles.form} onSubmit={save}>
        <label className={styles.wide}>Nome<input name="nome" required maxLength={150} defaultValue={item?.nome ?? ""} /></label>
        <label>Cidade<input name="cidade" required maxLength={100} defaultValue={item?.cidade ?? ""} /></label>
        <label>UF<input name="estado" required maxLength={2} pattern="[A-Za-z]{2}" defaultValue={item?.estado ?? ""} /></label>
        <label>CEP<input name="cep" inputMode="numeric" maxLength={9} placeholder="00000-000" defaultValue={item?.cep ?? ""} onInput={(event) => { const digits = event.currentTarget.value.replace(/\D/g, "").slice(0, 8); event.currentTarget.value = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits; }} /></label>
        <label>Telefone<input name="telefone" type="tel" maxLength={20} defaultValue={item?.telefone ?? ""} /></label>
        <label className={styles.wide}>Logradouro<input name="logradouro" maxLength={150} defaultValue={item?.logradouro ?? ""} /></label>
        <label>Número<input name="numero" maxLength={20} defaultValue={item?.numero ?? ""} /></label>
        <label>Complemento<input name="complemento" maxLength={100} defaultValue={item?.complemento ?? ""} /></label>
        <label>Bairro<input name="bairro" maxLength={100} defaultValue={item?.bairro ?? ""} /></label>
        <label>Status<select name="status" defaultValue={item?.status ?? "ATIVO"}><option value="ATIVO">Ativo</option><option value="MANUTENCAO">Manutenção</option><option value="INATIVO">Inativo</option></select></label>
        <p className={`${styles.hint} ${styles.wide}`}>Cinemas com sessões vinculadas só permitem alterar o telefone. Para arquivar um cinema, desative as salas primeiro.</p>
        {actions.error && <p className={`${styles.error} ${styles.wide}`} role="alert">{actions.error}</p>}
        <div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="submit" className={styles.primary} disabled={actions.pending}>{actions.pending ? "Salvando…" : item ? "Salvar alterações" : "Cadastrar cinema"}</button></div>
      </form></>}
      {actions.dialog?.type === "status" && <><DialogDescription className={styles.dialogDescription}>{item?.status === "INATIVO" ? `Reativar ${item?.nome}?` : `Arquivar ${item?.nome}? O cinema deixará de aparecer no catálogo público. Salas ativas e sessões vinculadas impedem o arquivamento.`}</DialogDescription>{actions.error && <p className={styles.error} role="alert">{actions.error}</p>}<div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="button" className={item?.status === "INATIVO" ? styles.primary : styles.danger} disabled={actions.pending} onClick={() => actions.run(() => venueRequest(`locations/${item.id_local}`, { method: item.status === "INATIVO" ? "PATCH" : "DELETE", body: item.status === "INATIVO" ? { status: "ATIVO" } : undefined }), item?.status === "INATIVO" ? "Cinema reativado." : "Cinema arquivado.")}>{actions.pending ? "Aguarde…" : item?.status === "INATIVO" ? "Reativar cinema" : "Arquivar cinema"}</button></div></>}
    </DialogContent></Dialog>
  </VenueLayout>;
}
