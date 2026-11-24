import { LoginPage } from "@/components/auth/auth-shell";
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth/server';
import { clientLoginDestination, loginDestination } from '@/lib/auth/destination.mjs';

export const metadata = {
  title: "Login | CineAstra",
  description: "Acesse sua conta CineAstra.",
};

export default async function Login({ searchParams }) {
  const user = await currentUser().catch(() => null);
  const { next: requestedNext, perfil } = await searchParams;
  const next = clientLoginDestination(requestedNext);
  const initialProfile = perfil === 'equipe' || perfil === 'fornecedor' ? perfil : 'cliente';
  const destination = loginDestination(user?.role);
  if (destination) redirect(user.role === 'CLIENTE' && next ? next : destination);
  return <LoginPage key={initialProfile} next={next} initialProfile={initialProfile} />;
}
