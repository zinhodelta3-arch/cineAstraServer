"use client";

import { ArrowLeft, Check, Clock3, Inbox, RefreshCw, Search, Send, Ticket } from "lucide-react";
import { useAdminSupport } from "@/hooks/admin/use-admin-support";
import styles from "./admin-support.module.css";
import TablePagination from '@/components/ui/table-pagination';

const statusLabels = { ABERTO: "Aberto", EM_ATENDIMENTO: "Em atendimento", RESOLVIDO: "Resolvido", FECHADO: "Fechado" };

function stamp(value) {
  if (!value) return null;
  const date = new Date(/[Zz]|[+-]\d{2}:?\d{2}$/.test(value) ? value : `${value.replace(" ", "T")}Z`);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
}

function TicketList({ support }) {
  return <section className={styles.queue} aria-labelledby="queue-title">
    <header className={styles.queueHeader}>
      <div><h2 id="queue-title">Tickets de suporte</h2><p>{support.queue.items.length} chamados carregados</p></div>
      <span className={styles.queueCount} aria-hidden="true">{support.queue.items.length}</span>
    </header>
    <div className={styles.filters}>
      <label className={styles.search}><Search size={16} aria-hidden="true" /><span className="sr-only">Buscar chamado</span><input type="search" value={support.query} onChange={(event) => support.setQuery(event.target.value)} placeholder="Buscar chamado" /></label>
      <label className={styles.statusFilter}><span className="sr-only">Filtrar status</span><select value={support.status} onChange={(event) => support.setStatus(event.target.value)}><option value="Todos">Todos</option><option value="ABERTO">Abertos</option><option value="EM_ATENDIMENTO">Em atendimento</option><option value="RESOLVIDO">Resolvidos</option><option value="FECHADO">Fechados</option></select></label>
    </div>
    <div className={styles.queueBody}>
      {support.queue.loading && !support.queue.items.length && <p className={styles.listState} role="status">Carregando chamados…</p>}
      {support.queue.error && <div className={styles.listState} role="alert"><p>{support.queue.error}</p><button type="button" onClick={support.refresh}>Tentar novamente</button></div>}
      {!support.queue.loading && !support.queue.error && !support.queue.items.length && <div className={styles.listState}><Inbox size={22} aria-hidden="true" /><p>Nenhum chamado em aberto.</p></div>}
      {support.queue.items.length > 0 && !support.visibleTickets.length && <p className={styles.listState}>Nenhum chamado corresponde aos filtros.</p>}
      <ul className={styles.ticketList}>{support.visibleTickets.map((ticket) => <li key={ticket.id}>
        <button type="button" className={styles.ticketRow} aria-pressed={support.selectedId === ticket.id} onClick={() => support.select(ticket.id)} disabled={support.pending}>
          <span className={styles.ticketTop}><span className={styles.ticketNumber}>#{ticket.id}</span><time>{stamp(ticket.lastInteractionAt ?? ticket.openedAt)}</time></span>
          <strong>{ticket.subject}</strong>
          <span className={styles.ticketBottom}><span>Cliente #{ticket.clientId}</span><span className={`${styles.status} ${ticket.status === "EM_ATENDIMENTO" ? styles.inProgress : ""}`}>{statusLabels[ticket.status] ?? ticket.status}</span></span>
        </button>
      </li>)}</ul>
      <TablePagination list={support.queue} noun="chamados" />
    </div>
  </section>;
}

