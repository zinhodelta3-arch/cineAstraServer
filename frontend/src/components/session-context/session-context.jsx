'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Film } from 'lucide-react';
import { usePaginatedList } from '@/hooks/use-paginated-list';
import { scheduleRequest } from '@/hooks/admin/use-admin-schedule';
import { unitOperation } from '@/hooks/unit/use-unit-data';
import SessionSeatInspection from './session-seat-inspection';
import styles from './session-context.module.css';

const paths = {
  admin: { sessions:'/admin/sessoes', tickets:'/admin/sessoes/ingressos', presence:'/admin/sessoes/presenca' },
  unit: { sessions:'/unidade/sessoes', tickets:'/unidade/atendimento?visao=ingressos', presence:'/unidade/atendimento' },
};
const labels = { sessions:'Sessões', tickets:'Ingressos', presence:'Presença' };
const validId = value => /^[1-9]\d{0,9}$/.test(value ?? '') && Number(value) <= 4294967295;
const unitSeatRequest=(path,options)=>unitOperation(`/${path}`,options);

export function sessionHref(area, view, session) {
  const [path, qs] = paths[area][view].split('?');
  const query = new URLSearchParams(qs);
  if (session?.id_sessao) query.set('sessao', session.id_sessao);
  if (session?.id_local) query.set('local', session.id_local);
  const suffix = query.toString();
  return suffix ? `${path}?${suffix}` : path;
}

export function useSessionNavigation(area) {
  const pathname = usePathname();
  const query = useSearchParams();
  const id = query.get('sessao'), local = query.get('local');
  const views = paths[area];
  if (!validId(id) || !Object.values(views).some(path => path.split('?')[0] === pathname)) return undefined;
  return href => {
    const view = Object.keys(views).find(key => views[key] === href);
    return view ? sessionHref(area, view, { id_sessao:id, id_local:validId(local) ? local : null }) : href;
  };
}

export function useSessionContext(request, prefix = '') {
  const params = useSearchParams();
  const pathname = usePathname();
  const id = params.get('sessao');
  const local = params.get('local');
  const detail = usePaginatedList(validId(id) ? `${prefix}sessions/${id}` : null, request, { mode:'resource' });
  return {
    selectedId: validId(id) ? id : null,
    session: detail.data,
    loading: detail.loading,
    error: detail.error,
    reload: detail.reload,
    localId: detail.data?.id_local ?? (validId(local) ? local : ''),
    view: params.get('visao') === 'ingressos' ? 'tickets' : 'presence',
    choose(session) {
      const next = new URLSearchParams(params);
      if (session) {
        next.set('sessao', session.id_sessao);
        if (session.id_local) next.set('local', session.id_local);
      } else next.delete('sessao');
      const suffix = next.toString();
      window.history.replaceState(null, '', suffix ? `${pathname}?${suffix}` : pathname);
    }
  };
}

export default function SessionContext({ selection, area, active }) {
  const { session, loading, error, reload } = selection;
  if (loading) return <p className={styles.feedback} role="status">Carregando sessão…</p>;
  if (error) return <p className={styles.feedback} role="alert">{error} <button type="button" onClick={reload}>Tentar novamente</button></p>;
  if (!session) return null;
  return <div className="min-w-0 space-y-2">
  <section className={styles.context} aria-label="Contexto da sessão">
    <div className={styles.identity}>
      <Film size={18} aria-hidden="true" />
      <div>
        <strong>{session.titulo_filme ?? `Sessão #${session.id_sessao}`}</strong>
        <p>{session.nome_local ?? `Cinema #${session.id_local}`} · {session.nome_sala} · {session.data?.slice(0, 10)?.split('-').reverse().join('/')} às {session.horario_inicio?.slice(0, 5)} · #{session.id_sessao}</p>
      </div>
    </div>
    <nav aria-label="Seções da sessão">
      {Object.entries(labels).map(([view, label]) => <Link key={view} href={sessionHref(area, view, session)}
        prefetch={false} aria-current={active === view ? 'page' : undefined}>{label}</Link>)}
    </nav>
  </section>
  <SessionSeatInspection key={session.id_sessao} sessionId={session.id_sessao} request={area==='admin'?scheduleRequest:unitSeatRequest} />
  </div>;
}
