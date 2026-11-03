'use client';

import { Check, Plus, X, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useAdminPeople } from '@/hooks/admin/use-admin-people';
import { teamRequest, useAdminTeams, useTeamActions, useTeamScope } from '@/hooks/admin/use-admin-teams';
import TeamLayout, { dateTime, label, TeamFooter, TeamPicker, TeamState } from './team-layout';
import styles from '../catalog/catalog.module.css';

export default function EntriesAdmin() {
  const scope = useTeamScope();
  const list = useAdminTeams(scope.teamId ? `teams/${scope.teamId}/entries?limit=20` : null);
  const users = useAdminPeople('users?limit=100&role=COLABORADOR&status=ATIVO');
  const actions = useTeamActions(list), item = actions.dialog?.item;
  const userName = id => users.items.find(user => user.id === id)?.name ?? `Conta #${id}`;
  function invite(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget), userId = String(form.get('userId') ?? ''), funcao = String(form.get('funcao') ?? '').trim();
    if (!userId || !funcao || funcao.length > 100) { actions.setError('Selecione um colaborador e informe a função.'); return; }
    actions.run(() => teamRequest(`teams/${scope.teamId}/entries/invitations`, { method: 'POST', body: { userId, funcao } }), 'Convite enviado.');
  }
  function decide(event) {
    event.preventDefault();
    const decision = actions.dialog?.type === 'accept' ? 'ACEITAR' : 'RECUSAR';
    const funcao = String(new FormData(event.currentTarget).get('funcao') ?? '').trim();
    if (decision === 'ACEITAR' && (!funcao || funcao.length > 100)) { actions.setError('Informe a função do colaborador.'); return; }
    actions.run(() => teamRequest(`teams/${scope.teamId}/entries/${item.id_entrada}/decision`, { method: 'POST', body: decision === 'ACEITAR' ? { decision, funcao } : { decision } }), decision === 'ACEITAR' ? 'Solicitação aceita.' : 'Solicitação recusada.');
  }
  return <TeamLayout title="Entradas" description="Acompanhe solicitações e convites para as equipes." teamId={scope.teamId} action={<button type="button" className={styles.primary} onClick={() => actions.open('invite')} disabled={!scope.teamId || scope.team?.status !== 'ATIVA'}><Plus size={16} aria-hidden="true" />Novo convite</button>}>
    <TeamPicker scope={scope} />{actions.notice && <p className={styles.notice} role="status">{actions.notice}</p>}
    <section className={styles.panel} aria-labelledby="entries-title"><header className={styles.panelHeader}><div><h2 id="entries-title">Entradas da equipe</h2><p>Solicitações são decididas pelo administrador; convites aguardam o colaborador.</p></div><span className={styles.count}>{list.items.length} carregadas</span></header>
      {scope.teamId && <><TeamState list={list} empty="Nenhuma entrada nesta equipe." noun="entradas" />{list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de entradas; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Entradas da equipe</caption><thead><tr><th scope="col">Colaborador</th><th scope="col">Tipo</th><th scope="col">Função proposta</th><th scope="col">Status</th><th scope="col">Criada em</th><th scope="col">Ações</th></tr></thead><tbody>{list.items.map(row => <tr key={row.id_entrada}><th scope="row">{userName(row.id_usuario)}<small className={styles.muted}> · #{row.id_entrada}</small></th><td>{label(row.tipo)}</td><td>{row.funcao_proposta || '—'}</td><td><span className={`${styles.badge} ${row.status === 'PENDENTE' ? '' : styles.inactive}`}>{label(row.status)}</span></td><td>{dateTime(row.criado_em)}</td><td><div className={styles.actions}>{row.status === 'PENDENTE' && scope.team?.status === 'ATIVA' && <>{row.tipo === 'SOLICITACAO' && <><button type="button" className={styles.iconButton} title="Aceitar solicitação" aria-label={`Aceitar solicitação de ${userName(row.id_usuario)}`} onClick={() => actions.open('accept', row)}><Check size={16} aria-hidden="true" /></button><button type="button" className={styles.iconButton} title="Recusar solicitação" aria-label={`Recusar solicitação de ${userName(row.id_usuario)}`} onClick={() => actions.open('refuse', row)}><X size={16} aria-hidden="true" /></button></>}<button type="button" className={`${styles.iconButton} ${styles.destructive}`} title="Cancelar entrada" aria-label={`Cancelar entrada de ${userName(row.id_usuario)}`} onClick={() => actions.open('cancel', row)}><XCircle size={16} aria-hidden="true" /></button></>}</div></td></tr>)}</tbody></table></div>}{list.error && list.items.length > 0 && <p className={styles.error} role="alert">{list.error}</p>}<TeamFooter list={list} noun="entradas" /></>}{!scope.teamId && <p className={styles.state}>Selecione uma equipe para consultar as entradas.</p>}
    </section>
    <Dialog open={Boolean(actions.dialog)} onOpenChange={value => { if (!value) actions.close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{actions.dialog?.type === 'invite' ? 'Convidar colaborador' : actions.dialog?.type === 'accept' ? 'Aceitar solicitação' : actions.dialog?.type === 'refuse' ? 'Recusar solicitação' : 'Cancelar entrada'}</DialogTitle><DialogDescription className={styles.dialogDescription}>{actions.dialog?.type === 'invite' ? `Equipe ${scope.team?.nome ?? `#${scope.teamId}`}` : item ? userName(item.id_usuario) : ''}</DialogDescription>
      {actions.dialog?.type === 'invite' && <form className={styles.form} onSubmit={invite}><label className={styles.wide}>Colaborador<select name="userId" defaultValue="" required><option value="">Selecione</option>{users.items.map(user => <option key={user.id} value={user.id}>{user.name} · #{user.id}</option>)}</select></label><label className={styles.wide}>Função<input name="funcao" maxLength={100} required /></label>{users.nextCursor && <button type="button" className={styles.secondary} onClick={users.loadMore} disabled={users.loadingMore}>{users.loadingMore ? 'Carregando…' : 'Mais colaboradores'}</button>}{users.error && <p className={`${styles.error} ${styles.wide}`} role="alert">{users.error}</p>}<div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="submit" className={styles.primary} disabled={actions.pending}>{actions.pending ? 'Enviando…' : 'Enviar convite'}</button></div></form>}
      {['accept', 'refuse'].includes(actions.dialog?.type) && <form className={styles.form} onSubmit={decide}>{actions.dialog.type === 'accept' && <label className={styles.wide}>Função<input name="funcao" maxLength={100} required /></label>}<div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={actions.close}>Voltar</button><button type="submit" className={actions.dialog.type === 'refuse' ? styles.danger : styles.primary} disabled={actions.pending}>{actions.pending ? 'Aguarde…' : actions.dialog.type === 'accept' ? 'Aceitar' : 'Recusar'}</button></div></form>}
      {actions.dialog?.type === 'cancel' && <div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={actions.close}>Voltar</button><button type="button" className={styles.danger} disabled={actions.pending} onClick={() => actions.run(() => teamRequest(`teams/${scope.teamId}/entries/${item.id_entrada}`, { method: 'DELETE' }), 'Entrada cancelada.')}>{actions.pending ? 'Aguarde…' : 'Cancelar entrada'}</button></div>}{actions.error && <p className={styles.error} role="alert">{actions.error}</p>}
    </DialogContent></Dialog>
  </TeamLayout>;
}
