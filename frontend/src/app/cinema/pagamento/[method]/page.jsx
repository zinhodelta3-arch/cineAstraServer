import { notFound } from 'next/navigation';
import CinemaPayment from '@/components/cinema/pagamento/cinema-payment';
import { validOrderId } from '@/lib/api/purchases.mjs';

export default async function Page({ params, searchParams }) {
  const { method } = await params;
  if (!['credito', 'debito', 'pix'].includes(method)) notFound();
  const { draft } = await searchParams;
  return <CinemaPayment method={method} draftId={validOrderId(draft) ? draft : null} />;
}
