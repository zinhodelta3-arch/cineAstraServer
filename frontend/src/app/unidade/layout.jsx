import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth/server';
import UnitShell from './unit-shell';

export const metadata = { title: 'Minha unidade | CineAstra' };

export default async function UnitLayout({ children }) {
  const user = await currentUser();
  if (!user) redirect('/auth/login');
  if (!['SUPERVISOR', 'COLABORADOR'].includes(user.role)) redirect(user.role === 'ADMIN' ? '/admin/dashboard' : '/cinema/home');
  return <UnitShell initialUser={user}>{children}</UnitShell>;
}
