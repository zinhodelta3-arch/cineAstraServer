'use client';

import { useId, useState } from 'react';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { unitOperation } from '@/hooks/unit/use-unit-data';
import { UnitFeedback, UnitListState } from './unit-layout';
import styles from './unit.module.css';

export default function AttendanceCustomerLookup({ path, selected, onSelect, disabled, forTicket = false }) {
  const heading = useId();
  const [query, setQuery] = useState('');
  const target = query ? `${path}?${new URLSearchParams({ q: query, limit: '12' })}` : null;
  const results = usePaginatedList(target, unitOperation);

  function search(event) {
    event.preventDefault();
    const term = String(new FormData(event.currentTarget).get('customer')).trim();
    if (term.length < 3) return;
    onSelect(null);
    if (term === query) results.reload();
    else setQuery(term);
  }

  return <section className={styles.customerLookup} aria-labelledby={heading}>
    <h3 id={heading}>{forTicket ? 'Localizar ingresso' : 'Vincular cliente'}</h3>
    <form className={styles.form} onSubmit={search}>
      <label>Nome ou e-mail completo<input name="customer" type="search" minLength={3} maxLength={254}
        required disabled={disabled} autoComplete="off" /></label>
      <button className={styles.secondary} disabled={disabled || results.loading}>Buscar</button>
    </form>
    {query && <UnitListState list={results} empty={forTicket ? 'Nenhum ingresso encontrado nesta sessão.' : 'Nenhum cliente encontrado.'} />}
    {results.items.length > 0 && <ul className={styles.list}>
      {results.items.map(item => <li key={item.id}>
        <div>
          <strong>{item.name}</strong>
          <small>{item.emailHint && `${item.emailHint} · `}{forTicket ? `Assento ${item.seat ?? 'sem identificação'} · Ingresso #${item.id}` : `Cliente #${item.id}`}</small>
        </div>
        <button type="button" className={styles.secondary} aria-pressed={selected?.id === item.id} disabled={disabled}
          aria-label={`Selecionar ${item.name}, ${forTicket ? 'ingresso' : 'cliente'} ${item.id}`}
          onClick={() => onSelect(item)}>{selected?.id === item.id ? 'Selecionado' : 'Selecionar'}</button>
      </li>)}
    </ul>}
    {results.items.length > 0 && <UnitFeedback error={results.error} />}
    {results.hasNext && <button type="button" className={styles.secondary} disabled={disabled || results.loadingMore} onClick={results.loadMore}>
      {results.loadingMore ? 'Buscando…' : results.error ? 'Tentar novamente' : 'Ver mais resultados'}
    </button>}
    {selected && <div className={styles.row}>
      <span className={styles.badge}>{selected.name}{forTicket && selected.seat ? ` · ${selected.seat}` : ''}</span>
      <button type="button" className={styles.secondary} disabled={disabled} onClick={() => onSelect(null)}>Limpar seleção</button>
    </div>}
  </section>;
}
