import { Header } from "@/components/header";
import Footer from "@/components/Footer";
import { currentUser, publicSessionSnapshot } from "@/lib/auth/server";
import { SessionProvider } from "@/hooks/auth/use-session";

export default async function AuthLayout({ children }) {
  const user = await currentUser().catch(() => undefined);
  return (
    <SessionProvider initialUser={await publicSessionSnapshot(user)}>
      <Header />
      {children}
      <Footer />
    </SessionProvider>
  );
}
