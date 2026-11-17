import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth/server';
import ExperienceRequests from '@/components/cinema/experiencias/experience-requests';

export default async function Page() {
  const user = await currentUser();
  if (user?.role !== 'SUPERVISOR') redirect('/unidade');
  return <ExperienceRequests role={user.role} userId={user.id} />;
}
