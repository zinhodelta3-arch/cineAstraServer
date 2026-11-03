'use client';

import { useEffect, useState } from 'react';
import { supplierRequest, useSupplierLocations } from '@/hooks/supplier/use-supplier-data';
import SupplierLayout, { More, SupplierState, statusName } from './supplier-layout';
import styles from '@/components/admin/catalog/catalog.module.css';

export default function SupplierProfile() {
  const [profile, setProfile] = useState({ data: null, loading: true, error: '' });
  const locations = useSupplierLocations();
  function reload() {
    setProfile(value => ({ ...value, loading: true, error: '' }));
    supplierRequest('me').then(data => setProfile({ data, loading: false, error: '' })).catch(error => setProfile({ data: null, loading: false, error: error.message }));
  }
  useEffect(() => {
    const abort = new AbortController();
    supplierRequest('me', { signal: abort.signal }).then(data => { if (!abort.signal.aborted) setProfile({ data, loading: false, error: '' }); }).catch(error => { if (!abort.signal.aborted) setProfile({ data: null, loading: false, error: error.message }); });
    return () => abort.abort();
  }, []);
  return <SupplierLayout title="Meu perfil" description="Consulte seu cadastro e os cinemas autorizados.">
    <section className={styles.panel}><header className={styles.panelHeader}><div><h2>Dados do fornecedor</h2><p>Cadastro administrado pelo CineAstra.</p></div></header>
      {profile.loading && <p className={styles.state} role="status">Carregando cadastro…</p>}
      {profile.error && <div className={styles.state} role="alert"><p>{profile.error}</p><button type="button" onClick={reload}>Tentar novamente</button></div>}
      {profile.data && <dl className={styles.detailGrid} style={{ padding: '0 24px 24px' }}><div><dt>Razão social</dt><dd>{profile.data.razao_social}</dd></div><div><dt>Nome</dt><dd>{profile.data.nome_cine || '—'}</dd></div><div><dt>CNPJ</dt><dd>Final {profile.data.cnpj_ultimos4}</dd></div><div><dt>Status</dt><dd>{statusName(profile.data.status)}</dd></div></dl>}
    </section>
    <section className={`${styles.panel} ${styles.spacedPanel}`}><header className={styles.panelHeader}><div><h2>Cinemas autorizados</h2><p>Locais onde seus itens podem ser cadastrados.</p></div></header><SupplierState list={locations} noun="cinemas" empty="Nenhum cinema autorizado." />{locations.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Cinemas autorizados" tabIndex={0}><table className={styles.table}><thead><tr><th scope="col">Cinema</th><th scope="col">Status</th></tr></thead><tbody>{locations.items.map(row => <tr key={row.id_local}><th scope="row">{locations.name(row.id_local)}</th><td><span className={styles.badge}>{statusName(row.status)}</span></td></tr>)}</tbody></table></div>}<More list={locations} noun="cinemas" /></section>
  </SupplierLayout>;
}
