import { redirect } from 'next/navigation';
import { currentUser } from './server';

export async function requireUnitSupervisor() {
  const user = await currentUser();
  if (!user) redirect('/auth/login');
  if (user.role !== 'SUPERVISOR') redirect('/unidade');
  return user;
}

export async function requireUnitViewer() {
  const user = await currentUser();
  if (!user) redirect('/auth/login');
  if (!['SUPERVISOR','COLABORADOR'].includes(user.role)) redirect('/unidade');
  return user;
}
