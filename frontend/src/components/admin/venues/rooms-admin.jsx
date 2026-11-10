"use client";

import TablePagination from '@/components/ui/table-pagination';
import Link from "next/link";
import { useEffect, useState } from "react";
import { Archive, Armchair, Pencil, Plus, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAdminVenues, useVenueActions, venueRequest } from "@/hooks/admin/use-admin-venues";
import VenueLayout, { VenuePicker, VenueState } from "./venue-layout";
import styles from "../catalog/catalog.module.css";

const types = ["2D", "3D", "4DX", "VIP", "IMAX"];
const statusName = { ATIVA: "Ativa", INATIVA: "Inativa", MANUTENCAO: "Manutenção" };

export default function RoomsAdmin() {
  const [local, setLocal] = useState(null);
  const [status, setStatus] = useState("Todos");
  const locals = useAdminVenues("locations?limit=100");
  const rooms = useAdminVenues(local ? `locations/${local.id_local}/rooms?limit=20${status === "Todos" ? "" : `&status=${status}`}` : null);
  const actions = useVenueActions(rooms);
  const item = actions.dialog?.item;

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("local");
    if (!/^[1-9]\d{0,9}$/.test(id ?? "")) return;
    let active = true;
    venueRequest(`locations/${id}`).then((result) => { if (active) setLocal(result); }).catch(() => {});
    return () => { active = false; };
  }, []);
  function selectLocal(value) {
    setLocal(value); setStatus("Todos");
    window.history.replaceState(null, "", value ? `/admin/locais/salas?local=${value.id_local}` : "/admin/locais/salas");
  }
  function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nome = String(form.get("nome") ?? "").trim();
    const capacidade = Number(form.get("capacidade"));
    if (!nome || nome.length > 100 || !Number.isInteger(capacidade) || capacidade < 1 || capacidade > 2147483647) { actions.setError("Informe um nome e uma capacidade válida."); return; }
    let body = { nome, capacidade, tipo: String(form.get("tipo")), status: String(form.get("status")) };
    if (item) {
      body = Object.fromEntries(Object.entries(body).filter(([key, value]) => value !== item[key]));
      if (!Object.keys(body).length) { actions.setError("Nenhuma alteração para salvar."); return; }
    }
    actions.run(() => venueRequest(`locations/${local.id_local}/rooms${item ? `/${item.id_sala}` : ""}`, { method: item ? "PATCH" : "POST", body }), item ? "Sala atualizada." : "Sala cadastrada.");
  }

  return <VenueLayout title="Salas" description="Organize as salas de cada cinema e controle sua capacidade." action={<button type="button" className={styles.primary} onClick={() => actions.open("form")} disabled={!local}><Plus size={16} aria-hidden="true" />Nova sala</button>}>
    {actions.notice && <p className={styles.notice} role="status">{actions.notice}</p>}
    <section className={styles.filmPicker} aria-label="Selecionar cinema"><VenuePicker label="Cinema" value={local?.id_local} selected={local} list={locals} idKey="id_local" onChange={selectLocal} placeholder="Selecione um cinema" /></section>
    <section className={styles.panel} aria-labelledby="rooms-title"><header className={styles.panelHeader}><div><h2 id="rooms-title">{local ? `Salas · ${local.nome}` : "Salas do cinema"}</h2><p>{local ? "Cadastre os assentos antes de ativar uma sala." : "Selecione um cinema para visualizar suas salas."}</p></div>{local && <span className={styles.count}>{rooms.items.length} carregadas</span>}</header>
      {local && <div className={styles.toolbar}><label className={styles.filter}>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option>Todos</option><option value="ATIVA">Ativas</option><option value="INATIVA">Inativas</option><option value="MANUTENCAO">Manutenção</option></select></label></div>}
      {!local && <p className={styles.state}>Selecione um cinema acima para começar.</p>}
      {local && <><VenueState list={rooms} empty="Nenhuma sala encontrada para este status." noun="salas" />
        {rooms.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de salas; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Salas de {local.nome}</caption><thead><tr><th scope="col">Sala</th><th scope="col">Tipo</th><th scope="col">Capacidade</th><th scope="col">Status</th><th scope="col" aria-label="Ações" /></tr></thead><tbody>{rooms.items.map((row) => <tr key={row.id_sala}><th scope="row">{row.nome}</th><td>{row.tipo}</td><td>{row.capacidade} lugares</td><td><span className={`${styles.badge} ${row.status !== "ATIVA" ? styles.inactive : ""}`}>{statusName[row.status] ?? row.status}</span></td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Editar sala" aria-label={`Editar ${row.nome}`} onClick={() => actions.open("form", row)}><Pencil size={16} aria-hidden="true" /></button><Link href={`/admin/locais/assentos?local=${local.id_local}&sala=${row.id_sala}`} className={styles.iconButton} title="Ver assentos" aria-label={`Assentos de ${row.nome}`}><Armchair size={16} aria-hidden="true" /></Link><button type="button" className={`${styles.iconButton} ${row.status !== "INATIVA" ? styles.destructive : ""}`} title={row.status === "INATIVA" ? "Ativar sala" : "Arquivar sala"} aria-label={`${row.status === "INATIVA" ? "Ativar" : "Arquivar"} ${row.nome}`} onClick={() => actions.open("status", row)}>{row.status === "INATIVA" ? <RotateCcw size={16} aria-hidden="true" /> : <Archive size={16} aria-hidden="true" />}</button></div></td></tr>)}</tbody></table></div>}
        <TablePagination list={rooms} /></>}
    </section>
    <Dialog open={Boolean(actions.dialog)} onOpenChange={(value) => { if (!value) actions.close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{actions.dialog?.type === "status" ? `${item?.status === "INATIVA" ? "Ativar" : "Arquivar"} sala` : item ? "Editar sala" : "Nova sala"}</DialogTitle>
      {actions.dialog?.type === "form" && <><DialogDescription className={styles.dialogDescription}>Sala do cinema {local?.nome}. A capacidade precisa corresponder aos assentos ativos para ativar.</DialogDescription><form key={item?.id_sala ?? "new"} className={styles.form} onSubmit={save}><label className={styles.wide}>Nome da sala<input name="nome" required maxLength={100} defaultValue={item?.nome ?? ""} /></label><label>Capacidade<input name="capacidade" type="number" required min="1" max="2147483647" defaultValue={item?.capacidade ?? ""} /></label><label>Tipo<select name="tipo" defaultValue={item?.tipo ?? "2D"}>{types.map((type) => <option key={type}>{type}</option>)}</select></label><label>Status<select name="status" defaultValue={item?.status ?? "INATIVA"}><option value="INATIVA">Inativa</option><option value="MANUTENCAO">Manutenção</option>{item && <option value="ATIVA">Ativa</option>}</select></label><p className={`${styles.hint} ${styles.wide}`}>Salas com sessões vinculadas não permitem alteração. Cadastre os assentos antes de ativar.</p>{actions.error && <p className={`${styles.error} ${styles.wide}`} role="alert">{actions.error}</p>}<div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="submit" className={styles.primary} disabled={actions.pending}>{actions.pending ? "Salvando…" : item ? "Salvar alterações" : "Cadastrar sala"}</button></div></form></>}
      {actions.dialog?.type === "status" && <><DialogDescription className={styles.dialogDescription}>{item?.status === "INATIVA" ? `Ativar ${item?.nome}? A capacidade deve corresponder aos assentos ativos.` : `Arquivar ${item?.nome}? Salas com sessões vinculadas não podem ser arquivadas.`}</DialogDescription>{actions.error && <p className={styles.error} role="alert">{actions.error}</p>}<div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="button" className={item?.status === "INATIVA" ? styles.primary : styles.danger} disabled={actions.pending} onClick={() => actions.run(() => venueRequest(`locations/${local.id_local}/rooms/${item.id_sala}`, { method: item.status === "INATIVA" ? "PATCH" : "DELETE", body: item.status === "INATIVA" ? { status: "ATIVA" } : undefined }), item?.status === "INATIVA" ? "Sala ativada." : "Sala arquivada.")}>{actions.pending ? "Aguarde…" : item?.status === "INATIVA" ? "Ativar sala" : "Arquivar sala"}</button></div></>}
    </DialogContent></Dialog>
  </VenueLayout>;
}
