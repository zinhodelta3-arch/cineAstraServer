import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth/server';
import SupplierShell from './supplier-shell';

export const metadata = { title: 'Fornecedor | CineAstra' };

export default async function SupplierLayout({ children }) {
  const user = await currentUser();
  if (!user) redirect('/auth/login');
  if (user.role !== 'FORNECEDOR') redirect(user.role === 'ADMIN' ? '/admin/dashboard' : ['SUPERVISOR', 'COLABORADOR'].includes(user.role) ? '/unidade' : '/cinema/home');
  return <SupplierShell initialUser={user}>{children}</SupplierShell>;
}
