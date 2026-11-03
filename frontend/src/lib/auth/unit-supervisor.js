import { redirect } from 'next/navigation';
import { currentUser } from './server';

export async function requireUnitSupervisor() {
  const user = await currentUser();
  if (!user) redirect('/auth/login');
  if (user.role !== 'SUPERVISOR') redirect('/unidade');
  return user;
}
