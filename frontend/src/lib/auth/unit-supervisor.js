import { redirect } from 'next/navigation';
import { currentUser } from './server';
import { loginDestination } from './destination.mjs';

export async function requireUnitSupervisor() {
  const user = await requireUnitViewer();
  if (user.role !== 'SUPERVISOR') redirect('/unidade');
  return user;
}

export async function requireUnitViewer() {
  const user = await currentUser();
  if (!user) redirect('/auth/login?perfil=equipe');
  if (user.role === 'ADMIN') redirect('/admin/areas?area=unidade');
  if (!['SUPERVISOR', 'COLABORADOR'].includes(user.role)) redirect(loginDestination(user.role) || '/cinema/home');
  return user;
}
