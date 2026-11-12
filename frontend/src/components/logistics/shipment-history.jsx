'use client';

import { usePaginatedList } from '@/hooks/use-paginated-list';
import TablePagination from '@/components/ui/table-pagination';
import styles from '@/components/admin/catalog/catalog.module.css';

const types = { ACIDENTE: 'Acidente', EXTRAVIO: 'Extravio', PERDA: 'Perda de mercadoria' };
const formatStatus = value => value.replaceAll('_', ' ').toLocaleLowerCase('pt-BR').replace(/^./, letter => letter.toUpperCase());
const formatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
function eventDate(value) {
  const text = typeof value === 'string' && /^\d{4}-\d{2}-\d{2} /.test(value) ? `${value.replace(' ', 'T')}Z` : value;
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? '—' : formatter.format(date);
}

export default function ShipmentHistory({ path, request }) {
  const history = usePaginatedList(path, request);
  if (history.loading) return <p className={styles.state} role="status">Carregando histórico…</p>;
  if (history.error) return <div className={styles.state} role="alert"><p>{history.error}</p><button type="button" className={styles.secondary} onClick={history.reload}>Tentar novamente</button></div>;
  if (!history.items.length) return <p className={styles.state}>Nenhum evento registrado para esta entrega.</p>;
  return <section aria-label="Histórico da entrega">
    <div className={styles.tableWrap} role="region" aria-label="Eventos da entrega" tabIndex={0}>
      <table className={styles.table}>
        <thead><tr><th scope="col">Evento</th><th scope="col">Estado</th><th scope="col">Data</th><th scope="col">Responsável</th></tr></thead>
        <tbody>{history.items.map(event => <tr key={event.id_evento}>
          <th scope="row">{types[event.tipo] ?? 'Mudança de estado'}{event.descricao && <p>{event.descricao}</p>}</th>
          <td>{formatStatus(event.status)}</td>
          <td>{eventDate(event.criado_em)}</td>
          <td>#{event.id_usuario}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <TablePagination list={history} noun="eventos" />
  </section>;
}
