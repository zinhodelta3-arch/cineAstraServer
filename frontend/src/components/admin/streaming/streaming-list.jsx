'use client';

import TablePagination from '@/components/ui/table-pagination';
import { useRef, useState } from 'react';
import { Ban, Eye, Pencil, Plus, Repeat2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import UserLookupFilter from '@/components/admin/people/user-lookup-filter';
import { useAdminCatalogList } from '@/hooks/admin/use-admin-catalog';
import { streamingAdminRequest, useAdminStreaming } from '@/hooks/admin/use-admin-streaming';
import { planModality } from '@/lib/api/plan-subscription.mjs';
import { useTablePreference } from '@/hooks/use-table-preference';
import StreamingLayout, { StreamingState, dateOnly, dateTime, money, statusName } from './streaming-layout';
import SubscriptionAdminDialog from './subscription-admin-dialog';
import styles from '../catalog/catalog.module.css';

const subscriptions = { title: 'Assinaturas', description: 'Consulte contratos e estados das assinaturas.', statuses: ['ATIVA', 'CANCELADA', 'EXPIRADA', 'PENDENTE'], extra: 'planId' };
const accesses = { title: 'Acessos', description: 'Acompanhe os direitos de reprodução por filme e cliente.', statuses: ['ATIVO', 'EXPIRADO', 'REVOGADO'], extra: 'filmId' };

export default function StreamingList({ kind }) {
  const config = kind === 'subscriptions' ? subscriptions : accesses;
  const [status, setStatus] = useTablePreference(`admin:${kind}:status`,'');
  const [userId, setUserId] = useTablePreference(`admin:${kind}:cliente`,'');
  const [extraId, setExtraId] = useTablePreference(`admin:${kind}:recurso`,'');
  const [selected, setSelected] = useState(null);
  const [operation, setOperation] = useState(null);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [pending, setPending] = useState(false);
  const actionLock = useRef(false);
  const validId = value => /^[1-9]\d{0,9}$/.test(value) && BigInt(value) <= 4294967295n;
  const invalid = Boolean(userId && !validId(userId)) || Boolean(extraId && !validId(extraId));
  const params = new URLSearchParams({ limit: '20' });
  if (status) params.set('status', status);
  if (userId && !invalid) params.set('userId', userId);
  if (extraId && !invalid) params.set(config.extra, extraId);
  const list = useAdminStreaming(invalid ? null : `${kind}?${params}`,`admin:${kind}`);
  const plans = useAdminStreaming(kind === 'subscriptions' ? 'plans?limit=100' : null);
  const films = useAdminCatalogList(kind === 'accesses' ? 'films?limit=100' : null);
  const choices = kind === 'subscriptions' ? plans : films;
  const choiceId = row => kind === 'subscriptions' ? row.id : row.id_filme;
  const choiceName = row => kind === 'subscriptions' ? row.name : row.titulo;

  async function revoke() {
    if (actionLock.current) return;
    actionLock.current = true;
    setPending(true);
    setActionError('');
    try {
      await streamingAdminRequest(`accesses/${operation.row.id}`, { method: 'DELETE' });
      setOperation(null);
      setNotice('Acesso revogado.');
      list.reload();
    } catch (error) {
      setActionError(error.message);
    } finally {
      actionLock.current = false;
      setPending(false);
    }
  }

  return <StreamingLayout title={config.title} description={config.description} action={kind === 'subscriptions' && <button type="button" className={styles.primary} onClick={() => setOperation({ mode: 'create' })}><Plus size={16} aria-hidden="true" />Nova assinatura</button>}>
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    <section className={styles.panel} aria-labelledby="streaming-records-title"><header className={styles.panelHeader}><div><h2 id="streaming-records-title">{kind === 'subscriptions' ? 'Assinaturas registradas' : 'Acessos registrados'}</h2><p>Ordenados pelos registros mais recentes.</p></div><span className={styles.count}>{list.items.length} carregados</span></header>
      <div className={styles.toolbar}><label className={styles.filter}>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos</option>{config.statuses.map(value => <option key={value} value={value}>{statusName(value)}</option>)}</select></label><UserLookupFilter label="Cliente" role="CLIENTE" value={userId} onChange={setUserId} /><label className={styles.filter}>{kind === 'subscriptions' ? 'Plano' : 'Filme'}<select value={extraId} onChange={event => setExtraId(event.target.value)}><option value="">Todos</option>{extraId && !choices.items.some(row => choiceId(row) === extraId) && <option value={extraId}>{kind === 'subscriptions' ? 'Plano' : 'Filme'} #{extraId}</option>}{choices.items.map(row => <option key={choiceId(row)} value={choiceId(row)}>{choiceName(row)} · #{choiceId(row)}</option>)}</select></label>{choices.nextCursor && <button type="button" className={styles.lookupMore} onClick={choices.loadMore} disabled={choices.loadingMore}>{choices.loadingMore ? 'Carregando…' : 'Mais opções'}</button>}{choices.error && <button type="button" className={styles.lookupMore} onClick={choices.reload} title={choices.error}>Recarregar opções</button>}</div>
      {invalid && <p className={styles.error} role="alert">Informe IDs numéricos válidos ou deixe os filtros vazios.</p>}
      {!invalid && <StreamingState list={list} empty={`Nenhum registro de ${config.title.toLocaleLowerCase('pt-BR')} encontrado.`} noun={config.title.toLocaleLowerCase('pt-BR')} />}
      {!invalid && list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label={`Tabela de ${config.title.toLocaleLowerCase('pt-BR')}; role horizontalmente em telas pequenas`} tabIndex={0}><table className={styles.table}><caption className="sr-only">{config.title}</caption><thead><tr><th scope="col">Registro</th><th scope="col">Cliente</th><th scope="col">{kind === 'subscriptions' ? 'Plano' : 'Filme'}</th><th scope="col">{kind === 'subscriptions' ? 'Período' : 'Tipo'}</th><th scope="col">Status</th><th scope="col">{kind === 'subscriptions' ? 'Início' : 'Liberado em'}</th><th scope="col">Ações</th></tr></thead><tbody>{list.items.map(row => <tr key={row.id}><th scope="row">{kind === 'subscriptions' ? 'Assinatura' : statusName(row.mode)}</th><td>{row.customer}</td><td>{kind === 'subscriptions' ? <>{row.plan}{row.modality && <small className={styles.muted}> · {planModality(row.modality)}</small>}</> : row.film}</td><td>{statusName(kind === 'subscriptions' ? row.period : row.mode)}</td><td><span className={`${styles.badge} ${['CANCELADA', 'EXPIRADA', 'REVOGADO'].includes(row.status) ? styles.inactive : ''}`}>{row.administrativeDraft ? 'Aguardando aceite' : row.endingOn && row.status === 'ATIVA' ? 'Encerramento agendado' : statusName(row.status)}</span></td><td>{kind === 'subscriptions' ? dateOnly(row.startsOn) : dateTime(row.startsAt)}</td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Ver detalhes" aria-label={`Ver ${kind === 'subscriptions' ? 'assinatura' : 'acesso'} ${row.id}`} onClick={() => setSelected(row)}><Eye size={16} aria-hidden="true" /></button>
        {kind === 'subscriptions' && row.administrativeDraft && <button type="button" className={styles.iconButton} title="Editar proposta" aria-label={`Editar proposta ${row.id}`} onClick={() => setOperation({ mode: 'edit', row })}><Pencil size={16} aria-hidden="true" /></button>}
        {kind === 'subscriptions' && row.status === 'ATIVA' && !row.endingOn && <button type="button" className={styles.iconButton} title="Propor troca de assinatura" aria-label={`Propor troca da assinatura ${row.id}`} onClick={() => setOperation({ mode: 'propose', row })}><Pencil size={16} aria-hidden="true" /></button>}
        {kind === 'subscriptions' && (row.autoRenew || row.renewalConsent) && ['ATIVA','PENDENTE'].includes(row.status) && !row.administrativeDraft && !row.endingOn && <button type="button" className={styles.iconButton} title={row.autoRenew ? 'Desativar renovação' : 'Retomar renovação'} aria-label={`${row.autoRenew ? 'Desativar' : 'Retomar'} renovação da assinatura ${row.id}`} onClick={() => setOperation({ mode: row.autoRenew ? 'stop' : 'enable', row })}><Repeat2 size={16} aria-hidden="true" /></button>}
        {kind === 'subscriptions' && ['ATIVA','PENDENTE'].includes(row.status) && !row.endingOn && <button type="button" className={styles.iconButton} title="Encerrar assinatura" aria-label={`Encerrar assinatura ${row.id}`} onClick={() => setOperation({ mode: 'end', row })}><Ban size={16} aria-hidden="true" /></button>}
        {kind === 'accesses' && row.status !== 'REVOGADO' && <button type="button" className={styles.iconButton} title="Revogar acesso" aria-label={`Revogar acesso ${row.id}`} onClick={() => { setActionError(''); setOperation({ mode: 'revoke', row }); }}><Ban size={16} aria-hidden="true" /></button>}
      </div></td></tr>)}</tbody></table></div>}
      <TablePagination list={list} />
    </section>
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{kind === 'subscriptions' ? 'Assinatura' : 'Acesso'}{selected ? ` · ${selected.customer}` : ''}</DialogTitle><DialogDescription className={styles.dialogDescription}>Registro administrativo de Streaming.</DialogDescription>
      {selected && <dl className={styles.detailGrid}><div><dt>Cliente</dt><dd>{selected.customer}</dd></div><div><dt>Status</dt><dd>{selected.administrativeDraft ? 'Aguardando aceite' : statusName(selected.status)}</dd></div>{kind === 'subscriptions' ? <><div><dt>Plano</dt><dd>{selected.plan}</dd></div><div><dt>Periodicidade</dt><dd>{statusName(selected.period)}</dd></div><div><dt>Início</dt><dd>{dateOnly(selected.startsOn)}</dd></div><div><dt>Fim</dt><dd>{dateOnly(selected.endsOn)}</dd></div><div><dt>Valor contratado</dt><dd>{money(selected.contractPrice)}</dd></div><div><dt>Renovação automática</dt><dd>{selected.autoRenew ? 'Sim' : 'Não'}</dd></div><div><dt>Divisão</dt><dd>{statusName(selected.divisionMode)}</dd></div></> : <><div><dt>Filme</dt><dd>{selected.film} · #{selected.filmId}</dd></div><div><dt>Tipo</dt><dd>{statusName(selected.mode)}</dd></div><div><dt>Item do pedido</dt><dd>#{selected.itemId}</dd></div><div><dt>Início</dt><dd>{dateTime(selected.startsAt)}</dd></div><div><dt>Expiração</dt><dd>{selected.expiresAt ? dateTime(selected.expiresAt) : 'Sem data de expiração'}</dd></div></>}</dl>}
    </DialogContent></Dialog>
    {operation && kind === 'subscriptions' && <SubscriptionAdminDialog {...operation} plans={plans} onClose={() => setOperation(null)} onSaved={message => { setOperation(null); setNotice(message); list.reload(); }} />}
    {operation?.mode === 'revoke' && <Dialog open onOpenChange={open => { if (!open && !pending) setOperation(null); }}>
      <DialogContent className={styles.dialog}>
        <DialogTitle className={styles.dialogTitle}>Revogar acesso</DialogTitle>
        <DialogDescription className={styles.dialogDescription}>O acesso de {operation.row.customer} a {operation.row.film} por este registro será revogado. O pedido e seu histórico serão preservados.</DialogDescription>
        {actionError && <p role="alert" className={styles.error}>{actionError}</p>}
        <div className={styles.dialogActions}>
          <button type="button" className={styles.secondary} disabled={pending} onClick={() => setOperation(null)}>Voltar</button>
          <button type="button" className={styles.danger} disabled={pending} onClick={revoke}>{pending ? 'Revogando…' : 'Revogar acesso'}</button>
        </div>
      </DialogContent>
    </Dialog>}
  </StreamingLayout>;
}
