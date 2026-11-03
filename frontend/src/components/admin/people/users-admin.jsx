'use client';

import { useEffect, useRef, useState } from 'react';
import { Eye, MapPin, Plus, Search, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { peopleRequest, useAdminPeople } from '@/hooks/admin/use-admin-people';
import PeopleLayout, { dateTime, PeopleState, statusName } from './people-layout';
import SupervisorLocationDialog from './supervisor-location-dialog';
import styles from '../catalog/catalog.module.css';

const roles = ['CLIENTE', 'FORNECEDOR', 'SUPERVISOR', 'COLABORADOR', 'ADMIN'];
const statuses = ['ATIVO', 'INATIVO', 'BLOQUEADO', 'PENDENTE_VERIFICACAO'];
const cpfMask = value => String(value ?? '').replace(/\D/g, '').slice(0, 11).replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2');

export default function UsersAdmin() {
  const [query, setQuery] = useState(''), [search, setSearch] = useState(''), [role, setRole] = useState(''), [status, setStatus] = useState('');
  const [dialog, setDialog] = useState(null), [detail, setDetail] = useState(null), [detailError, setDetailError] = useState(''), [detailLoading, setDetailLoading] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [cpf, setCpf] = useState(''), [pending, setPending] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const lock = useRef(false);
  useEffect(() => { const timer = setTimeout(() => setSearch(query.trim()), 300); return () => clearTimeout(timer); }, [query]);
  const params = new URLSearchParams({ limit: '20' });
  if (search) params.set('q', search);
  if (role) params.set('role', role);
  if (status) params.set('status', status);
  const list = useAdminPeople(`users?${params}`);

  useEffect(() => {
    if (!dialog?.item) return;
    const abort = new AbortController();
    setDetail(null); setDetailError(''); setDetailLoading(true);
    peopleRequest(`users/${dialog.item.id}`, { signal: abort.signal }).then(data => {
      if (!abort.signal.aborted) setDetail(data);
    }).catch(cause => { if (!abort.signal.aborted) setDetailError(cause.message); }).finally(() => { if (!abort.signal.aborted) setDetailLoading(false); });
    return () => abort.abort();
  }, [dialog]);

  function open(type, item = null) { setError(''); setNotice(''); setCpf(''); setDetail(null); setDialog({ type, item }); }
  function close() { if (!lock.current) setDialog(null); }
  async function run(task, success) {
    if (lock.current) return;
    lock.current = true; setPending(true); setError('');
    try { await task(); setDialog(null); setNotice(success); list.reload(); }
    catch (cause) { setError(cause.message); }
    finally { lock.current = false; setPending(false); }
  }
  function create(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(['name', 'email', 'dateOfBirth', 'role'].map(key => [key, String(form.get(key) ?? '').trim()]));
    body.password = String(form.get('password') ?? '');
    body.passwordConfirmation = String(form.get('passwordConfirmation') ?? '');
    body.cpf = cpf.replace(/\D/g, '');
    if (body.cpf.length !== 11) { setError('Informe os 11 dígitos do CPF.'); return; }
    if (body.password !== body.passwordConfirmation || body.password.length < 12 || !/[a-z]/.test(body.password) || !/[A-Z]/.test(body.password) || !/\d/.test(body.password) || !/[^a-zA-Z0-9]/.test(body.password)) { setError('A senha precisa ter ao menos 12 caracteres, maiúscula, minúscula, número e símbolo; confira a confirmação.'); return; }
    run(() => peopleRequest('users', { method: 'POST', body }), 'Conta criada com sucesso.');
  }
  function changeAccess(event) {
    event.preventDefault();
    if (!detail) return;
    const form = new FormData(event.currentTarget);
    const nextRole = String(form.get('role') ?? '');
    const nextStatus = String(form.get('status') ?? '');
    const body = {};
    if (nextRole && nextRole !== detail.role) body.role = nextRole;
    if (nextStatus && nextStatus !== detail.status) body.status = nextStatus;
    if (!Object.keys(body).length) { setError('Escolha uma alteração de papel ou status.'); return; }
    run(() => peopleRequest(`users/${detail.id}/access`, { method: 'PATCH', body }), 'Acesso atualizado. As sessões dessa conta foram encerradas.');
  }

  return <PeopleLayout title="Usuários" description="Consulte contas, cadastre a equipe e administre seus acessos." action={<button type="button" className={styles.primary} onClick={() => open('create')}><Plus size={16} aria-hidden="true" />Nova conta</button>}>
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    <section className={styles.panel} aria-labelledby="users-title"><header className={styles.panelHeader}><div><h2 id="users-title">Contas cadastradas</h2><p>Pesquise por nome ou e-mail e filtre pelo perfil ou status.</p></div><span className={styles.count}>{list.items.length} carregadas</span></header>
      <div className={styles.toolbar}><label className={styles.search}><Search size={15} aria-hidden="true" /><span className="sr-only">Buscar contas</span><input value={query} onChange={event => setQuery(event.target.value)} maxLength={150} placeholder="Nome ou e-mail" /></label><label className={styles.filter}>Perfil<select value={role} onChange={event => setRole(event.target.value)}><option value="">Todos</option>{roles.map(value => <option key={value} value={value}>{statusName(value)}</option>)}</select></label><label className={styles.filter}>Status<select value={status} onChange={event => setStatus(event.target.value)}><option value="">Todos</option>{statuses.map(value => <option key={value} value={value}>{statusName(value)}</option>)}</select></label></div>
      <PeopleState list={list} empty="Nenhuma conta encontrada." noun="contas" />
      {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de contas; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}><caption className="sr-only">Contas cadastradas</caption><thead><tr><th scope="col">Conta</th><th scope="col">Perfil</th><th scope="col">Status</th><th scope="col">Cadastro</th><th scope="col">Ações</th></tr></thead><tbody>{list.items.map(row => <tr key={row.id}><th scope="row">{row.name}<small className={styles.muted}> · #{row.id}</small><div className={styles.muted}>{row.email}</div></th><td>{statusName(row.role)}</td><td><span className={`${styles.badge} ${row.status === 'ATIVO' ? '' : styles.inactive}`}>{statusName(row.status)}</span></td><td>{dateTime(row.createdAt)}</td><td><div className={styles.actions}><button type="button" className={styles.iconButton} title="Ver conta" aria-label={`Ver conta de ${row.name}`} onClick={() => open('detail', row)}><Eye size={16} aria-hidden="true" /></button><button type="button" className={styles.iconButton} title="Alterar acesso" aria-label={`Alterar acesso de ${row.name}`} onClick={() => open('access', row)}><ShieldCheck size={16} aria-hidden="true" /></button>{row.role === 'SUPERVISOR' && row.status === 'ATIVO' && <button type="button" className={styles.iconButton} title="Definir cinema" aria-label={`Definir cinema de ${row.name}`} onClick={() => setSelectedSupervisor(row)}><MapPin size={16} aria-hidden="true" /></button>}</div></td></tr>)}</tbody></table></div>}
      {list.error && list.items.length > 0 && <p className={styles.error} role="alert">{list.error}</p>}
      <footer className={styles.footer}><span>Exibindo {list.items.length} contas{list.nextCursor ? ' · há mais' : ''}</span><button type="button" onClick={list.loadMore} disabled={!list.nextCursor || list.loadingMore}>{list.loadingMore ? 'Carregando…' : 'Carregar mais'}</button></footer>
    </section>
    <Dialog open={Boolean(dialog)} onOpenChange={value => { if (!value) close(); }}><DialogContent className={styles.dialog}><DialogTitle className={styles.dialogTitle}>{dialog?.type === 'create' ? 'Nova conta da equipe' : dialog?.type === 'access' ? 'Alterar acesso' : 'Detalhes da conta'}</DialogTitle>
      {dialog?.type === 'create' && <><DialogDescription className={styles.dialogDescription}>Crie uma conta para colaboradores, supervisores, fornecedores ou administradores.</DialogDescription><form className={styles.form} onSubmit={create}><label className={styles.wide}>Nome completo<input name="name" maxLength={100} autoComplete="name" required /></label><label>E-mail<input name="email" type="email" maxLength={150} autoComplete="email" required /></label><label>CPF<input name="cpf" inputMode="numeric" value={cpf} onChange={event => setCpf(cpfMask(event.target.value))} maxLength={14} placeholder="000.000.000-00" required /></label><label>Data de nascimento<input name="dateOfBirth" type="date" required /></label><label>Perfil<select name="role" defaultValue="COLABORADOR" required>{roles.filter(value => value !== 'CLIENTE').map(value => <option key={value} value={value}>{statusName(value)}</option>)}</select></label><label>Senha<input name="password" type="password" minLength={12} autoComplete="new-password" required /></label><label>Confirmar senha<input name="passwordConfirmation" type="password" minLength={12} autoComplete="new-password" required /></label><p className={`${styles.hint} ${styles.wide}`}>Use 12 caracteres ou mais, com maiúscula, minúscula, número e símbolo.</p><div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={close}>Cancelar</button><button type="submit" className={styles.primary} disabled={pending}>{pending ? 'Criando…' : 'Criar conta'}</button></div></form></>}
      {dialog?.type !== 'create' && <><DialogDescription className={styles.dialogDescription}>{dialog?.item?.name} · {dialog?.item?.email}</DialogDescription>{detailLoading && <p role="status">Carregando conta…</p>}{detailError && <p className={styles.error} role="alert">{detailError}</p>}{detail && dialog?.type === 'detail' && <dl className={styles.detailGrid}><div><dt>ID</dt><dd>#{detail.id}</dd></div><div><dt>Nome</dt><dd>{detail.name}</dd></div><div><dt>E-mail</dt><dd>{detail.email}</dd></div><div><dt>Perfil</dt><dd>{statusName(detail.role)}</dd></div><div><dt>Status</dt><dd>{statusName(detail.status)}</dd></div><div><dt>Nascimento</dt><dd>{detail.dateOfBirth ? String(detail.dateOfBirth).slice(0, 10).split('-').reverse().join('/') : '—'}</dd></div></dl>}{detail && dialog?.type === 'access' && <form key={`${detail.id}-${detail.role}-${detail.status}`} className={styles.form} onSubmit={changeAccess}><label>Perfil<select name="role" defaultValue={detail.role}>{roles.map(value => <option key={value} value={value}>{statusName(value)}</option>)}</select></label><label>Status<select name="status" defaultValue=""><option value="">Manter status atual ({statusName(detail.status)})</option><option value="INATIVO" disabled={detail.status === 'INATIVO'}>Inativo</option><option value="BLOQUEADO" disabled={detail.status === 'BLOQUEADO'}>Bloqueado</option></select></label><p className={`${styles.hint} ${styles.wide}`}>Alterar o acesso encerra as sessões atuais desta conta. A reativação de contas exige revisão de identidade e privacidade.</p><div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={close}>Cancelar</button><button type="submit" className={styles.primary} disabled={pending}>{pending ? 'Salvando…' : 'Salvar acesso'}</button></div></form>}</>}
      {error && <p className={styles.error} role="alert">{error}</p>}
    </DialogContent></Dialog>
    <SupervisorLocationDialog supervisor={selectedSupervisor} onClose={() => setSelectedSupervisor(null)} onSaved={() => { setSelectedSupervisor(null); setNotice('Cinema do supervisor atualizado.'); list.reload(); }} />
  </PeopleLayout>;
}
