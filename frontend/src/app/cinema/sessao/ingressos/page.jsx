import CinemaTickets from "@/components/checkout/cinema-tickets";
import { currentUser } from "@/lib/auth/server";
import { loginDestination } from "@/lib/auth/destination.mjs";
import { redirect } from "next/navigation";

export default async function Page() {
  const user = await currentUser();
  if (!user) redirect("/auth/login?next=%2Fcinema%2Fsessao%2Fingressos");
  if (user.role !== "CLIENTE") redirect(loginDestination(user.role) ?? "/cinema/home");
  return <CinemaTickets />;
}
