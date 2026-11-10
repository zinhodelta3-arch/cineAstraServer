"use client";

import TablePagination from '@/components/ui/table-pagination';
import { useEffect, useState } from "react";
import { Archive, Pencil, Plus, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAdminVenues, useVenueActions, venueRequest } from "@/hooks/admin/use-admin-venues";
import VenueLayout, { VenuePicker, VenueState } from "./venue-layout";
import styles from "../catalog/catalog.module.css";

const seatTypes = [{ value: "COMUM", label: "Comum" }, { value: "PCD", label: "PCD" }, { value: "OBESO", label: "Obeso" }, { value: "IDOSO", label: "Idoso" }, { value: "CASAL", label: "Casal" }];
const typeName = (value) => seatTypes.find((type) => type.value === value)?.label ?? value;

export default function SeatsAdmin() {
  const [local, setLocal] = useState(null);
  const [room, setRoom] = useState(null);
  const [status, setStatus] = useState("Todos");
  const [accessible, setAccessible] = useState("Todos");
  const locals = useAdminVenues("locations?limit=100");
  const rooms = useAdminVenues(local ? `locations/${local.id_local}/rooms?limit=100` : null);
  const params = new URLSearchParams({ limit: "20" });
  if (status !== "Todos") params.set("status", status);
  if (accessible !== "Todos") params.set("accessible", accessible);
  const seats = useAdminVenues(local && room ? `locations/${local.id_local}/rooms/${room.id_sala}/seats?${params}` : null);
  const actions = useVenueActions(seats);
  const item = actions.dialog?.item;

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const localId = query.get("local");
    const roomId = query.get("sala");
    if (!/^[1-9]\d{0,9}$/.test(localId ?? "")) return;
    let active = true;
    venueRequest(`locations/${localId}`).then(async (place) => {
      if (!active) return;
      setLocal(place);
      if (/^[1-9]\d{0,9}$/.test(roomId ?? "")) {
        const hall = await venueRequest(`locations/${localId}/rooms/${roomId}`);
        if (active) setRoom(hall);
      }
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  function selectLocal(value) {
    setLocal(value); setRoom(null); setStatus("Todos"); setAccessible("Todos");
    window.history.replaceState(null, "", value ? `/admin/locais/assentos?local=${value.id_local}` : "/admin/locais/assentos");
  }
  function selectRoom(value) {
    setRoom(value); setStatus("Todos"); setAccessible("Todos");
    window.history.replaceState(null, "", value ? `/admin/locais/assentos?local=${local.id_local}&sala=${value.id_sala}` : `/admin/locais/assentos?local=${local.id_local}`);
  }
  function save(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fileira = String(form.get("fileira") ?? "").trim().toUpperCase();
    const numero = Number(form.get("numero"));
    if (!/^[A-Z0-9]{1,5}$/.test(fileira) || !Number.isInteger(numero) || numero < 1 || numero > 2147483647) { actions.setError("Informe uma fileira de até 5 letras ou números e um número válido."); return; }
    let body = { fileira, numero, tipo: String(form.get("tipo")), status: String(form.get("status")) };
    if (item) {
      body = Object.fromEntries(Object.entries(body).filter(([key, value]) => value !== item[key]));
      if (!Object.keys(body).length) { actions.setError("Nenhuma alteração para salvar."); return; }
    }
    actions.run(() => venueRequest(`locations/${local.id_local}/rooms/${room.id_sala}/seats${item ? `/${item.id_assento}` : ""}`, { method: item ? "PATCH" : "POST", body }), item ? "Assento atualizado." : "Assento cadastrado.");
  }

  return <VenueLayout title="Assentos" description="Organize os lugares e os recursos de acessibilidade de cada sala." action={<button type="button" className={styles.primary} onClick={() => actions.open("form")} disabled={!room}><Plus size={16} aria-hidden="true" />Novo assento</button>}>
    {actions.notice && <p className={styles.notice} role="status">{actions.notice}</p>}
    <section className={styles.filmPicker} aria-label="Selecionar cinema e sala"><VenuePicker label="Cinema" value={local?.id_local} selected={local} list={locals} idKey="id_local" onChange={selectLocal} placeholder="Selecione um cinema" />{local && <VenuePicker label="Sala" value={room?.id_sala} selected={room} list={rooms} idKey="id_sala" onChange={selectRoom} placeholder="Selecione uma sala" />}</section>
    <section className={styles.panel} aria-labelledby="seats-title"><header className={styles.panelHeader}><div><h2 id="seats-title">{room ? `Assentos · ${room.nome}` : "Assentos da sala"}</h2><p>{room ? `${local.nome} · capacidade de ${room.capacidade} lugares` : "Selecione um cinema e uma sala para visualizar os assentos."}</p></div>{room && <span className={styles.count}>{seats.items.length} carregados</span>}</header>
      {room && <div className={styles.toolbar}><label className={styles.filter}>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option>Todos</option><option value="ATIVA">Ativos</option><option value="INATIVA">Inativos</option></select></label><label className={styles.filter}>Acessibilidade<select value={accessible} onChange={(event) => setAccessible(event.target.value)}><option>Todos</option><option value="true">Acessíveis</option><option value="false">Demais</option></select></label></div>}
      {!room && <p className={styles.state}>Selecione um cinema e uma sala acima para começar.</p>}
      {room && <><VenueState list={seats} empty="Nenhum assento encontrado para estes filtros." noun="assentos" />
        {seats.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de assentos; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Assentos de {room.nome}</caption><thead><tr><th scope="col">Assento</th><th scope="col">Tipo</th><th scope="col">Acessível</th><th scope="col">Status</th><th scope="col" aria-label="Ações" /></tr></thead><tbody>{seats.items.map((row) => <tr key={row.id_assento}><th scope="row">{row.fileira}{row.numero}</th><td>{typeName(row.tipo)}</td><td>{row.acessivel ? "Sim" : "Não"}</td><td><span className={`${styles.badge} ${row.status === "INATIVA" ? styles.inactive : ""}`}>{row.status === "ATIVA" ? "Ativo" : "Inativo"}</span></td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Editar assento" aria-label={`Editar assento ${row.fileira}${row.numero}`} onClick={() => actions.open("form", row)}><Pencil size={16} aria-hidden="true" /></button><button type="button" className={`${styles.iconButton} ${row.status === "ATIVA" ? styles.destructive : ""}`} title={row.status === "ATIVA" ? "Arquivar assento" : "Reativar assento"} aria-label={`${row.status === "ATIVA" ? "Arquivar" : "Reativar"} assento ${row.fileira}${row.numero}`} onClick={() => actions.open("status", row)}>{row.status === "ATIVA" ? <Archive size={16} aria-hidden="true" /> : <RotateCcw size={16} aria-hidden="true" />}</button></div></td></tr>)}</tbody></table></div>}
        <TablePagination list={seats} /></>}
    </section>
    <Dialog open={Boolean(actions.dialog)} onOpenChange={(value) => { if (!value) actions.close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{actions.dialog?.type === "status" ? `${item?.status === "ATIVA" ? "Arquivar" : "Reativar"} assento` : item ? "Editar assento" : "Novo assento"}</DialogTitle>
      {actions.dialog?.type === "form" && <><DialogDescription className={styles.dialogDescription}>Assento da sala {room?.nome}. A fileira e o número identificam o lugar.</DialogDescription><form key={item?.id_assento ?? "new"} className={styles.form} onSubmit={save}><label>Fileira<input name="fileira" required maxLength={5} pattern="[A-Za-z0-9]{1,5}" defaultValue={item?.fileira ?? ""} placeholder="A" /></label><label>Número<input name="numero" type="number" min="1" max="2147483647" required defaultValue={item?.numero ?? ""} /></label><label>Tipo<select name="tipo" defaultValue={item?.tipo ?? "COMUM"}>{seatTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label><label>Status<select name="status" defaultValue={item?.status ?? "ATIVA"}><option value="ATIVA">Ativo</option><option value="INATIVA">Inativo</option></select></label><p className={`${styles.hint} ${styles.wide}`}>A sala não pode exceder sua capacidade de assentos ativos. Desative a sala antes de arquivar assentos.</p>{actions.error && <p className={`${styles.error} ${styles.wide}`} role="alert">{actions.error}</p>}<div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="submit" className={styles.primary} disabled={actions.pending}>{actions.pending ? "Salvando…" : item ? "Salvar alterações" : "Cadastrar assento"}</button></div></form></>}
      {actions.dialog?.type === "status" && <><DialogDescription className={styles.dialogDescription}>{item?.status === "ATIVA" ? `Arquivar o assento ${item?.fileira}${item?.numero}? A sala deve estar desativada e sem sessões vinculadas.` : `Reativar o assento ${item?.fileira}${item?.numero}? A capacidade da sala não pode ser excedida.`}</DialogDescription>{actions.error && <p className={styles.error} role="alert">{actions.error}</p>}<div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="button" className={item?.status === "ATIVA" ? styles.danger : styles.primary} disabled={actions.pending} onClick={() => actions.run(() => venueRequest(`locations/${local.id_local}/rooms/${room.id_sala}/seats/${item.id_assento}`, { method: item.status === "ATIVA" ? "DELETE" : "PATCH", body: item.status === "ATIVA" ? undefined : { status: "ATIVA" } }), item?.status === "ATIVA" ? "Assento arquivado." : "Assento reativado.")}>{actions.pending ? "Aguarde…" : item?.status === "ATIVA" ? "Arquivar assento" : "Reativar assento"}</button></div></>}
    </DialogContent></Dialog>
  </VenueLayout>;
}
