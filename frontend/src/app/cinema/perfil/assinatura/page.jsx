import ManageSubscription from '@/components/cinema/planos/manage-subscription';

export const metadata = { title: 'Gerenciar assinatura | CineAstra' };

export default async function Page({ searchParams }) {
  const { cobranca } = await searchParams;
  const paymentId = typeof cobranca === 'string' && /^[1-9]\d{0,9}$/.test(cobranca) && BigInt(cobranca) <= 4294967295n ? cobranca : undefined;
  return <ManageSubscription initialPaymentId={paymentId} />;
}
