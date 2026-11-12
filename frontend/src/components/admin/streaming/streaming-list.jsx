'use client';

import TablePagination from '@/components/ui/table-pagination';
import { useState } from 'react';
import { Eye, Pencil, Plus, Repeat2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import UserLookupFilter from '@/components/admin/people/user-lookup-filter';
import { useAdminCatalogList } from '@/hooks/admin/use-admin-catalog';
import { useAdminStreaming } from '@/hooks/admin/use-admin-streaming';
import StreamingLayout, { StreamingState, dateOnly, dateTime, money, statusName } from './streaming-layout';
import SubscriptionAdminDialog from './subscription-admin-dialog';
import styles from '../catalog/catalog.module.css';

const subscriptions = { title: 'Assinaturas', description: 'Consulte contratos e estados das assinaturas.', statuses: ['ATIVA', 'CANCELADA', 'EXPIRADA', 'PENDENTE'], extra: 'planId' };
const accesses = { title: 'Acessos', description: 'Acompanhe os direitos de reprodução por filme e cliente.', statuses: ['ATIVO', 'EXPIRADO', 'REVOGADO'], extra: 'filmId' };

export default function StreamingList({ kind }) {
  const config = kind === 'subscriptions' ? subscriptions : accesses;
  const [status, setStatus] = useState('');
  const [userId, setUserId] = useState('');
  const [extraId, setExtraId] = useState('');
  const [selected, setSelected] = useState(null);
  const [operation, setOperation] = useState(null);
  const [notice, setNotice] = useState('');
  const validId = value => /^[1-9]\d{0,9}$/.test(value) && BigInt(value) <= 4294967295n;
  const invalid = Boolean(userId && !validId(userId)) || Boolean(extraId && !validId(extraId));
  const params = new URLSearchParams({ limit: '20' });
  if (status) params.set('status', status);
  if (userId && !invalid) params.set('userId', userId);
  if (extraId && !invalid) params.set(config.extra, extraId);
  const list = useAdminStreaming(invalid ? null : `${kind}?${params}`);
  const plans = useAdminStreaming(kind === 'subscriptions' ? 'plans?limit=100' : null);
  const films = useAdminCatalogList(kind === 'accesses' ? 'films?limit=100' : null);
  const choices = kind === 'subscriptions' ? plans : films;
  const choiceId = row => kind === 'subscriptions' ? row.id : row.id_filme;
  const choiceName = row => kind === 'subscriptions' ? row.name : row.titulo;

  return <StreamingLayout title={config.title} description={config.description} action={kind === 'subscriptions' && <button type="button" className={styles.primary} onClick={() => setOperation({ mode: 'create' })}><Plus size={16} aria-hidden="true" />Nova assinatura</button>}>
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    <section className={styles.panel} aria-labelledby="streaming-records-title"><header className={styles.panelHeader}><div><h2 id="streaming-records-title">{kind === 'subscriptions' ? 'Assinaturas registradas' : 'Acessos registrados'}</h2><p>Ordenados pelos registros mais recentes.</p></div><span className={styles.count}>{list.items.length} carregados</span></header>
      <div className={styles.toolbar}><label className={styles.filter}>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos</option>{config.statuses.map(value => <option key={value} value={value}>{statusName(value)}</option>)}</select></label><UserLookupFilter label="Cliente" role="CLIENTE" value={userId} onChange={setUserId} /><label className={styles.filter}>{kind === 'subscriptions' ? 'Plano' : 'Filme'}<select value={extraId} onChange={event => setExtraId(event.target.value)}><option value="">Todos</option>{extraId && !choices.items.some(row => choiceId(row) === extraId) && <option value={extraId}>{kind === 'subscriptions' ? 'Plano' : 'Filme'} #{extraId}</option>}{choices.items.map(row => <option key={choiceId(row)} value={choiceId(row)}>{choiceName(row)} · #{choiceId(row)}</option>)}</select></label>{choices.nextCursor && <button type="button" className={styles.lookupMore} onClick={choices.loadMore} disabled={choices.loadingMore}>{choices.loadingMore ? 'Carregando…' : 'Mais opções'}</button>}{choices.error && <button type="button" className={styles.lookupMore} onClick={choices.reload} title={choices.error}>Recarregar opções</button>}</div>
      {invalid && <p className={styles.error} role="alert">Informe IDs numéricos válidos ou deixe os filtros vazios.</p>}
      {!invalid && <StreamingState list={list} empty={`Nenhum registro de ${config.title.toLocaleLowerCase('pt-BR')} encontrado.`} noun={config.title.toLocaleLowerCase('pt-BR')} />}
      {!invalid && list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label={`Tabela de ${config.title.toLocaleLowerCase('pt-BR')}; role horizontalmente em telas pequenas`} tabIndex={0}><table className={styles.table}><caption className="sr-only">{config.title}</caption><thead><tr><th scope="col">Registro</th><th scope="col">Cliente</th><th scope="col">{kind === 'subscriptions' ? 'Plano' : 'Filme'}</th><th scope="col">{kind === 'subscriptions' ? 'Período' : 'Tipo'}</th><th scope="col">Status</th><th scope="col">{kind === 'subscriptions' ? 'Início' : 'Liberado em'}</th><th scope="col">Ações</th></tr></thead><tbody>{list.items.map(row => <tr key={row.id}><th scope="row">#{row.id}</th><td>{row.customer}<small className={styles.muted}> · #{row.userId}</small></td><td>{kind === 'subscriptions' ? row.plan : row.film}</td><td>{statusName(kind === 'subscriptions' ? row.period : row.mode)}</td><td><span className={`${styles.badge} ${['CANCELADA', 'EXPIRADA', 'REVOGADO'].includes(row.status) ? styles.inactive : ''}`}>{row.administrativeDraft ? 'Aguardando aceite' : statusName(row.status)}</span></td><td>{kind === 'subscriptions' ? dateOnly(row.startsOn) : dateTime(row.startsAt)}</td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Ver detalhes" aria-label={`Ver ${kind === 'subscriptions' ? 'assinatura' : 'acesso'} ${row.id}`} onClick={() => setSelected(row)}><Eye size={16} aria-hidden="true" /></button>
        {kind === 'subscriptions' && row.administrativeDraft && <button type="button" className={styles.iconButton} title="Editar proposta" aria-label={`Editar proposta ${row.id}`} onClick={() => setOperation({ mode: 'edit', row })}><Pencil size={16} aria-hidden="true" /></button>}
        {kind === 'subscriptions' && row.autoRenew && ['ATIVA','PENDENTE'].includes(row.status) && !row.administrativeDraft && <button type="button" className={styles.iconButton} title="Desativar renovação" aria-label={`Desativar renovação da assinatura ${row.id}`} onClick={() => setOperation({ mode: 'stop', row })}><Repeat2 size={16} aria-hidden="true" /></button>}
      </div></td></tr>)}</tbody></table></div>}
      <TablePagination list={list} />
    </section>
    <Dialog open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{kind === 'subscriptions' ? 'Assinatura' : 'Acesso'} #{selected?.id}</DialogTitle><DialogDescription className={styles.dialogDescription}>Registro administrativo de Streaming.</DialogDescription>
      {selected && <dl className={styles.detailGrid}><div><dt>Cliente</dt><dd>{selected.customer} · #{selected.userId}</dd></div><div><dt>Status</dt><dd>{selected.administrativeDraft ? 'Aguardando aceite' : statusName(selected.status)}</dd></div>{kind === 'subscriptions' ? <><div><dt>Plano</dt><dd>{selected.plan} · #{selected.planId}</dd></div><div><dt>Periodicidade</dt><dd>{statusName(selected.period)}</dd></div><div><dt>Início</dt><dd>{dateOnly(selected.startsOn)}</dd></div><div><dt>Fim</dt><dd>{dateOnly(selected.endsOn)}</dd></div><div><dt>Valor contratado</dt><dd>{money(selected.contractPrice)}</dd></div><div><dt>Renovação automática</dt><dd>{selected.autoRenew ? 'Sim' : 'Não'}</dd></div><div><dt>Divisão</dt><dd>{statusName(selected.divisionMode)}</dd></div></> : <><div><dt>Filme</dt><dd>{selected.film} · #{selected.filmId}</dd></div><div><dt>Tipo</dt><dd>{statusName(selected.mode)}</dd></div><div><dt>Item do pedido</dt><dd>#{selected.itemId}</dd></div><div><dt>Início</dt><dd>{dateTime(selected.startsAt)}</dd></div><div><dt>Expiração</dt><dd>{selected.expiresAt ? dateTime(selected.expiresAt) : 'Sem data de expiração'}</dd></div></>}</dl>}
    </DialogContent></Dialog>
    {operation && <SubscriptionAdminDialog {...operation} plans={plans} onClose={() => setOperation(null)} onSaved={message => { setOperation(null); setNotice(message); list.reload(); }} />}
  </StreamingLayout>;
}
