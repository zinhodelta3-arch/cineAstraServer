'use client';

import { useId, useState } from 'react';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import TablePagination from '@/components/ui/table-pagination';
import styles from './session-context.module.css';

const date = value => value ? new Intl.DateTimeFormat('pt-BR', { dateStyle:'short', timeStyle:'short' }).format(new Date(value)) : '—';
const currency = new Intl.NumberFormat('pt-BR', { style:'currency', currency:'BRL' });
const money = value => value == null ? '—' : currency.format(value);
const number = value => value ? `#${value}` : '—';
const formatLabel = value => value ? value.toLocaleLowerCase('pt-BR').replaceAll('_',' ').replace(/^./, letter => letter.toUpperCase()) : '—';
const buyer = item => item.buyerName ?? (item.channel === 'BALCAO' ? 'Balcão sem nome registrado' : 'Comprador sem identificação');
const channel = { SITE:'Site', BALCAO:'Balcão', APP:'Balcão com pagamento pelo site' };
const presence = { PRESENTE:'Dentro da sala', SAIU:'Saiu da sala', AUSENTE:'Ausente', AGUARDANDO:'Aguardando entrada', SEM_REGISTRO:'Sem registro' };
const eventName = {
  'SESSION.CREATED':'Sessão agendada',
  'SESSION.CHANGED':'Programação atualizada',
  'SESSION.INTERRUPTED':'Sessão interrompida',
  'SESSION.CANCELLED':'Sessão cancelada',
  'SESSION.ARCHIVED':'Sessão arquivada',
};
const sourceName = { SUPERVISAO:'Supervisão', EQUIPE:'Equipe', BALCAO:'Balcão', PORTARIA:'Portaria', PROGRAMACAO:'Programação', CLIENTE:'Comprador' };
const definitions = {
  orders: { title:'Pedidos', key:'orderId', columns:[
    ['Pedido', item => number(item.orderId)], ['Comprador', buyer], ['Situação', item => formatLabel(item.status)],
    ['Canal', item => channel[item.channel]], ['Data do pedido', item => date(item.placedAt)],
    ['Reserva até', item => item.status === 'AGUARDANDO_PAGAMENTO' ? date(item.expiresAt) : '—'],
  ] },
  staff: { title:'Pessoas vinculadas', key:'personId', columns:[
    ['Pessoa', item => item.name], ['Conta', item => number(item.personId)], ['Perfil', item => formatLabel(item.role)],
    ['Vínculo com a sessão', item => item.sources.map(source => sourceName[source]).join(' · ')],
  ] },
  payments: { title:'Pagamentos', key:'paymentId', columns:[
    ['Pagamento', item => number(item.paymentId)], ['Pedido', item => number(item.orderId)], ['Situação', item => formatLabel(item.status)],
    ['Meio', item => item.method ?? '—'], ['Valor', item => money(item.amount)], ['Pago em', item => date(item.paidAt)],
  ] },
  refunds: { title:'Reembolsos', key:'refundId', columns:[
    ['Reembolso', item => number(item.refundId)], ['Pedido', item => number(item.orderId)], ['Pagamento', item => number(item.paymentId)],
    ['Situação', item => formatLabel(item.status)], ['Solicitado', item => money(item.requestedAmount)],
    ['Confirmado', item => money(item.confirmedAmount)], ['Data da solicitação', item => date(item.requestedAt)],
  ] },
  audit: { title:'Alterações da programação', key:'eventId', columns:[
    ['Alteração', item => eventName[item.type] ?? item.type], ['Horário', item => date(item.at)],
    ['Responsável', item => item.actorName ?? (item.actorId ? number(item.actorId) : 'Sistema')],
  ] },
};

function RecordTable({ list, columns, rowKey, title, empty }) {
  if (list.loading) return <p role="status">Carregando…</p>;
  if (list.error && !list.items.length) return <p role="alert">{list.error} <button type="button" className={styles.textButton} onClick={list.reload}>Tentar novamente</button></p>;
  if (!list.items.length) return <p>{empty}</p>;
  return <>
    <div className={styles.tableWrap} role="region" aria-label={title} tabIndex={0}>
      <table className={styles.table}>
        <thead><tr>{columns.map(([name]) => <th key={name} scope="col">{name}</th>)}</tr></thead>
        <tbody>{list.items.map(item => <tr key={item[rowKey]}>
          {columns.map(([name, render], index) => index === 0 ? <th key={name} scope="row">{render(item)}</th> : <td key={name}>{render(item)}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
    <TablePagination list={list} />
  </>;
}

export function SessionTickets({ sessionId, request, prefix = '', forPresence = false, refreshKey = 0 }) {
  const filterId = useId();
  const [filter, setFilter] = useState('');
  const list = usePaginatedList(`${prefix}sessions/${sessionId}/tickets?limit=20${filter ? `&presence=${filter}` : ''}`,request,{ refreshKey });
  const columns = [
    ['Assento', item => item.seat ?? (item.type === 'RETIRADA_INSUMO' ? 'Retirada AstraSnack' : '—')],
    ['Presença', item => presence[item.attendanceStatus] ?? '—'], ['Comprador', buyer],
    ['Ingresso / ticket', item => number(item.id)], ['Pedido', item => number(item.orderId)],
    ['Situação do ticket', item => formatLabel(item.status)],
    ['Item do pedido', item => number(item.itemId)], ['Unidade do item', item => item.unit],
    ['Utilizado em', item => date(item.usedAt)], ['Válido até', item => date(item.expiresAt)],
  ];
  return <section className={styles.panel} aria-label="Participantes e ingressos">
    <div className={styles.panelHeader}>
      <h2>{forPresence ? 'Presença por assento' : 'Participantes e ingressos'}</h2>
      <div className={styles.field}><label htmlFor={filterId}>Presença</label><select id={filterId} value={filter} onChange={event => setFilter(event.target.value)}>
        <option value="">Todos os tickets</option>
        {Object.entries(presence).map(([value,title]) => <option value={value} key={value}>{title}</option>)}
      </select></div>
    </div>
    <div className={styles.panelBody}>
      <RecordTable list={list} columns={columns} rowKey="id" title="Tickets por assento"
        empty={filter ? 'Nenhum ingresso com essa situação de presença.' : 'Ainda não há tickets nesta sessão.'} />
    </div>
  </section>;
}

export function SessionRecords({ sessionId, request, prefix = '', admin = false }) {
  const sectionId = useId();
  const [section, setSection] = useState('orders');
  const { title, key, columns } = definitions[section];
  const list = usePaginatedList(`${prefix}sessions/${sessionId}/details/${section}?limit=20`,request);
  return <section className={styles.panel} aria-label="Registros da sessão">
    <div className={styles.panelHeader}>
      <h2>{title}</h2>
      {admin && <div className={styles.field}><label htmlFor={sectionId}>Consultar</label><select id={sectionId} value={section} onChange={event => setSection(event.target.value)}>
        {Object.entries(definitions).map(([value,definition]) => <option value={value} key={value}>{definition.title}</option>)}
      </select></div>}
    </div>
    <div className={styles.panelBody}>
      <RecordTable list={list} rowKey={key} title={title} empty="Nenhum registro nesta seção para a sessão."
        columns={admin && section === 'orders' ? [...columns,['Total do pedido', item => money(item.total)]] : columns} />
    </div>
  </section>;
}
