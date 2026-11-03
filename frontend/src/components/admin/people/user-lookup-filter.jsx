'use client';

import { useDeferredValue, useState } from 'react';
import { useAdminPeople } from '@/hooks/admin/use-admin-people';
import styles from '../catalog/catalog.module.css';

export default function UserLookupFilter({ label = 'Usuário', role, value, onChange, allowHistoricalId = false }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const search = useDeferredValue(query.trim());
  const exactId = /^[1-9]\d{0,19}$/.test(search) && BigInt(search) <= (allowHistoricalId ? 18446744073709551615n : 4294967295n) ? search : null;
  const params = new URLSearchParams({ limit: '50' });
  if (role) params.set('role', role);
  if (exactId && BigInt(exactId) <= 4294967295n) params.set('userId', exactId);
  else if (search) params.set('q', search);
  const users = useAdminPeople(`users?${params}`);
  const current = users.items.find(user => user.id === value) ?? (selected?.id === value ? selected : null);

  function choose(id) {
    setSelected(users.items.find(user => user.id === id) ?? null);
    onChange(id);
  }

  return <div className={styles.lookupFilter}>
    <label className={styles.filter}>Buscar {label.toLocaleLowerCase('pt-BR')}<input type="search" value={query} onChange={event => setQuery(event.target.value)} maxLength={150} placeholder="Nome, e-mail ou ID" /></label>
    <label className={styles.filter}>{label}<select value={value} onChange={event => choose(event.target.value)}>
      <option value="">Todos</option>
      {value && !users.items.some(user => user.id === value) && <option value={value}>{current ? `${current.name} · #${value}` : `${label} #${value}`}</option>}
      {exactId && exactId !== value && !users.items.some(user => user.id === exactId) && <option value={exactId}>ID #{exactId}</option>}
      {users.items.map(user => <option key={user.id} value={user.id}>{user.name} · {user.email} · #{user.id}</option>)}
    </select></label>
    {users.loading && <span className={styles.hint} role="status">Carregando…</span>}
    {users.error && <button type="button" className={styles.lookupMore} onClick={users.reload} title={users.error}>Tentar novamente</button>}
    {users.nextCursor && <button type="button" className={styles.lookupMore} onClick={users.loadMore} disabled={users.loadingMore}>{users.loadingMore ? 'Carregando…' : 'Mais usuários'}</button>}
  </div>;
}
