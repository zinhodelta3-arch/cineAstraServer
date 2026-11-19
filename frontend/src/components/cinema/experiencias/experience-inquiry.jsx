'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { useSession } from '@/hooks/auth/use-session';
import { usePublicList } from '@/hooks/cinema/home/use-public-list';
import { useExperienceDetails } from '@/hooks/cinema/experiencias/use-cinema-experiences';
import { experienceRequestHref, validateExperienceInquiry } from '@/lib/api/experience-inquiry.mjs';
import { readSessionResponse, sessionFetch } from '@/lib/auth/session-response.mjs';
import { cinemaLocation, eventSeatingLabels, venueTypes } from '@/lib/api/cinema-locations.mjs';
import styles from '../ticket.module.css';

const catalogPath = '/cinema/experiencias';
const customValue = 'personalizado';
const field = 'min-h-11 w-full min-w-0 rounded-md border border-border bg-background px-3 py-2 text-sm font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';
const label = 'grid min-w-0 gap-1.5 text-sm font-semibold';

export default function ExperienceInquiry({ initialFormat }) {
  const [format, setFormat] = useState(initialFormat);
  const [location, setLocation] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(null);
  const active = useRef(null);
  const session = useSession();
  const catalog = usePublicList('/experiences?limit=12');
  const custom = format === customValue;
  const detail = useExperienceDetails(custom ? '' : format);
  const linkedLocation = detail.item?.location;
  const limit = (linkedLocation ?? location)?.eventCapacity ?? 100000;
  const minimumDate = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
  const returnPath = `${catalogPath}/solicitar${format ? `?experiencia=${format}` : ''}`;

  useEffect(() => () => active.current?.abort(), []);

  async function submit(event) {
    event.preventDefault();
    if (active.current || sent || session.user?.role !== 'CLIENTE' || (!custom && !detail.item)) return;
    const form = Object.fromEntries(new FormData(event.currentTarget));
    const input = validateExperienceInquiry({
      ...form,
      ...(custom ? {} : { experienceId: format }),
      locationId: detail.item?.locationId ?? location?.id,
      guests: Number(form.guests),
    });
    if (!input) {
      setError('Confira o formato, a data, a quantidade e a descrição do evento.');
      return;
    }
    const controller = new AbortController();
    active.current = controller;
    setPending(true);
    setError('');
    try {
      const response = await sessionFetch('/api/experiences/inquiry', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input), signal: controller.signal,
      });
      const request = await readSessionResponse(response);
      if (!controller.signal.aborted) setSent(request);
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause.message);
    } finally {
      active.current = null;
      if (!controller.signal.aborted) setPending(false);
    }
  }

  const extraOption = format && !custom && !catalog.items.some(item => item.id === format);

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-8 md:px-8 md:py-12">
      <Link href={initialFormat && initialFormat !== customValue ? `${catalogPath}/${initialFormat}` : `${catalogPath}#experiencias`}
        className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary hover:underline">
        <ArrowLeft size={16} aria-hidden="true" /> Voltar para experiências
      </Link>
      <article className={`${styles.ticket} overflow-hidden`}>
        <header className="px-5 py-6 sm:px-8 sm:py-8">
          <h1 className={`${styles.title} text-4xl font-bold leading-tight sm:text-5xl`}>Solicitar orçamento</h1>
          <p className="mt-2 max-w-[65ch] text-sm leading-6 text-muted-foreground">
            Escolha o formato e conte como será o seu evento. A equipe confirmará disponibilidade e valores após a análise.
          </p>
        </header>
        <div className={styles.tear} aria-hidden="true" />
        {sent ? <section role="status" className={`${styles.stub} px-5 py-8 sm:px-8`}>
          <CheckCircle2 size={28} className="text-primary" aria-hidden="true" />
          <h2 className="mt-3 text-xl font-bold">Solicitação enviada</h2>
          <p className="mt-2 text-sm text-muted-foreground">Protocolo {sent.protocol}. Acompanhe a resposta na área de Experiências.</p>
          <Link className={buttonVariants({ className: 'mt-5 min-h-11' })} href={experienceRequestHref(sent.id)}>Acompanhar solicitação</Link>
        </section> : <form onSubmit={submit}>
          <fieldset disabled={pending} className="grid min-w-0 gap-5 px-5 py-6 sm:px-8">
            <div className="grid gap-2">
              <label className={label}>Formato do evento
                <select required className={field} value={format} onChange={event => { setFormat(event.target.value); setError(''); }}>
                  <option value="">Selecione um formato</option>
                  <option value={customValue}>Espaço personalizado</option>
                  {extraOption && <option value={format}>{detail.item?.title ?? 'Experiência selecionada'}</option>}
                  {catalog.items.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
              </label>
              {catalog.loading && <p role="status" className="text-sm text-muted-foreground">Carregando formatos…</p>}
              {catalog.error && <div className="text-sm" role="alert"><p>{catalog.error}</p>
                <Button type="button" variant="outline" onClick={catalog.items.length ? catalog.loadMore : catalog.retry} className="mt-2">Tentar novamente</Button>
              </div>}
              {catalog.cursor && !catalog.error && <Button type="button" variant="outline" disabled={catalog.loading} onClick={catalog.loadMore} className="w-fit">Mais formatos do catálogo</Button>}
              {detail.loading && <p role="status" className="text-sm">Consultando experiência…</p>}
              {detail.error && <div className="text-sm" role="alert"><p>{detail.error}</p>
                <Button type="button" variant="outline" onClick={detail.retry} className="mt-2">Tentar novamente</Button>
              </div>}
            </div>
            {custom && <label className={label}>Que espaço você precisa?
              <input name="customSpace" required minLength={3} maxLength={150} placeholder="Ex.: Cinema ao ar livre para uma confraternização" className={field} />
            </label>}
            {linkedLocation ? <div className="border-y border-dashed border-border py-3">
              <p className="text-sm font-semibold">Unidade da experiência</p>
              <LocationSummary location={{ ...linkedLocation, type: venueTypes[linkedLocation.type],
                eventSeating: eventSeatingLabels[linkedLocation.eventSeating] }} />
            </div> : <LocationChoice location={location} onChange={setLocation} />}
            <div className="grid gap-4 sm:grid-cols-3">
              <label className={label}>Data desejada<input name="date" type="date" required min={minimumDate} className={field} /></label>
              <label className={label}>Horário (opcional)<input name="time" type="time" className={field} /></label>
              <label className={label}>{custom || linkedLocation || location ? 'Quantidade de participantes' : 'Pessoas ou veículos'}
                <input name="guests" type="number" required min="1" max={limit} className={field} />
              </label>
            </div>
            <label className={label}>Descrição do evento
              <textarea name="details" required minLength={10} maxLength={4000} rows={4} placeholder="Informe o objetivo, a duração e, se já tiver um local em mente, a cidade ou o endereço." className={`${field} resize-y`} />
            </label>
            <label className={label}>Requisitos de estrutura (opcional)
              <span className="text-sm font-normal text-muted-foreground">A equipe vai avaliar a disponibilidade de recursos como projeção, som e acessibilidade.</span>
              <textarea name="requirements" maxLength={1000} rows={3} className={`${field} resize-y`} />
            </label>
            <label className={label}>Preferências (opcional)
              <textarea name="preferences" maxLength={1000} rows={2} className={`${field} resize-y`} />
            </label>
          </fieldset>
          <div className={styles.tear} aria-hidden="true" />
          <div className={`${styles.stub} px-5 py-5 sm:px-8`}>
            {error && <p role="alert" className="mb-3 text-sm text-destructive">{error}</p>}
            {session.loading ? <p role="status" className="text-sm">Consultando sua conta…</p> : session.user?.role === 'CLIENTE' ?
              <Button type="submit" disabled={pending || (!custom && !detail.item)} className="min-h-11 w-full px-4 sm:w-auto">
                {pending ? 'Enviando…' : 'Enviar solicitação'} <ArrowRight size={16} aria-hidden="true" />
              </Button> : session.user ? <p className="text-sm">Use uma conta de cliente para enviar a solicitação.</p> :
              <Link className={buttonVariants({ className: 'min-h-11 w-full px-4 sm:w-auto' })} href={`/auth/login?next=${encodeURIComponent(returnPath)}`}>Entrar para solicitar</Link>}
          </div>
        </form>}
      </article>
    </main>
  );
}

