'use client';

import { useState } from 'react';
import { unitOperation, useUnitAction, useUnitContext, useUnitList } from '@/hooks/unit/use-unit-data';
import UnitLayout, { UnitFeedback, UnitListState, UnitMore, dateTime } from './unit-layout';
import styles from './unit.module.css';
import UnitCounter from './unit-counter';
import AttendanceCustomerLookup from './attendance-customer-lookup';
import SessionContext, { useSessionContext } from '@/components/session-context/session-context';
import { SessionRecords, SessionTickets } from '@/components/session-context/session-records';

const evidenceTypes = [
  ['CIE', 'Carteira estudantil'], ['PCD', 'Pessoa com deficiência'],
  ['ID_JOVEM', 'ID Jovem'], ['IDOSO', 'Pessoa idosa'],
];
const metrics = [['total', 'Ingressos'], ['entered', 'Já entraram'], ['inside', 'Dentro'], ['exited', 'Saíram'], ['absent', 'Ausentes']];

async function registerPassage(path, options) {
  if (path === '/tickets/exit' || path.endsWith('/attendance/passages')) return unitOperation(path, options);
  const { code, sessionId } = options.body;
  const ticket = await unitOperation('/tickets/validate', { method: 'POST', body: { code, sessionId } });
  if (!ticket.valid && !ticket.reentryAllowed) throw new Error('Este ingresso não permite entrada agora.');
  return unitOperation(ticket.reentryAllowed ? '/tickets/entry' : '/tickets/consume', options);
}

function AttendanceDesk({ sessionId, supervisor }) {
  const history = useUnitList(`/sessions/${sessionId}/attendance?limit=20`, unitOperation);
  const pending = useUnitList(`/sessions/${sessionId}/pending-orders?limit=20`, unitOperation);
  const [ticketRevision, setTicketRevision] = useState(0);
  const action = useUnitAction(() => { history.reload(); setTicketRevision(value => value + 1); }, registerPassage);
  const [direction, setDirection] = useState('entry');
  const [method, setMethod] = useState('code');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const byName = supervisor && method === 'customer';
  const exit = direction === 'exit';

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const evidence = fields.get('evidence');
    if (byName && !selectedTicket) return action.setError('Selecione o ingresso do cliente.');
    const code = String(fields.get('code') ?? '').trim();
    if (!byName && !/^[A-Za-z0-9_-]{43}$/.test(code)) return action.setError('Informe o código de 43 caracteres do ingresso.');
    const body = byName
      ? { ticketId: selectedTicket.id, direction: exit ? 'SAIDA' : 'ENTRADA' }
      : { sessionId, code };
    if (!exit && evidence) body.halfEvidenceType = evidence;
    const path = byName ? `/sessions/${sessionId}/attendance/passages` : exit ? '/tickets/exit' : '/tickets/entry';
    const saved = await action.run(path, { method: 'POST', body },
      exit ? 'Saída registrada.' : 'Entrada registrada.');
    if (saved) {
      form.reset();
      setSelectedTicket(null);
      form.elements.namedItem('code')?.focus();
    }
  }

  return <>
    <section className={styles.panel} aria-labelledby="passage-title">
      <header className={styles.panelHeader}><h2 id="passage-title">Registrar passagem</h2></header>
      <div className={styles.body}>
        {supervisor && <div className={styles.form}>
          <label>Identificar ingresso por<select value={method} disabled={action.pending} onChange={event => { setMethod(event.target.value); setSelectedTicket(null); action.setError(''); }}>
            <option value="code">Código do ingresso</option><option value="customer">Nome do cliente</option>
          </select></label>
        </div>}
        {byName && <AttendanceCustomerLookup path={`/sessions/${sessionId}/attendance/tickets`}
          selected={selectedTicket} onSelect={setSelectedTicket} disabled={action.pending} forTicket />}
        <form className={styles.form} onSubmit={submit} aria-busy={action.pending}>
          <label>Movimentação<select value={direction} disabled={action.pending} onChange={event => setDirection(event.target.value)}>
            <option value="entry">Entrada</option><option value="exit">Saída</option>
          </select></label>
          {!byName && <label>Código do ingresso<input name="code" required maxLength={60} autoComplete="off" spellCheck={false} readOnly={action.pending} /></label>}
          {!exit && (!byName || selectedTicket?.halfEvidenceRequired) && <label>Comprovante de meia conferido<select name="evidence" disabled={action.pending}>
            <option value="">Inteira ou sem comprovante</option>
            {evidenceTypes.map(([value, title]) => <option value={value} key={value}>{title}</option>)}
          </select></label>}
          <button className={styles.button} disabled={action.pending || (byName && !selectedTicket)}>{action.pending ? 'Registrando…' : 'Registrar passagem'}</button>
        </form>
        <UnitFeedback error={action.error} notice={action.notice} />
      </div>
    </section>
    {!supervisor && <UnitCounter sessionId={sessionId} onSale={() => { pending.reload(); setTicketRevision(value => value + 1); }} />}
    <SessionTickets sessionId={sessionId} request={unitOperation} prefix="/" forPresence refreshKey={ticketRevision} />
    <section className={styles.panel} aria-labelledby="attendance-title">
      <header className={styles.panelHeader}><h2 id="attendance-title">Presença na sessão</h2>
        <button type="button" className={styles.secondary} onClick={history.reload} disabled={history.loading || action.pending}>Atualizar presença</button>
      </header>
      <div className={styles.body}>
        {history.data?.summary && <dl className={styles.row}>
          {metrics.map(([key, title]) => <div key={key} className={styles.badge}><dt>{title}</dt><dd className="ml-2">{history.data.summary[key]}</dd></div>)}
        </dl>}
        <UnitListState list={history} empty="Nenhuma passagem registrada nesta sessão." />
        {history.items.length > 0 && <ul className={styles.list}>
          {history.items.map(item => <li key={item.id}>
            <div><strong>{item.type === 'ENTRADA' ? 'Entrada' : 'Saída'} · {item.customerName || `ingresso #${item.ticketId}`}</strong>
              <small>{dateTime(item.at)}{item.staffId && ` · Operador #${item.staffId}`}</small></div>
          </li>)}
        </ul>}
        <UnitMore list={history} noun="passagens" />
      </div>
    </section>
    <section className={styles.panel} aria-labelledby="payments-title">
      <header className={styles.panelHeader}><h2 id="payments-title">Pedidos aguardando pagamento</h2>
        <button type="button" className={styles.secondary} onClick={pending.reload} disabled={pending.loading}>Atualizar pedidos</button>
      </header>
      <div className={styles.body}>
        <UnitListState list={pending} empty="Nenhum pedido com pagamento pendente nesta sessão." />
        {pending.items.length > 0 && <ul className={styles.list}>
          {pending.items.map(item => <li key={item.orderId}><div>
            <strong>Pedido #{item.orderId}</strong><small>Reserva até {dateTime(item.expiresAt)}</small>
          </div></li>)}
        </ul>}
        <UnitMore list={pending} noun="pedidos" />
      </div>
    </section>
  </>;
}

