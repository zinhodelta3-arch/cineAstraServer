import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/server";
import AdminShell from "./admin-shell";

export const metadata = {
  title: "Dashboard | CineAstra",
  description: "Visão geral do cinema CineAstra.",
};

export default async function AdminLayout({ children }) {
  const user = await currentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "ADMIN") redirect(user.role === "SUPERVISOR" ? "/auth/login" : "/cinema/home");
  return <AdminShell>{children}</AdminShell>;
}
