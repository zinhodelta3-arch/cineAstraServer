import { SessionProvider } from '@/hooks/auth/use-session';
import { redirect } from 'next/navigation';
import { currentUser, sessionUserDto } from '@/lib/auth/server';
import { loginDestination } from '@/lib/auth/destination.mjs';
import SupplierShell from './supplier-shell';
import { FloatingAssistant } from '@/components/support/floating-assistant';

export const metadata = { title: 'Fornecedor | CineAstra' };

export default async function SupplierLayout({ children }) {
  const user = await currentUser();
  if (!user) redirect('/auth/login?perfil=fornecedor');
  if (user.role === 'ADMIN') redirect('/admin/areas?area=fornecedor');
  if (user.role !== 'FORNECEDOR') redirect(loginDestination(user.role) || '/cinema/home');
  return <SessionProvider initialUser={sessionUserDto(user)}><SupplierShell>{children}</SupplierShell><FloatingAssistant key={user.id} signedIn role={user.role} /></SessionProvider>;
}
