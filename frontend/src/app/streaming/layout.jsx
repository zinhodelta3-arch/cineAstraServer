import StreammingHeader from "@/components/streamming-header";
import Footer from "@/components/Footer";
import { FloatingAssistant } from "@/components/support/floating-assistant";
import { currentUser } from "@/lib/auth/server";
import { loginDestination } from "@/lib/auth/destination.mjs";
import { redirect } from "next/navigation";

export default async function StreamingLayout({ children }) {
  const user = await currentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "CLIENTE") redirect(loginDestination(user.role) || "/cinema/home");
  return (
    <>
      <StreammingHeader />
      {children}
      <Footer />
      <FloatingAssistant key={user.id} signedIn />
    </>
  );
}
