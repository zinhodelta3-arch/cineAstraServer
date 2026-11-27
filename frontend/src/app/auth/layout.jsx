import { Header } from "@/components/header";
import Footer from "@/components/Footer";
import { currentUser, publicSessionSnapshot } from "@/lib/auth/server";
import { SessionProvider } from "@/hooks/auth/use-session";
import { StreamingAccessProvider } from "@/hooks/cinema/use-streaming-access";
import { CartProvider } from "@/components/cart/cart-provider";

export default async function AuthLayout({ children }) {
  const user = await currentUser().catch(() => undefined);
  return (
    <SessionProvider initialUser={await publicSessionSnapshot(user)}>
      <CartProvider>
        <StreamingAccessProvider>
          <Header />
        </StreamingAccessProvider>
        {children}
        <Footer />
      </CartProvider>
    </SessionProvider>
  );
}
