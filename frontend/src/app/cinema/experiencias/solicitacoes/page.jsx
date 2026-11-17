import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth/server';
import ExperienceRequests from '@/components/cinema/experiencias/experience-requests';

export default async function Page({ searchParams }) {
  const user = await currentUser();
  if (!user) redirect('/auth/login');
  if (user.role !== 'CLIENTE') redirect('/cinema/experiencias');
  const { pedido } = await searchParams;
  return <ExperienceRequests role={user.role} initialId={typeof pedido === 'string' && /^[1-9]\d{0,9}$/.test(pedido) ? pedido : null} />;
}
