import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth/server';
import ExperienceRequests from '@/components/cinema/experiencias/experience-requests';
import { experienceRequestHref, validExperienceId } from '@/lib/api/experience-inquiry.mjs';

export default async function Page({ searchParams }) {
  const [user, { pedido }] = await Promise.all([currentUser(), searchParams]);
  const id = validExperienceId(pedido) ? pedido : null;
  if (!user) redirect(id ? `/auth/login?next=${encodeURIComponent(experienceRequestHref(id))}` : '/auth/login');
  if (id && user.role === 'ADMIN') redirect(`/admin/marketing/solicitacoes-experiencias?pedido=${id}`);
  if (id && user.role === 'SUPERVISOR') redirect(`/unidade/experiencias?pedido=${id}`);
  if (user.role !== 'CLIENTE') redirect('/cinema/experiencias');
  return <ExperienceRequests key={id} role={user.role} initialId={id} />;
}
