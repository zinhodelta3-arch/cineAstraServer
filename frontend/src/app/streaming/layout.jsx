import StreammingHeader from "@/components/streamming-header";
import Footer from "@/components/Footer";
import { FloatingAssistant } from "@/components/support/floating-assistant";
import { currentUser, sessionUserDto } from "@/lib/auth/server";
import { SessionProvider } from "@/hooks/auth/use-session";
import { loginDestination } from "@/lib/auth/destination.mjs";
import { redirect } from "next/navigation";

export default async function StreamingLayout({ children }) {
  const user = await currentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "CLIENTE") redirect(loginDestination(user.role) || "/cinema/home");
  return (
    <SessionProvider initialUser={sessionUserDto(user)}>
      <StreammingHeader />
      {children}
      <Footer />
      <FloatingAssistant key={user.id} signedIn />
    </SessionProvider>
  );
}
