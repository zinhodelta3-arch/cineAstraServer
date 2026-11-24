import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { areaDestinations } from '../area-destinations';

export const metadata = { title: 'Áreas de trabalho | Administração CineAstra' };

export default async function AdminAreas({ searchParams }) {
  const { area } = await searchParams;
  const areas = area === 'unidade'
    ? areaDestinations.filter(entry => entry.id !== 'fornecedor')
    : areaDestinations.filter(entry => !areaDestinations.some(item => item.id === area) || entry.id === area);

  return (
    <main id="admin-content" className="mx-auto w-full max-w-4xl px-5 pb-12 sm:px-8">
      <Link href="/admin/dashboard" className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
        <ArrowLeft size={16} aria-hidden="true" /> Voltar à Administração
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">Áreas de trabalho</h1>
      <p className="mt-2 text-sm text-muted-foreground">Abra as telas de cada área com seu perfil de administrador.</p>
      <div className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {areas.map(({ id, label, links }) => (
          <section key={id} aria-labelledby={id} className="grid gap-2 px-4 py-3 sm:grid-cols-[9rem_1fr] sm:gap-6 sm:px-6">
            <h2 id={id} className="py-2 text-sm font-semibold text-foreground">{label}</h2>
            <ul className="m-0 grid list-none divide-y divide-dashed divide-border p-0">
              {links.map(link => (
                <li key={link.href}>
                  <Link href={{ pathname: link.href, query: { area: id } }} prefetch={false} className="flex min-h-11 items-center justify-between gap-3 rounded-md px-2 text-sm font-medium hover:bg-muted hover:text-foreground">
                    {link.label}
                    <ArrowRight size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      {areas.length < areaDestinations.length && (
        <Link href="/admin/areas" className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-primary hover:underline">Ver todas as áreas</Link>
      )}
    </main>
  );
}
