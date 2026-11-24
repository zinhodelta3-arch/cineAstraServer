'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAdminSupply } from '@/hooks/admin/use-admin-supply';
import { maskCnpj } from '@/lib/br-fields.mjs';
import styles from '../catalog/catalog.module.css';

export default function CompanyPicker({ current, required = true }) {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [selection, setSelection] = useState(current?.id_empresa ? current : null);
  const list = useAdminSupply(`companies?limit=20${search ? `&q=${encodeURIComponent(search)}` : ''}`);
  const options = selection && !list.items.some(item => item.id_empresa === selection.id_empresa)
    ? [selection, ...list.items] : list.items;

  return <div className={`${styles.wide} ${styles.requestPicker}`}>
    <div className={styles.toolbar}>
      <label className={styles.filter}>Buscar empresa<input type="search" maxLength={150} value={query} placeholder="Razão social ou CNPJ" onChange={event => setQuery(event.target.value)} onKeyDown={event => {
        if (event.key === 'Enter') { event.preventDefault(); setSearch(query.trim()); }
      }} /></label>
      <button type="button" className={styles.secondary} onClick={() => setSearch(query.trim())}>Buscar</button>
    </div>
    <label>Empresa fornecedora<select name="companyId" required={required} value={selection?.id_empresa ?? ''} onChange={event => setSelection(options.find(item => item.id_empresa === event.target.value) ?? null)}>
      <option value="">Selecione uma empresa</option>
      {options.map(item => <option key={item.id_empresa} value={item.id_empresa}>{item.razao_social} · {maskCnpj(item.cnpj)}</option>)}
    </select></label>
    {list.loading && <p className={styles.hint} role="status">Buscando empresas…</p>}
    {list.error && <div role="alert"><p className={styles.error}>{list.error}</p><button type="button" className={styles.secondary} onClick={list.reload}>Tentar novamente</button></div>}
    {list.nextCursor && <button type="button" className={styles.secondary} onClick={list.loadMore} disabled={list.loadingMore}>Mais empresas</button>}
    <Link className={styles.hint} href="/admin/suprimentos/empresas">Abrir cadastro de empresas</Link>
  </div>;
}
