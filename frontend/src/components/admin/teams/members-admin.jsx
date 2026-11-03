'use client';

import Link from 'next/link';
import { Pencil, UserRoundMinus, UserRoundPlus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useAdminPeople } from '@/hooks/admin/use-admin-people';
import { teamRequest, useAdminTeams, useTeamActions, useTeamScope } from '@/hooks/admin/use-admin-teams';
import TeamLayout, { label, TeamFooter, TeamPicker, TeamState } from './team-layout';
import styles from '../catalog/catalog.module.css';

export default function MembersAdmin() {
  const scope = useTeamScope();
  const list = useAdminTeams(scope.teamId ? `teams/${scope.teamId}/members?limit=20` : null);
  const users = useAdminPeople('users?limit=100&role=COLABORADOR');
  const actions = useTeamActions(list), item = actions.dialog?.item;
  const userName = id => users.items.find(user => user.id === id)?.name ?? `Conta #${id}`;
  function save(event) {
    event.preventDefault();
    const funcao = String(new FormData(event.currentTarget).get('funcao') ?? '').trim();
    if (!funcao || funcao.length > 100 || funcao === item?.funcao) { actions.setError('Informe uma função diferente, com até 100 caracteres.'); return; }
    actions.run(() => teamRequest(`teams/${scope.teamId}/members/${item.id_equipe_membro}`, { method: 'PATCH', body: { funcao } }), 'Função atualizada.');
  }
  return <TeamLayout title="Membros" description="Consulte a equipe da sessão e atualize as funções dos colaboradores." teamId={scope.teamId} action={<Link className={styles.primary} href={`/admin/equipes/entradas${scope.teamId ? `?teamId=${scope.teamId}` : ''}`}><UserRoundPlus size={16} aria-hidden="true" />Gerenciar convites</Link>}>
    <TeamPicker scope={scope} />{actions.notice && <p className={styles.notice} role="status">{actions.notice}</p>}
    <section className={styles.panel} aria-labelledby="members-title"><header className={styles.panelHeader}><div><h2 id="members-title">Membros da equipe</h2><p>Convites aceitos passam a integrar esta lista.</p></div><span className={styles.count}>{list.items.length} carregados</span></header>
      {scope.teamId && <><TeamState list={list} empty="Nenhum membro nesta equipe." noun="membros" />{list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de membros; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Membros da equipe</caption><thead><tr><th scope="col">Colaborador</th><th scope="col">Função</th><th scope="col">Entrada</th><th scope="col">Status</th><th scope="col">Ações</th></tr></thead><tbody>{list.items.map(row => <tr key={row.id_equipe_membro}><th scope="row">{userName(row.id_usuario)}<small className={styles.muted}> · #{row.id_usuario}</small></th><td>{row.funcao || '—'}</td><td>{row.data_entrada ? String(row.data_entrada).slice(0, 10).split('-').reverse().join('/') : '—'}</td><td><span className={`${styles.badge} ${row.status === 'ATIVO' ? '' : styles.inactive}`}>{label(row.status)}</span></td><td><div className={styles.actions}>{row.status === 'ATIVO' && scope.team?.status === 'ATIVA' && <><button type="button" className={styles.iconButton} title="Alterar função" aria-label={`Alterar função de ${userName(row.id_usuario)}`} onClick={() => actions.open('edit', row)}><Pencil size={16} aria-hidden="true" /></button><button type="button" className={`${styles.iconButton} ${styles.destructive}`} title="Remover membro" aria-label={`Remover ${userName(row.id_usuario)}`} onClick={() => actions.open('remove', row)}><UserRoundMinus size={16} aria-hidden="true" /></button></>}</div></td></tr>)}</tbody></table></div>}{list.error && list.items.length > 0 && <p className={styles.error} role="alert">{list.error}</p>}<TeamFooter list={list} noun="membros" /></>}
      {!scope.teamId && <p className={styles.state}>Selecione uma equipe para consultar os membros.</p>}
    </section>
    {users.nextCursor && <button type="button" className={styles.secondary} onClick={users.loadMore} disabled={users.loadingMore}>{users.loadingMore ? 'Carregando…' : 'Carregar mais nomes'}</button>}
    <Dialog open={Boolean(actions.dialog)} onOpenChange={value => { if (!value) actions.close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{actions.dialog?.type === 'edit' ? 'Alterar função' : 'Remover membro'}</DialogTitle><DialogDescription className={styles.dialogDescription}>{item ? userName(item.id_usuario) : ''}</DialogDescription>{actions.dialog?.type === 'edit' && <form className={styles.form} onSubmit={save}><label className={styles.wide}>Função<input name="funcao" maxLength={100} defaultValue={item?.funcao ?? ''} required /></label><div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={actions.close}>Cancelar</button><button type="submit" className={styles.primary} disabled={actions.pending}>{actions.pending ? 'Salvando…' : 'Salvar função'}</button></div></form>}{actions.dialog?.type === 'remove' && <div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={actions.close}>Voltar</button><button type="button" className={styles.danger} disabled={actions.pending} onClick={() => actions.run(() => teamRequest(`teams/${scope.teamId}/members/${item.id_equipe_membro}`, { method: 'DELETE' }), 'Membro removido.')}>{actions.pending ? 'Removendo…' : 'Remover membro'}</button></div>}{actions.error && <p className={styles.error} role="alert">{actions.error}</p>}</DialogContent></Dialog>
  </TeamLayout>;
}
