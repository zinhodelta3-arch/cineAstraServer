import { SessionProvider } from '@/hooks/auth/use-session';
import { redirect } from 'next/navigation';
import { currentUser, sessionUserDto } from '@/lib/auth/server';
import { loginDestination } from '@/lib/auth/destination.mjs';
import UnitShell from './unit-shell';

export const metadata = { title: 'Minha unidade | CineAstra' };

export default async function UnitLayout({ children }) {
  const user = await currentUser();
  if (!user) redirect('/auth/login');
  if (!['SUPERVISOR', 'COLABORADOR'].includes(user.role)) redirect(loginDestination(user.role) || '/cinema/home');
  return <SessionProvider initialUser={sessionUserDto(user)}><UnitShell>{children}</UnitShell></SessionProvider>;
}
