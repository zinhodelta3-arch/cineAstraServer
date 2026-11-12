import { Header } from "@/components/header";
import Footer from "@/components/Footer";
import { redirect } from "next/navigation";
import { currentUser, publicSessionSnapshot } from "@/lib/auth/server";
import { SessionProvider } from "@/hooks/auth/use-session";
import { loginDestination } from "@/lib/auth/destination.mjs";

export default async function CinemaLayout({ children }) {
  const user = await currentUser();
  if (user?.role === "FORNECEDOR") redirect(loginDestination(user.role));

  return (
    <SessionProvider initialUser={await publicSessionSnapshot(user)}>
      <Header showAssistant />
      {children}
      <Footer />
    </SessionProvider>
  );
}
