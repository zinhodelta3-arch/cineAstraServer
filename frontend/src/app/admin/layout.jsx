import { SessionProvider } from '@/hooks/auth/use-session';
import { redirect } from "next/navigation";
import { currentUser, sessionUserDto } from "@/lib/auth/server";
import { loginDestination } from "@/lib/auth/destination.mjs";
import AdminShell from "./admin-shell";
import { FloatingAssistant } from "@/components/support/floating-assistant";

export const metadata = {
  title: "Dashboard | CineAstra",
  description: "Visão geral do cinema CineAstra.",
};

export default async function AdminLayout({ children }) {
  const user = await currentUser();
  if (!user) redirect("/auth/login?perfil=equipe");
  if (user.role !== "ADMIN") redirect(loginDestination(user.role) || "/cinema/home");
  return <SessionProvider initialUser={sessionUserDto(user)}><AdminShell>{children}</AdminShell><FloatingAssistant key={user.id} signedIn role={user.role} /></SessionProvider>;
}
