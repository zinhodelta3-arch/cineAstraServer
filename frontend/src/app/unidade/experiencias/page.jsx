import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth/server';
import ExperienceRequests from '@/components/cinema/experiencias/experience-requests';
import { validExperienceId } from '@/lib/api/experience-inquiry.mjs';

export default async function Page({ searchParams }) {
  const [user, { pedido }] = await Promise.all([currentUser(), searchParams]);
  if (user?.role !== 'SUPERVISOR') redirect('/unidade');
  const id = validExperienceId(pedido) ? pedido : null;
  return <ExperienceRequests key={id} role={user.role} userId={user.id} initialId={id} />;
}
