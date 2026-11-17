'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePublicList } from '@/hooks/cinema/home/use-public-list';
import { readSessionResponse, sessionFetch } from '@/lib/auth/session-response.mjs';

const root = '/api/experiences/requests';
const labels = {
  RECEBIDA: 'Recebida', EM_ANALISE: 'Em análise', PROPOSTA_ENVIADA: 'Proposta enviada',
  CONCLUIDA: 'Concluída', CANCELADA: 'Cancelada',
};
const stages = {
  RECEBIDA: ['EM_ANALISE', 'CANCELADA'], EM_ANALISE: ['PROPOSTA_ENVIADA', 'CONCLUIDA', 'CANCELADA'],
  PROPOSTA_ENVIADA: ['EM_ANALISE', 'CONCLUIDA', 'CANCELADA'], CONCLUIDA: [], CANCELADA: [],
};
const field = 'min-h-11 w-full rounded-lg border border-border bg-background p-2 text-foreground';
const endpoint = (id, cursor) => root + (id ? '/' + id : '') + (cursor ? '?cursor=' + cursor : '');
async function request(path, options) {
  return readSessionResponse(await sessionFetch(path, { cache: 'no-store', ...options }));
}

export default function ExperienceRequests({ role, userId, initialId }) {
  const [list, setList] = useState(null);
  const [selected, setSelected] = useState(initialId);
  const [revision, refresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const client = role === 'CLIENTE';

  useEffect(() => {
    const controller = new AbortController();
    request(root, { signal: controller.signal }).then(data => {
      if (!controller.signal.aborted) setList(data);
    }).catch(cause => { if (!controller.signal.aborted) setError(cause.message); });
    return () => controller.abort();
  }, [revision]);

  async function more() {
    setBusy(true);
    setError('');
    try {
      const next = await request(endpoint(null, list.nextCursor));
      setList({ ...next, items: [...list.items, ...next.items] });
    } catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  }

  return <section className="mx-auto w-full max-w-6xl px-4 py-10 text-foreground md:px-8">
    {client && <Link className="text-primary underline" href="/cinema/experiencias">Voltar ao catálogo de experiências</Link>}
    <h1 className="f-display mb-6 mt-3 text-4xl font-bold">{client ? 'Minhas experiências' : 'Solicitações de experiências'}</h1>
    {error && <div role="alert"><p>{error}</p><Button variant="outline" onClick={() => { setError(''); refresh(value => value + 1); }}>Tentar novamente</Button></div>}
    {!list && !error && <p role="status">Carregando solicitações…</p>}
    {list && <div className="grid items-start gap-6 lg:grid-cols-[minmax(230px,1fr)_2fr]">
      <ul className="space-y-2" aria-label="Solicitações">
        {!list.items.length && <li>Nenhuma solicitação disponível.</li>}
        {list.items.map(item => <li key={item.id}>
          <button type="button" aria-pressed={selected === item.id} onClick={() => setSelected(item.id)}
            className="grid w-full gap-1 rounded-lg border border-border bg-card p-4 text-left hover:border-primary aria-pressed:border-primary">
            <span className="text-sm text-primary">{item.protocol}</span><strong>{item.title}</strong>
            <span className="text-sm text-muted-foreground">{labels[item.status]} · {item.location || 'Aguardando unidade'}</span>
          </button>
        </li>)}
        {list.nextCursor && <li><Button variant="outline" disabled={busy} onClick={more}>Carregar mais solicitações</Button></li>}
      </ul>
      {selected && <RequestDetails key={selected} id={selected} role={role} userId={userId} onUpdate={() => refresh(value => value + 1)} />}
    </div>}
  </section>;
}

function RequestDetails({ id, role, userId, onUpdate }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [revision, refresh] = useState(0);
  const locations = usePublicList(role === 'ADMIN' ? '/locations?limit=100' : null);

  useEffect(() => {
    const controller = new AbortController();
    request(endpoint(id), { signal: controller.signal }).then(value => {
      if (!controller.signal.aborted) setData(value);
    }).catch(cause => { if (!controller.signal.aborted) setError(cause.message); });
    return () => controller.abort();
  }, [id, revision]);

  async function run(operation) {
    setBusy(true);
    setError('');
    try { await operation(); }
    catch (cause) { setError(cause.message); }
    finally { setBusy(false); }
  }

  async function submit(body, messageForm) {
    await request(endpoint(id) + (messageForm ? '/messages' : ''), {
      method: messageForm ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    refresh(value => value + 1);
    onUpdate();
  }

  function send(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = new FormData(form).get('message').trim();
    if (message) void run(async () => { await submit({ message }, true); form.reset(); });
  }

  const nextStages = data ? stages[data.status] : [];
  return <article aria-label="Detalhes da solicitação" className="min-w-0 space-y-4 rounded-xl border border-border bg-card p-5">
    {error && <div role="alert"><p>{error}</p>{!data && <Button variant="outline" onClick={() => { setError(''); refresh(value => value + 1); }}>Tentar novamente</Button>}</div>}
    {!data && !error && <p role="status">Carregando solicitação…</p>}
    {data && <>
      <header><p className="text-sm font-medium text-primary">{data.protocol} · {labels[data.status]}</p><h2 className="text-2xl font-bold">{data.title}</h2></header>
      <p>{data.date.split('-').reverse().join('/')}{data.time && ' às ' + data.time} · {data.guests} participante(s) ou veículos</p>
      <p className="text-muted-foreground">{data.location || 'Aguardando encaminhamento a uma unidade'}</p>
      <p className="whitespace-pre-wrap break-words">{data.details}</p>
      {data.preferences && <p className="whitespace-pre-wrap break-words"><strong>Preferências</strong><br />{data.preferences}</p>}
      {role !== 'CLIENTE' && nextStages.length > 0 && <div className="grid gap-3 border-y border-border py-4 sm:grid-cols-2">
        <label>Atualizar status<select className={field} value="" disabled={busy} onChange={event => {
          const status = event.target.value;
          if (status) void run(() => submit({ status }));
        }}><option value="">Selecionar status</option>{nextStages.map(status => <option key={status} value={status}>{labels[status]}</option>)}</select></label>
        {role === 'ADMIN' && <label>Encaminhar para unidade<select className={field} value={data.locationId || ''} disabled={busy || locations.loading} onChange={event => {
          const locationId = event.target.value;
          if (locationId) void run(() => submit({ locationId }));
        }}><option value="">Selecionar unidade</option>{locations.items.map(location => <option key={location.id_local} value={location.id_local}>{location.nome}</option>)}</select></label>}
        {role === 'ADMIN' && locations.error && <p role="alert">{locations.error}</p>}
        {role === 'ADMIN' && locations.cursor && <Button variant="outline" disabled={locations.loading} onClick={locations.loadMore}>Carregar mais unidades</Button>}
        {role === 'SUPERVISOR' && data.canClaim && <Button disabled={busy} onClick={() => run(() => submit({ supervisorId: userId }))}>Assumir solicitação</Button>}
      </div>}
      <section aria-label="Histórico da solicitação">
        <h3 className="mb-2 font-bold">Histórico e mensagens</h3>
        <ol className="space-y-2">{data.events.map(event => <li key={event.id} className="break-words rounded-lg border border-border p-3">
          <small className="text-muted-foreground">{event.type === 'MENSAGEM' ? (event.sender === 'CLIENTE' ? 'Cliente' : 'Equipe') : 'Atualização'} · {new Date(event.createdAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</small>
          <p className="whitespace-pre-wrap">{event.type === 'STATUS' ? labels[event.text] : event.text}</p>
        </li>)}</ol>
        {data.nextCursor && <Button type="button" variant="outline" className="mt-2" disabled={busy} onClick={() => run(async () => {
          const next = await request(endpoint(id, data.nextCursor));
          setData({ ...data, events: [...data.events, ...next.events], nextCursor: next.nextCursor });
        })}>Carregar eventos anteriores</Button>}
      </section>
      {nextStages.length > 0 && <form onSubmit={send} className="grid gap-2">
        <label>Nova mensagem<textarea className={field} name="message" required maxLength={4000} rows={3} disabled={busy} /></label>
        <Button type="submit" disabled={busy} className="w-fit">Enviar mensagem</Button>
      </form>}
    </>}
  </article>;
}
