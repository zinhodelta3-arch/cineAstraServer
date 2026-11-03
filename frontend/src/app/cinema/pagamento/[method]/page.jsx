import { notFound } from 'next/navigation';
import CinemaPayment from '@/components/cinema/pagamento/cinema-payment';

export default async function Page({ params }) {
  const { method } = await params;
  if (!['credito', 'debito', 'pix'].includes(method)) notFound();
  return <CinemaPayment method={method} />;
}