export default function UnitAttendance({ supervisor }) {
  const context = useUnitContext();
  const selection = useSessionContext(unitOperation, '/');
  const selected = selection.session;
  const [date, setDate] = useState('');
  const [choosing, setChoosing] = useState(false);
  const showPicker = choosing || !selection.selectedId;
  const local = context.locations.find(item => item.id_local === selection.localId) ?? context.locations[0];
  const query = new URLSearchParams({ limit: '50' });
  if (local) query.set('localId', local.id_local);
  if (date) query.set('date', date);
  const sessions = useUnitList(showPicker && supervisor && local ? `/sessions?${query}` : null, unitOperation);
  const teams = useUnitList(showPicker && !supervisor ? '?limit=50' : null);
  const source = supervisor ? sessions : teams;
  const rows = supervisor ? sessions.items : teams.items.filter(item => item.status === 'ATIVA' && item.myFunction);
  const options = [...new Map(rows.map(item => [item.id_sessao,item])).values()];
  const tickets = selection.view === 'tickets';
  return <UnitLayout title={tickets ? 'Ingressos da unidade' : 'Atendimento'}
    description={tickets ? 'Consulte participantes e pedidos vinculados à sessão.' : 'Registre entradas e saídas e consulte a presença por sessão.'} location={local?.nome}>
    <SessionContext selection={selection} area="unit" active={selection.view} />
    <div className={styles.teamSections}>
      {showPicker ? <section className={styles.panel} aria-labelledby="context-title">
        <header className={styles.panelHeader}><h2 id="context-title">Sessão em atendimento</h2></header>
        <div className={styles.body}>
          <div className={styles.form}>
            {supervisor && <label>Data<input type="date" value={date} onChange={event => setDate(event.target.value)} /></label>}
            <label>Sessão<select value={selected?.id_sessao ?? ''} onChange={event => {
              const item = options.find(row => row.id_sessao === event.target.value);
              selection.choose(item && { ...item, id_local:item.id_local ?? item.location?.id });
              if (item) setChoosing(false);
            }}
              disabled={source.loading || !options.length && !selected}>
              <option value="">Selecione uma sessão</option>
              {selected && !options.some(item => item.id_sessao === selected.id_sessao) && <option value={selected.id_sessao}>{selected.titulo_filme}</option>}
              {options.map(item => <option key={item.id_sessao} value={item.id_sessao}>{supervisor
                ? `${item.titulo_filme} · ${item.data?.slice(0, 10)} ${item.horario_inicio?.slice(0, 5)} · ${item.nome_sala}`
                : `${item.nome} · sessão #${item.id_sessao}`}</option>)}
            </select></label>
            {source.nextCursor && <button type="button" className={styles.secondary} onClick={source.loadMore} disabled={source.loadingMore}>Mais sessões</button>}
          </div>
          <UnitFeedback error={context.error || source.error} />
          {(context.loading || source.loading) && <p role="status">Carregando sessões…</p>}
          {!context.loading && !source.loading && !options.length && !source.error && !context.error && <p className="mt-3 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">Nenhuma sessão disponível.</p>}
        </div>
      </section> : <div><button type="button" className={styles.secondary} onClick={() => setChoosing(true)}>Trocar sessão</button></div>}
      {selected && (tickets ? <>
        <SessionTickets key={selected.id_sessao} sessionId={selected.id_sessao} request={unitOperation} prefix="/" />
        <SessionRecords key={`orders-${selected.id_sessao}`} sessionId={selected.id_sessao} request={unitOperation} prefix="/" />
      </> : <AttendanceDesk key={selected.id_sessao} sessionId={selected.id_sessao} supervisor={supervisor} />)}
    </div>
  </UnitLayout>;
}
