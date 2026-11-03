import { LoginPage } from "@/components/auth/auth-shell";
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth/server';
import { loginDestination } from '@/lib/auth/destination.mjs';

export const metadata = {
  title: "Login | CineAstra",
  description: "Acesse sua conta CineAstra.",
};

export default async function Login() {
  const user = await currentUser().catch(() => null);
  const destination = loginDestination(user?.role);
  if (destination) redirect(destination);
  return <LoginPage />;
}
