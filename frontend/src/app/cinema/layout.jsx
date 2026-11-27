import { Header } from "@/components/header";
import Footer from "@/components/Footer";
import { redirect } from "next/navigation";
import { currentUser, publicSessionSnapshot } from "@/lib/auth/server";
import { SessionProvider } from "@/hooks/auth/use-session";
import { StreamingAccessProvider } from "@/hooks/cinema/use-streaming-access";
import { loginDestination } from "@/lib/auth/destination.mjs";
import { AccountPreferencesProvider } from "@/components/providers/account-preferences-provider";
import { AccessibilityMenu } from "@/components/accessibility-menu";
import { CartProvider } from "@/components/cart/cart-provider";
import { CinemaLocationProvider } from "@/components/providers/cinema-location-provider";

export default async function CinemaLayout({ children }) {
  const user = await currentUser();
  if (user?.role === "FORNECEDOR") redirect(loginDestination(user.role));

  return (
    <SessionProvider initialUser={await publicSessionSnapshot(user)}>
      <CartProvider>
        <AccountPreferencesProvider userId={user?.role === "CLIENTE" ? user.id : null}>
          <AccessibilityMenu />
          <CinemaLocationProvider>
            <StreamingAccessProvider>
              <Header showAssistant />
              {children}
            </StreamingAccessProvider>
          </CinemaLocationProvider>
          <Footer />
        </AccountPreferencesProvider>
      </CartProvider>
    </SessionProvider>
  );
}
