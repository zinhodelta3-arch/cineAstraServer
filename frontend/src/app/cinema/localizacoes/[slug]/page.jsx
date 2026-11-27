import Link from 'next/link';
import { permanentRedirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { catalogRecord } from '@/lib/api/catalog-record';
import { cinemaLocation } from '@/lib/api/cinema-locations.mjs';
import LocationPanel from '@/components/cinema/localizacoes/location-panel';
import CinemaStyles from '@/components/cinema/localizacoes/cinema-styles';

export default async function CinemaLocationPage({ params }) {
  const { slug } = await params;
  const record = await catalogRecord('locations', slug);
  if (record.slug && slug !== record.slug) permanentRedirect(`/cinema/localizacoes/${encodeURIComponent(record.slug)}`);
  const loc = cinemaLocation(record);
  return <main className="ca-root mx-auto w-full max-w-5xl space-y-5 px-5 py-10 sm:px-8">
    <CinemaStyles />
    <Link href="/cinema/localizacoes" className="inline-flex min-h-10 items-center gap-2 font-semibold text-primary hover:underline">
      <ArrowLeft size={16} aria-hidden="true"/> Todos os cinemas
    </Link>
    <LocationPanel loc={loc} standalone />
  </main>;
}
