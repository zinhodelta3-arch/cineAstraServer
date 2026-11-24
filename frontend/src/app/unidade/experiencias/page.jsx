import { requireUnitSupervisor } from '@/lib/auth/unit-supervisor';
import ExperienceRequests from '@/components/cinema/experiencias/experience-requests';
import { validExperienceId } from '@/lib/api/experience-inquiry.mjs';

export default async function Page({ searchParams }) {
  const [user, { pedido }] = await Promise.all([requireUnitSupervisor(), searchParams]);
  const id = validExperienceId(pedido) ? pedido : null;
  return <ExperienceRequests key={id} role={user.role} userId={user.id} initialId={id} />;
}
