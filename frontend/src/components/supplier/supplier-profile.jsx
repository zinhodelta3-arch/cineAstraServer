'use client';

import { useEffect, useState } from 'react';
import { supplierRequest, useSupplierLocations } from '@/hooks/supplier/use-supplier-data';
import SupplierLayout, { More, SupplierState, statusName } from './supplier-layout';
import styles from '@/components/admin/catalog/catalog.module.css';
import useProfileResource from '@/hooks/cinema/perfil/use-profile-resource';
import { ListSkeleton } from '@/components/ui/list-feedback';

export default function SupplierProfile() {
  const [profile, setProfile] = useState({ data: null, loading: true, error: '' });
  const locations = useSupplierLocations();
  const account = useProfileResource('');
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
    <div className="mb-6 grid gap-4 lg:grid-cols-2">
    <section className={styles.panel} aria-labelledby="supplier-account-title">
      <header className={styles.panelHeader}><h2 id="supplier-account-title">Conta</h2></header>
      {account.loading&&<ListSkeleton label="Carregando conta…"/>}
      {account.error&&<div className={styles.state} role="alert"><p>{account.error}</p><button type="button" onClick={account.retry}>Tentar novamente</button></div>}
      {account.data&&<dl className={`${styles.detailGrid} px-6 pb-6`}><div><dt>Nome</dt><dd>{account.data.name}</dd></div></dl>}
    </section>
    <section className={styles.panel} aria-labelledby="supplier-company-title"><header className={styles.panelHeader}><div><h2 id="supplier-company-title">Empresa</h2><p>Cadastro administrado pelo CineAstra.</p></div></header>
      {profile.loading && <ListSkeleton label="Carregando empresa…"/>}
      {profile.error && <div className={styles.state} role="alert"><p>{profile.error}</p><button type="button" onClick={reload}>Tentar novamente</button></div>}
      {profile.data && <dl className={`${styles.detailGrid} px-6 pb-6`}><div><dt>Razão social</dt><dd>{profile.data.razao_social}</dd></div><div><dt>Nome cadastrado</dt><dd>{profile.data.nome_cine || '—'}</dd></div><div><dt>CNPJ</dt><dd>Final {profile.data.cnpj_ultimos4}</dd></div><div><dt>Status</dt><dd>{statusName(profile.data.status)}</dd></div></dl>}
    </section>
    <section className={`${styles.panel} lg:col-span-2`} aria-labelledby="supplier-contact-title">
      <header className={styles.panelHeader}><h2 id="supplier-contact-title">Contatos</h2></header>
      {account.data&&<dl className={`${styles.detailGrid} px-6 pb-6`}>
        <div><dt>E-mail</dt><dd className="break-words">{account.data.email}</dd></div><div><dt>Telefone</dt><dd>{account.data.phone || 'Não informado'}</dd></div>
      </dl>}
      {!account.data&&<p className="px-6 pb-6 text-sm text-muted-foreground">{account.loading?'Carregando contatos…':'Contatos indisponíveis.'}</p>}
    </section>
    </div>
    <section className={`${styles.panel} ${styles.spacedPanel}`}><header className={styles.panelHeader}><div><h2>Cinemas autorizados</h2><p>Locais onde seus itens podem ser cadastrados.</p></div></header><SupplierState list={locations} noun="cinemas" empty="Nenhum cinema autorizado." />{locations.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Cinemas autorizados" tabIndex={0}><table className={styles.table}><thead><tr><th scope="col">Cinema</th><th scope="col">Status</th></tr></thead><tbody>{locations.items.map(row => <tr key={row.id_local}><th scope="row">{locations.name(row.id_local)}</th><td><span className={styles.badge}>{statusName(row.status)}</span></td></tr>)}</tbody></table></div>}<More list={locations} noun="cinemas" /></section>
  </SupplierLayout>;
}