function Conversation({ support }) {
  const ticket = support.thread.id === support.selectedId ? support.thread.ticket : null;
  const mine = ticket?.attendantId === support.session.user?.id;
  const assignedOther = Boolean(ticket?.attendantId && !mine);
  const canRespond = Boolean(mine && ticket && !["RESOLVIDO", "FECHADO"].includes(ticket.status));
  const lastAdmin = support.thread.messages.filter((item) => item.role === "ADMIN").at(-1);
  const lastClient = support.thread.messages.filter((item) => item.role === "CLIENTE").at(-1);
  const canResolve = Boolean(canRespond && !support.thread.nextCursor && lastAdmin && (!lastClient || BigInt(lastAdmin.id) > BigInt(lastClient.id)));

  if (!support.selectedId) return <section className={`${styles.conversation} ${styles.conversationEmpty}`} aria-label="Conversa do chamado"><Ticket size={28} aria-hidden="true" /><h2>Selecione um chamado</h2><p>Escolha um ticket na lista para consultar a conversa e responder ao cliente.</p></section>;

  return <section className={styles.conversation} aria-labelledby="conversation-title">
    <button type="button" className={styles.back} onClick={() => support.select(null)}><ArrowLeft size={16} aria-hidden="true" />Voltar aos chamados</button>
    <header className={styles.conversationHeader}>
      <div className={styles.conversationTitle}>
        <span className={styles.ticketNumber}>CHAMADO #{support.selectedId}</span>
        <h2 id="conversation-title">{ticket?.subject ?? "Conversa do chamado"}</h2>
        {ticket && <p>Cliente #{ticket.clientId} · Aberto em {stamp(ticket.openedAt) ?? "data indisponível"}</p>}
      </div>
      <button type="button" className={styles.refresh} onClick={support.refresh} disabled={support.thread.loading || support.pending} aria-label="Atualizar conversa" title="Atualizar conversa"><RefreshCw size={17} aria-hidden="true" /></button>
    </header>
    {support.thread.loading && <p className={styles.threadState} role="status">Atualizando conversa…</p>}
    {support.thread.error && <div className={styles.threadState} role="alert"><p>{support.thread.error}</p><button type="button" onClick={support.refresh}>Tentar novamente</button></div>}
    {ticket && <>
      <div className={styles.ticketMeta}>
        <span className={`${styles.status} ${ticket.status === "EM_ATENDIMENTO" ? styles.inProgress : ""}`}>{statusLabels[ticket.status] ?? ticket.status}</span>
        {ticket.responseOverdue && <span className={styles.overdue}><Clock3 size={14} aria-hidden="true" />Prazo de resposta ultrapassado</span>}
        {assignedOther && <span className={styles.attendant}>Atribuído a outro atendente</span>}
        {mine && <span className={styles.attendant}>Em atendimento por você</span>}
        {!ticket.attendantId && <button type="button" className={styles.assign} onClick={support.assign} disabled={support.pending || support.session.loading || !support.session.user}>Assumir chamado</button>}
        {mine && !canResolve && <span className={styles.resolveHint}>{support.thread.nextCursor ? "Carregue o histórico antes de resolver." : "Responda ao cliente antes de resolver."}</span>}
        {mine && <button type="button" className={styles.resolve} onClick={support.resolve} disabled={support.pending || !canResolve}><Check size={16} aria-hidden="true" />Resolver</button>}
      </div>
      <ol className={styles.messages} aria-label="Histórico da conversa">
        {support.thread.messages.map((item) => <li key={item.id} className={`${styles.message} ${item.role === "ADMIN" ? styles.adminMessage : ""}`}>
          <div className={styles.bubble}><span>{item.role === "ADMIN" ? "Atendimento" : item.role === "CLIENTE" ? "Cliente" : "Sistema"}</span><p>{item.message}</p><time>{stamp(item.createdAt)}</time></div>
        </li>)}
        {!support.thread.messages.length && !support.thread.loading && <li className={styles.noMessages}>Nenhuma mensagem disponível neste chamado.</li>}
      </ol>
      {support.thread.nextCursor && <button type="button" className={styles.moreMessages} onClick={support.loadMoreMessages} disabled={support.thread.loadingMore}>{support.thread.loadingMore ? "Carregando…" : "Carregar próximas mensagens"}</button>}
      <form className={styles.composer} onSubmit={support.send}>
        <label htmlFor="admin-support-reply">Sua resposta</label>
        <textarea id="admin-support-reply" value={support.draft} onChange={(event) => support.setDraft(event.target.value)} placeholder={assignedOther ? "Este chamado está com outro atendente." : ticket.attendantId ? "Escreva sua resposta…" : "Assuma o chamado para responder."} maxLength={10000} rows={3} disabled={!canRespond || support.pending} required />
        <div className={styles.composerFooter}><span>{!ticket.attendantId ? "Assuma o chamado para responder." : assignedOther ? "Somente o atendente responsável pode responder." : "Não inclua senhas ou dados completos de pagamento."}</span><button type="submit" className={styles.send} disabled={!canRespond || support.pending || !support.draft.trim()}><Send size={16} aria-hidden="true" />Enviar resposta</button></div>
      </form>
    </>}
  </section>;
}

export default function AdminSupport() {
  const support = useAdminSupport();
  return <main id="admin-content" tabIndex={-1} className={styles.page}>
    <header className={styles.heading}><div><h1>Suporte</h1><p>Acompanhe os chamados e responda às solicitações dos clientes.</p></div><button type="button" className={styles.refreshAll} onClick={support.refresh} disabled={support.queue.loading || support.pending}><RefreshCw size={16} aria-hidden="true" />Atualizar fila</button></header>
    {support.notice && <p className={styles.notice} role="status">{support.notice}</p>}
    {support.error && <p className={styles.error} role="alert">{support.error}</p>}
    <div className={`${styles.workspace} ${support.selectedId ? styles.hasSelection : ""}`}><TicketList support={support} /><Conversation support={support} /></div>
  </main>;
}
