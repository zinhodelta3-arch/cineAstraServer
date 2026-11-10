"use client";

import TablePagination from '@/components/ui/table-pagination';
import { useEffect, useRef, useState } from "react";
import { ArrowLeftRight, Gauge, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useAdminVenues } from "@/hooks/admin/use-admin-venues";
import { snackRequest, useAdminSnacks } from "@/hooks/admin/use-admin-snacks";
import SnackLayout, { SnackState } from "./snack-layout";
import styles from "../catalog/catalog.module.css";

const movementName = { ENTRADA: "Entrada", SAIDA: "Saída", AJUSTE: "Ajuste", PERDA: "Perda", DEVOLUCAO: "Devolução" };
const dateTime = (value) => value ? new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";

export default function StockAdmin() {
  const [localId, setLocalId] = useState("");
  const [dialog, setDialog] = useState(null);
  const [balance, setBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const lock = useRef(false);
  const locals = useAdminVenues("locations?limit=100");
  const inputs = useAdminSnacks(`inputs?limit=20${localId ? `&localId=${localId}` : ""}`);
  const movements = useAdminSnacks(`inventory/movements?limit=20${localId ? `&localId=${localId}` : ""}`);
  const alerts = useAdminSnacks(localId ? `inventory/alerts?limit=20&localId=${localId}` : null);
  const item = dialog?.item;

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("insumo");
    if (!/^[1-9]\d{0,9}$/.test(id ?? "")) return;
    let active = true;
    snackRequest(`inputs/${id}`).then((value) => {
      if (!active) return;
      setLocalId(value.id_local);
      setDialog({ type: "balance", item: value });
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!dialog || !item) return;
    let active = true;
    setBalance(null); setBalanceLoading(true);
    snackRequest(`inventory/inputs/${item.id_insumo}`).then((value) => { if (active) setBalance(value); }).catch((cause) => { if (active) setError(cause.message); }).finally(() => { if (active) setBalanceLoading(false); });
    return () => { active = false; };
  }, [dialog?.type, item?.id_insumo]);
  function open(type, row) { setError(""); setNotice(""); setDialog({ type, item: row }); }
  function close() { if (!lock.current) setDialog(null); }
  function save(event) {
    event.preventDefault();
    if (lock.current || !item) return;
    const form = new FormData(event.currentTarget);
    const type = String(form.get("tipo"));
    const count = Number(form.get("quantidade"));
    const reason = String(form.get("motivo") ?? "").trim();
    if (!Number.isInteger(count) || count < 1 || count > 2147483647) { setError("Informe uma quantidade inteira positiva."); return; }
    if (["AJUSTE", "PERDA", "DEVOLUCAO"].includes(type) && !reason) { setError("Informe o motivo desta movimentação."); return; }
    const sign = type === "AJUSTE" ? String(form.get("direcao")) === "SAIDA" ? -1 : 1 : ["SAIDA", "PERDA"].includes(type) ? -1 : 1;
    lock.current = true; setPending(true); setError("");
    snackRequest("inventory/movements", { method: "POST", body: { inputId: item.id_insumo, tipo: type, quantidade: count * sign, ...(reason ? { motivo: reason } : {}) } }).then(() => {
      setDialog(null); setNotice("Movimentação registrada."); inputs.reload(); movements.reload(); if (localId) alerts.reload();
    }).catch((cause) => setError(cause.message)).finally(() => { lock.current = false; setPending(false); });
  }
  const inputName = (id) => inputs.items.find((row) => row.id_insumo === id)?.nome ?? `Insumo #${id}`;
  const localName = (id) => locals.items.find((row) => row.id_local === id)?.nome ?? `Cinema #${id}`;

  return <SnackLayout title="Estoque" description="Acompanhe saldos, reposições e movimentações dos insumos.">
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    <section className={styles.filmPicker} aria-label="Filtrar estoque por cinema"><div className={styles.pickerControl}><label>Cinema<select value={localId} onChange={(event) => setLocalId(event.target.value)}><option value="">Todos os cinemas</option>{locals.items.map((local) => <option key={local.id_local} value={local.id_local}>{local.nome}</option>)}</select></label>{locals.nextCursor && <button type="button" className={styles.secondary} onClick={locals.loadMore} disabled={locals.loadingMore}>Mais cinemas</button>}</div></section>
    <section className={styles.panel} aria-labelledby="balances-title"><header className={styles.panelHeader}><div><h2 id="balances-title">Saldo dos insumos</h2><p>Consulte o saldo detalhado ou registre uma movimentação.</p></div><span className={styles.count}>{inputs.items.length} carregados</span></header>
      <SnackState list={inputs} empty="Nenhum insumo encontrado para este cinema." noun="insumos" />
      {inputs.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de estoque; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Saldo dos insumos</caption><thead><tr><th scope="col">Insumo</th><th scope="col">Cinema</th><th scope="col">Em mãos</th><th scope="col">Mínimo</th><th scope="col">Status</th><th scope="col" aria-label="Ações" /></tr></thead><tbody>{inputs.items.map((row) => <tr key={row.id_insumo}><th scope="row">{row.nome}<small className={styles.muted}> · #{row.id_insumo}</small></th><td>{localName(row.id_local)}</td><td>{row.quantidade}</td><td>{row.quantidade_minima}</td><td><span className={`${styles.badge} ${row.status !== "DISPONIVEL" ? styles.inactive : ""}`}>{row.status === "DISPONIVEL" ? "Disponível" : "Indisponível"}</span></td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Ver saldo detalhado" aria-label={`Saldo de ${row.nome}`} onClick={() => open("balance", row)}><Gauge size={16} aria-hidden="true" /></button><button type="button" className={styles.iconButton} title="Registrar movimentação" aria-label={`Movimentar ${row.nome}`} onClick={() => open("move", row)}><ArrowLeftRight size={16} aria-hidden="true" /></button></div></td></tr>)}</tbody></table></div>}
      <TablePagination list={inputs} />
    </section>
    <section className={`${styles.panel} ${styles.spacedPanel}`} aria-labelledby="alerts-title"><header className={styles.panelHeader}><div><h2 id="alerts-title">Alertas de reposição</h2><p>Itens cujo saldo disponível chegou ao mínimo.</p></div>{localId && <span className={styles.count}>{alerts.items.length} carregados</span>}</header>
      {!localId && <p className={styles.state}>Selecione um cinema para consultar os alertas.</p>}
      {localId && <><SnackState list={alerts} empty="Nenhum insumo precisa de reposição neste cinema." noun="alertas" />{alerts.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de alertas de estoque" tabIndex={0}><table className={styles.table}><caption className="sr-only">Alertas de reposição</caption><thead><tr><th scope="col">Insumo</th><th scope="col">Em mãos</th><th scope="col">Reservado</th><th scope="col">Disponível</th><th scope="col">Mínimo</th></tr></thead><tbody>{alerts.items.map((row) => <tr key={row.id_insumo}><th scope="row">{row.nome ?? inputName(row.id_insumo)}</th><td>{row.quantidade}</td><td>{row.quantidade_reservada}</td><td>{row.disponivel}</td><td>{row.quantidade_minima}</td></tr>)}</tbody></table></div>}<TablePagination list={alerts} /></>}
    </section>
    <section className={`${styles.panel} ${styles.spacedPanel}`} aria-labelledby="movements-title"><header className={styles.panelHeader}><div><h2 id="movements-title">Movimentações</h2><p>Histórico de entradas, saídas e ajustes.</p></div><span className={styles.count}>{movements.items.length} carregadas</span></header>
      <SnackState list={movements} empty="Nenhuma movimentação registrada para este filtro." noun="movimentações" />{movements.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de movimentações; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Movimentações de estoque</caption><thead><tr><th scope="col">Registro</th><th scope="col">Item</th><th scope="col">Tipo</th><th scope="col">Quantidade</th><th scope="col">Data</th><th scope="col">Motivo</th></tr></thead><tbody>{movements.items.map((row) => <tr key={row.id_movimentacao}><th scope="row">#{row.id_movimentacao}</th><td>{row.nome_item ?? (row.id_insumo ? inputName(row.id_insumo) : row.id_equipamento ? `Equipamento #${row.id_equipamento}` : "—")}</td><td>{movementName[row.tipo] ?? row.tipo}</td><td>{row.quantidade > 0 ? "+" : ""}{row.quantidade}</td><td>{dateTime(row.data_movimentacao)}</td><td className={styles.muted}>{row.motivo || "—"}</td></tr>)}</tbody></table></div>}<TablePagination list={movements} />
    </section>
    <Dialog open={Boolean(dialog)} onOpenChange={(value) => { if (!value) close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{dialog?.type === "move" ? `Movimentar · ${item?.nome}` : `Saldo · ${item?.nome}`}</DialogTitle><DialogDescription className={styles.dialogDescription}>{localName(item?.id_local)} · Insumo #{item?.id_insumo}</DialogDescription>
      {balanceLoading && <p role="status">Carregando saldo…</p>}
      {balance && <div className={`${styles.summaryGrid} ${styles.stockSummary}`}><div><span>Em mãos</span><strong>{balance.quantidade}</strong></div><div><span>Reservado</span><strong>{balance.quantidade_reservada}</strong></div><div><span>Disponível</span><strong>{balance.disponivel}</strong></div></div>}
      {dialog?.type === "move" && <form className={styles.form} onSubmit={save}><label>Tipo<select name="tipo" defaultValue="ENTRADA"><option value="ENTRADA">Entrada</option><option value="SAIDA">Saída</option><option value="AJUSTE">Ajuste</option><option value="PERDA">Perda</option><option value="DEVOLUCAO">Devolução</option></select></label><label>Quantidade<input name="quantidade" type="number" min="1" max="2147483647" required /></label><label>Direção do ajuste<select name="direcao" defaultValue="ENTRADA"><option value="ENTRADA">Aumentar</option><option value="SAIDA">Reduzir</option></select></label><label className={styles.wide}>Motivo<input name="motivo" maxLength={255} placeholder="Obrigatório para ajustes, perdas e devoluções" /></label>{error && <p className={`${styles.error} ${styles.wide}`} role="alert">{error}</p>}<div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={close}>Cancelar</button><button type="submit" className={styles.primary} disabled={pending}><Plus size={16} aria-hidden="true" />{pending ? "Registrando…" : "Registrar movimentação"}</button></div></form>}
      {dialog?.type === "balance" && <>{error && <p className={styles.error} role="alert">{error}</p>}<div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={close}>Fechar</button><button type="button" className={styles.primary} onClick={() => open("move", item)} disabled={balanceLoading}>Movimentar estoque</button></div></>}
    </DialogContent></Dialog>
  </SnackLayout>;
}
