import StreamingPlayerProvider, { StreamingPlayerSurface } from "@/components/streaming/home/streaming-player-provider";
import StreamingDetailsProvider from "@/components/streaming/home/streaming-details-provider";
import StreammingHeader from "@/components/streamming-header";
import Footer from "@/components/Footer";
import { FloatingAssistant } from "@/components/support/floating-assistant";
import { currentUser, sessionUserDto } from "@/lib/auth/server";
import { SessionProvider } from "@/hooks/auth/use-session";
import { loginDestination } from "@/lib/auth/destination.mjs";
import { redirect } from "next/navigation";
import { AccountPreferencesProvider } from "@/components/providers/account-preferences-provider";
import { AccessibilityMenu } from "@/components/accessibility-menu";
import watch from "@/components/streaming/watch/film-watch.module.css";

export default async function StreamingLayout({ children }) {
  const user = await currentUser();
  if (!user) redirect("/auth/login");
  if (user.role !== "CLIENTE") redirect(loginDestination(user.role) || "/cinema/home");
  return (
    <SessionProvider initialUser={sessionUserDto(user)}>
      <AccountPreferencesProvider userId={user.id}>
        <AccessibilityMenu />
        <StreamingPlayerProvider>
          <StreamingDetailsProvider>
            <div className={watch.screen}>
              <StreammingHeader />
              <StreamingPlayerSurface />
              {children}
            </div>
          </StreamingDetailsProvider>
          <Footer supportHref="/streaming/suporte" />
          <FloatingAssistant key={user.id} signedIn supportHref="/streaming/suporte" />
        </StreamingPlayerProvider>
      </AccountPreferencesProvider>
    </SessionProvider>
  );
}
