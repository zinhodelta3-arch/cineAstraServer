'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useAdminVenues } from '@/hooks/admin/use-admin-venues';
import { peopleRequest } from '@/hooks/admin/use-admin-people';
import styles from '../catalog/catalog.module.css';

export default function SupervisorLocationDialog({ supervisor, onClose, onSaved }) {
  const [current, setCurrent] = useState(null);
  const [localId, setLocalId] = useState('');
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const locations = useAdminVenues(supervisor ? 'locations?limit=100&status=ATIVO' : null);
  const ready = Boolean(supervisor && current?.supervisorId === supervisor.id && !loading);

  useEffect(() => {
    if (!supervisor) return;
    const abort = new AbortController();
    setCurrent(null); setLocalId(''); setError(''); setLoading(true);
    peopleRequest(`users/${supervisor.id}/location`, { signal: abort.signal })
      .then(data => { if (!abort.signal.aborted) { setCurrent(data); setLocalId(data.localId ?? ''); } })
      .catch(cause => { if (!abort.signal.aborted) setError(cause.message); })
      .finally(() => { if (!abort.signal.aborted) setLoading(false); });
    return () => abort.abort();
  }, [supervisor]);

  async function save(event) {
    event.preventDefault();
    if (!ready || pending) return;
    setPending(true); setError('');
    try {
      await peopleRequest(`users/${supervisor.id}/location`, { method: 'PATCH', body: { localId: localId || null } });
      onSaved();
    } catch (cause) { setError(cause.message); }
    finally { setPending(false); }
  }

  return <Dialog open={Boolean(supervisor)} onOpenChange={open => { if (!open && !pending) onClose(); }}><DialogContent className={styles.dialog}>
    <DialogTitle className={styles.dialogTitle}>Cinema do supervisor</DialogTitle>
    <DialogDescription className={styles.dialogDescription}>{supervisor?.name} poderá administrar um cinema por vez. Equipes ativas precisam pertencer a esse local.</DialogDescription>
    {loading && <p role="status">Carregando vínculo…</p>}
    {ready && <form className={styles.form} onSubmit={save}>
      <label className={styles.wide}>Cinema<select value={localId} onChange={event => setLocalId(event.target.value)} disabled={pending || locations.loading}>
        <option value="">Sem cinema atribuído</option>
        {current.localId && !locations.items.some(row => row.id_local === current.localId) && <option value={current.localId}>{current.localName} · #{current.localId}</option>}
        {locations.items.map(row => <option key={row.id_local} value={row.id_local}>{row.nome} · {row.cidade}, {row.estado}</option>)}
      </select></label>
      {locations.nextCursor && <button type="button" className={styles.secondary} onClick={locations.loadMore} disabled={locations.loadingMore}>{locations.loadingMore ? 'Carregando…' : 'Mais cinemas'}</button>}
      {locations.error && <p className={`${styles.error} ${styles.wide}`} role="alert">{locations.error}</p>}
      <div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={onClose} disabled={pending}>Cancelar</button><button type="submit" className={styles.primary} disabled={pending || locations.loading || Boolean(locations.error)}>{pending ? 'Salvando…' : 'Salvar vínculo'}</button></div>
    </form>}
    {error && <p className={styles.error} role="alert">{error}</p>}
  </DialogContent></Dialog>;
}