function LocationSummary({ location }) {
  const resources = [location.type, location.eventCapacity && `Até ${location.eventCapacity.toLocaleString('pt-BR')} pessoas`, location.eventSeating].filter(Boolean);
  return <p className="mt-1 text-sm text-muted-foreground">{[location.name, ...resources].join(' · ')}</p>;
}

function LocationChoice({ location, onChange }) {
  const [open, setOpen] = useState(Boolean(location));
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const locations = usePublicList(open ? `/locations?limit=20${query ? `&q=${encodeURIComponent(query)}` : ''}` : null);
  return <div className="grid gap-2 border-y border-dashed border-border py-4">
    {open ? <>
      <div className="flex flex-wrap items-end gap-2">
        <label className={`${label} grow`}>Buscar unidade
          <input type="search" className={field} placeholder="Nome ou cidade" maxLength={150} value={search} onChange={event => setSearch(event.target.value)}
            onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); setQuery(search.trim()); } }} />
        </label>
        <Button type="button" variant="outline" className="min-h-11" onClick={() => setQuery(search.trim())}>Buscar</Button>
      </div>
      <label className={label}>Unidade preferida (opcional)
        <select className={field} value={location?.id ?? ''} onChange={event => {
          const item = locations.items.find(row => String(row.id_local) === event.target.value);
          onChange(item ? cinemaLocation(item) : event.target.value ? location : null);
        }}>
          <option value="">Sem unidade definida</option>
          {location && !locations.items.some(row => String(row.id_local) === location.id) && <option value={location.id}>{location.name}</option>}
          {locations.items.map(row => <option key={row.id_local} value={row.id_local}>{row.nome} · {row.cidade}, {row.estado}</option>)}
        </select>
      </label>
      {locations.loading && <p className="text-sm" role="status">Consultando unidades…</p>}
      {locations.error && <div role="alert"><p>{locations.error}</p><Button type="button" variant="outline" onClick={locations.items.length ? locations.loadMore : locations.retry}>Tentar novamente</Button></div>}
      {!locations.loading && !locations.error && !locations.items.length && <p className="text-sm">Nenhuma unidade encontrada.</p>}
      {locations.cursor && !locations.error && <Button type="button" variant="outline" disabled={locations.loading} className="w-fit" onClick={locations.loadMore}>Mais unidades</Button>}
    </> : <Button type="button" variant="outline" className="min-h-11 w-fit" onClick={() => setOpen(true)}>Escolher unidade (opcional)</Button>}
    {location ? <LocationSummary location={location} /> : <p className="text-sm text-muted-foreground">Sem unidade definida, a equipe fará a triagem do pedido.</p>}
  </div>;
}
