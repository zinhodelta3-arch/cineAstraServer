import { SessionProvider } from '@/hooks/auth/use-session';
import { redirect } from "next/navigation";
import { currentUser, sessionUserDto } from "@/lib/auth/server";
import { loginDestination } from "@/lib/auth/destination.mjs";
import AdminShell from "./admin-shell";

export const metadata = {
  title: "Dashboard | CineAstra",
  description: "Visão geral do cinema CineAstra.",
};

export default async function AdminLayout({ children }) {
  const user = await currentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "ADMIN") redirect(loginDestination(user.role) || "/cinema/home");
  return <SessionProvider initialUser={sessionUserDto(user)}><AdminShell>{children}</AdminShell></SessionProvider>;
}
