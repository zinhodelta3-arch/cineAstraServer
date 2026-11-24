import { notFound } from 'next/navigation';
import RefundNoticeDetails from '@/components/purchases/refund-notice-details';
import { validOrderId } from '@/lib/api/purchases.mjs';

export default async function Page({params,searchParams}) {
  const [{id},{pedido}]=await Promise.all([params,searchParams]);
  if(!validOrderId(id))notFound();
  return <RefundNoticeDetails id={id} orderId={validOrderId(pedido)?pedido:null} />;
}
