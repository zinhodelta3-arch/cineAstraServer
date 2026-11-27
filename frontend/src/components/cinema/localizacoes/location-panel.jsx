"use client";

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { Check, Copy, ExternalLink, MapPin, Monitor, Navigation } from 'lucide-react';
import ListStatus from '@/components/cinema/home/list-status';
import { useLocationPanel } from '@/hooks/cinema/localizacoes/use-location-panel';
import ticketStyles from '../ticket.module.css';
import { VenueImg } from './location-images';
import { Button } from './location-ui';
import Timetable from './session-timetable';
import styles from './location-panel.module.css';

export default function LocationPanel({ loc: initial, standalone = false }) {
 const { loc, date, setDate, rooms, copied, copy, copyError, loading, error, retry } = useLocationPanel(initial, standalone);
 const directionsSection = useRef(null);
 const scrolledToDirections = useRef(false);
 useEffect(() => {
  if (!standalone || rooms.loading || scrolledToDirections.current || window.location.hash !== '#como-chegar') return;
  const section = directionsSection.current;
  if (!section) return;
  section.scrollIntoView({ block: 'start' });
  scrolledToDirections.current = true;
 }, [standalone, rooms.loading]);
 if (loading) return <p role="status" className="p-6">Carregando cinema…</p>;
 if (error) return <div role="alert" className="rounded-xl border border-border bg-card p-6"><p>{error}</p><Button onClick={retry}>Tentar novamente</Button></div>;

 const address = encodeURIComponent(loc.fullAddress ?? '');
 const directions = `https://www.google.com/maps/dir/?api=1&destination=${address}`;
 const mapKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
 const map = mapKey
  ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(mapKey)}&q=${address}`
  : `https://maps.google.com/maps?q=${address}&output=embed`;
 const venueDetails = [
  loc.type !== 'Cinema' && loc.type,
  loc.eventCapacity && `Eventos para até ${loc.eventCapacity.toLocaleString('pt-BR')} pessoas`,
  loc.eventSeating,
 ].filter(Boolean).join(' · ');
 const phone = loc.phone?.replace(/\D/g, '');
 const phoneLabel = phone?.replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');

 return (
  <div className={styles.panel}>
   <div className={styles.feature}>
    <VenueImg src={loc.image || '/parcerias/sala-cinema.jpg'} kind="marquee" alt={loc.image ? `Foto de ${loc.name}` : ''} className={styles.photo} />
    <div className={styles.featureCopy}>
     <p>{loc.district || loc.type}</p>
     <h2 className={`${ticketStyles.title} ${styles.venueTitle}`}>{loc.name}</h2>
     {venueDetails && <p>{venueDetails}</p>}
    </div>
    {!loc.image && <span className={styles.caption}>Imagem ilustrativa</span>}
   </div>

   <div className={styles.details}>
    <div className={styles.info}>
     <section aria-label="Endereço">
      <h3 className={styles.infoHeading}><MapPin size={16} aria-hidden="true" />Endereço</h3>
      <address className="not-italic">
       <p className="text-lg font-bold wrap-anywhere">{loc.street}</p>
       <p className="text-sm text-muted-foreground">{[loc.district, loc.cep && `CEP ${loc.cep}`].filter(Boolean).join(' · ')}</p>
       {phone && <a href={`tel:${phone.length <= 11 ? '+55' : '+'}${phone}`} className="mt-2 inline-block text-sm hover:underline">{phoneLabel}</a>}
      </address>
      {loc.fullAddress && <div className={styles.actions}>
       {!standalone && <Link scroll={false} href={`/cinema/localizacoes/${encodeURIComponent(loc.slug ?? loc.id)}#como-chegar`} className={`${styles.button} ${styles.primary}`}>
        <Navigation size={16} aria-hidden="true" />Como chegar
       </Link>}
       <button type="button" className={styles.button} onClick={copy}>
        {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
        {copied ? 'Endereço copiado' : 'Copiar endereço'}
       </button>
      </div>}
      <p role="status" className={copyError ? styles.copyError : 'sr-only'}>{copyError || (copied ? 'Endereço copiado.' : '')}</p>
     </section>

     <section className={styles.rooms} aria-label="Salas do cinema">
      <h3 className={styles.infoHeading}><Monitor size={16} aria-hidden="true" />Salas</h3>
      {!!rooms.items.length && <ul className={styles.roomList}>
       {rooms.items.map(room => (
        <li key={room.id_sala}>
         <strong className={`${ticketStyles.title} ${styles.roomType}`}>{room.tipo}</strong>
         <span className="block text-sm font-bold wrap-anywhere">{room.nome}</span>
         <span className="block text-xs text-muted-foreground">{Number(room.capacidade).toLocaleString('pt-BR')} lugares</span>
        </li>
       ))}
      </ul>}
      {(rooms.loading || rooms.error || rooms.cursor || !rooms.items.length) && <ListStatus list={rooms} empty="Nenhuma sala disponível." more="Carregar mais salas" />}
     </section>
    </div>

    {standalone && loc.fullAddress && <section ref={directionsSection} id="como-chegar" className={`${styles.program} space-y-3`} aria-labelledby="location-map-title">
     <h3 id="location-map-title" className={`${ticketStyles.title} ${styles.sectionTitle}`}>Como chegar</h3>
     <p className="text-sm text-muted-foreground">O mapa mostra o endereço cadastrado. A rota abre o Google Maps em outra aba.</p>
     <a href={directions} target="_blank" rel="noopener noreferrer" className={`${styles.button} ${styles.primary}`}>
      Abrir rota no Google Maps <ExternalLink size={16} aria-hidden="true" /><span className="sr-only"> em nova aba</span>
     </a>
     <iframe title={`Mapa do endereço de ${loc.name}`} src={map} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" className="h-80 w-full rounded-xl border border-border sm:h-96" />
    </section>}

    <section className={styles.program} aria-label="Programação do cinema">
     <div className={styles.programHead}>
      <div>
       <h3 className={`${ticketStyles.title} ${styles.sectionTitle}`}>Programação</h3>
       <p className="mt-1 text-xs text-muted-foreground">Horários em UTC. Descontos e disponibilidade são confirmados na compra.</p>
      </div>
      <label className={styles.date}>
       Data da sessão
       <input type="date" value={date} onChange={event => setDate(event.target.value)} />
      </label>
     </div>
     {date ? <Timetable key={`${loc.id}:${date}`} loc={loc} date={date} rooms={rooms} /> : <p>Selecione uma data para consultar as sessões.</p>}
    </section>
   </div>
  </div>
 );
}
