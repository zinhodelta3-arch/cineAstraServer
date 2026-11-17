'use client';

import { useState } from 'react';
import { unitOperation, useUnitAction, useUnitContext, useUnitList } from '@/hooks/unit/use-unit-data';
import UnitLayout, { UnitFeedback, UnitListState, UnitMore, dateTime } from './unit-layout';
import styles from './unit.module.css';
import UnitCounter from './unit-counter';

const evidenceTypes = [
  ['CIE', 'Carteira estudantil'], ['PCD', 'Pessoa com deficiência'],
  ['ID_JOVEM', 'ID Jovem'], ['IDOSO', 'Pessoa idosa'],
];
const metrics = [['total', 'Ingressos'], ['entered', 'Já entraram'], ['inside', 'Dentro'], ['exited', 'Fora']];

async function registerPassage(path, options) {
  if (path === '/tickets/exit') return unitOperation(path, options);
  const { code, sessionId } = options.body;
  const ticket = await unitOperation('/tickets/validate', { method: 'POST', body: { code, sessionId } });
  if (!ticket.valid && !ticket.reentryAllowed) throw new Error('Este ingresso não permite entrada agora.');
  return unitOperation(ticket.reentryAllowed ? '/tickets/entry' : '/tickets/consume', options);
}

function AttendanceDesk({ sessionId, supervisor }) {
  const history = useUnitList(`/sessions/${sessionId}/attendance?limit=20`, unitOperation);
  const pending = useUnitList(`/sessions/${sessionId}/pending-orders?limit=20`, unitOperation);
  const action = useUnitAction(history.reload, registerPassage);
  const [direction, setDirection] = useState('entry');

  async function submit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const body = { sessionId, code: fields.get('code').trim() };
    const evidence = fields.get('evidence');
    if (!/^[A-Za-z0-9_-]{43}$/.test(body.code)) return action.setError('Informe o código de 43 caracteres do ingresso.');
    if (evidence) body.halfEvidenceType = evidence;
    const exit = direction === 'exit';
    const saved = await action.run(exit ? '/tickets/exit' : '/tickets/entry', { method: 'POST', body },
      exit ? 'Saída registrada.' : 'Entrada registrada.');
    if (saved) {
      form.reset();
      form.elements.namedItem('code').focus();
    }
  }

  return <>
    <section className={styles.panel} aria-labelledby="passage-title">
      <header className={styles.panelHeader}><h2 id="passage-title">Registrar passagem</h2></header>
      <div className={styles.body}>
        <form className={styles.form} onSubmit={submit} aria-busy={action.pending}>
          <label>Movimentação<select value={direction} disabled={action.pending} onChange={event => setDirection(event.target.value)}>
            <option value="entry">Entrada</option><option value="exit">Saída</option>
          </select></label>
          <label>Código do ingresso<input name="code" required maxLength={60} autoComplete="off" spellCheck={false} readOnly={action.pending} /></label>
          {direction === 'entry' && <label>Comprovante de meia conferido<select name="evidence" disabled={action.pending}>
            <option value="">Inteira ou sem comprovante</option>
            {evidenceTypes.map(([value, title]) => <option value={value} key={value}>{title}</option>)}
          </select></label>}
          <button className={styles.button} disabled={action.pending}>{action.pending ? 'Registrando…' : 'Registrar passagem'}</button>
        </form>
        <UnitFeedback error={action.error} notice={action.notice} />
      </div>
    </section>
    {!supervisor && <UnitCounter sessionId={sessionId} onSale={pending.reload} />}
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
            <div><strong>{item.type === 'ENTRADA' ? 'Entrada' : 'Saída'} · ingresso #{item.ticketId}</strong>
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
  const [sessionId, setSessionId] = useState('');
  const [date, setDate] = useState('');
  const local = context.locations[0];
  const query = new URLSearchParams({ limit: '50' });
  if (local) query.set('localId', local.id_local);
  if (date) query.set('date', date);
  const sessions = useUnitList(supervisor && local ? `/sessions?${query}` : null, unitOperation);
  const teams = useUnitList(supervisor ? null : '?limit=50');
  const source = supervisor ? sessions : teams;
  const options = supervisor
    ? sessions.items.map(item => [item.id_sessao, `${item.titulo_filme} · ${item.data?.slice(0, 10)} ${item.horario_inicio?.slice(0, 5)} · ${item.nome_sala}`])
    : teams.items.filter(item => item.status === 'ATIVA' && item.myFunction)
      .map(item => [item.id_sessao, `${item.nome} · sessão #${item.id_sessao}`]);
  const selected = options.some(([id]) => id === sessionId) ? sessionId : '';
  return <UnitLayout title="Atendimento" description="Registre entradas e saídas e consulte a presença por sessão." location={local?.nome}>
    <div className={styles.teamSections}>
      <section className={styles.panel} aria-labelledby="context-title">
        <header className={styles.panelHeader}><h2 id="context-title">Sessão em atendimento</h2></header>
        <div className={styles.body}>
          <div className={styles.form}>
            {supervisor && <label>Data<input type="date" value={date} onChange={event => { setSessionId(''); setDate(event.target.value); }} /></label>}
            <label>Sessão<select value={selected} onChange={event => setSessionId(event.target.value)} disabled={source.loading || !options.length}>
              <option value="">Selecione uma sessão</option>
              {options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select></label>
            {source.nextCursor && <button type="button" className={styles.secondary} onClick={source.loadMore} disabled={source.loadingMore}>Mais sessões</button>}
          </div>
          <UnitFeedback error={context.error || source.error} />
          {(context.loading || source.loading) && <p role="status">Carregando sessões…</p>}
          {!context.loading && !source.loading && !options.length && !source.error && !context.error && <p>Nenhuma sessão disponível.</p>}
        </div>
      </section>
      {selected && <AttendanceDesk key={selected} sessionId={selected} supervisor={supervisor} />}
    </div>
  </UnitLayout>;
}
