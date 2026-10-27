"use client";

import useCinemaProfile from "@/hooks/cinema/perfil/use-cinema-profile";
import "./cinema-profile.css";
import { ArrowLeft, ArrowRight, Check, Film, LockKeyhole, LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DialogClose } from "@/components/ui/dialog";
import { actionClass } from "./profile-utils";
import Modal from "./modal";
import PasswordModal from "./password-modal";
import ProfileFavorites from "./profile-favorites";
import ProfileHistory from "./profile-history";
import ProfileTickets from "./profile-tickets";
import ProfileOverview from "./profile-overview";
import ProfileWallet from "./profile-wallet";

export default function CinemaProfilePage() {
  const { profile, favorites, cards, cardsExpanded, selectedPurchase, setSelectedPurchase, historyOpen, setHistoryOpen, notice, removedFavorite, signedOut, notify, removeFavorite, setDefault, removeCard, returnToDemo, restoreFavorite, closePurchase, signOut, saveProfile, toggleCards, expandCards, addCard } = useCinemaProfile();
  return <div className="ca-profile min-h-screen bg-background text-foreground">
    {signedOut ? <main className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 text-center"><Film className="mb-5 size-10 text-primary" /><h1 className="ca-display text-5xl font-black uppercase">Até a próxima sessão.</h1><p className="mt-4 text-sm text-muted-foreground">Você saiu da sessão demonstrativa. A autenticação real será conectada ao projeto.</p><Button className={`${actionClass} mt-8`} onClick={returnToDemo}>Voltar à demonstração<ArrowRight className="size-4" /></Button></main> : <main className="mx-auto max-w-[1440px] px-5 pt-8 pb-12 sm:px-8 lg:px-12 lg:pt-10">
      <a href="/cinema" className="mb-7 inline-flex items-center gap-2 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-primary"><ArrowLeft className="size-3.5" />Voltar ao cinema</a>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-3 flex items-center gap-2 text-[10px] font-bold tracking-[0.22em] text-primary uppercase"><Sparkles className="size-3.5" />Sua experiência de cinema</p><h1 className="ca-display text-5xl leading-[0.95] font-black uppercase sm:text-6xl lg:text-7xl">Minha <span className="text-primary">conta.</span></h1><p className="mt-3 text-xs text-muted-foreground">Seus filmes, suas sessões. Tudo em um só lugar.</p></div><span className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-[10px] text-muted-foreground"><span className="size-1.5 rounded-full bg-primary" />Perfil de cinema</span></div>
      <div className="ca-perf mb-7" aria-hidden="true" />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
        <div className="order-2 min-w-0 space-y-6 lg:order-1 lg:pr-8 lg:border-r lg:border-dashed lg:border-border">
          <div className="grid gap-6 xl:grid-cols-[1.12fr_1fr]">
            <ProfileFavorites favorites={favorites} removeFavorite={removeFavorite} removedFavorite={removedFavorite} restoreFavorite={restoreFavorite} />
            <ProfileHistory selectedPurchase={selectedPurchase} setSelectedPurchase={setSelectedPurchase} closePurchase={closePurchase} historyOpen={historyOpen} setHistoryOpen={setHistoryOpen} />
          </div>
          <ProfileTickets />
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"><PasswordModal onSuccess={notify} /><Modal trigger={<Button variant="ghost" className="h-9 rounded-full px-3 text-xs text-muted-foreground hover:text-destructive"><LogOut className="size-3.5" />Sair da conta</Button>} title="Sair da conta?" description="Você pode voltar à sessão demonstrativa a qualquer momento."><div className="flex justify-end gap-2"><DialogClose render={<Button variant="outline" className={actionClass}>Continuar aqui</Button>} /><DialogClose render={<Button className={actionClass} onClick={signOut}>Sair da demonstração</Button>} /></div></Modal></div>
        </div>
        <aside aria-label="Informações pessoais e cartões" className="order-1 space-y-5 lg:order-2">
          <ProfileOverview profile={profile} saveProfile={saveProfile} favorites={favorites} />
          <ProfileWallet cards={cards} cardsExpanded={cardsExpanded} toggleCards={toggleCards} expandCards={expandCards} setDefault={setDefault} removeCard={removeCard} addCard={addCard} />
          <p className="flex items-start gap-2 px-1 text-[10px] leading-relaxed text-muted-foreground"><LockKeyhole className="mt-0.5 size-3 shrink-0" />Suas informações pessoais ficam reunidas nesta área da conta.</p>
        </aside>
      </div>
      <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-[10px] text-muted-foreground"><span className="ca-display text-lg tracking-wide">CINE<span className="text-primary">ASTRA</span></span><span>Uma boa história começa com um ingresso.</span><span>Protótipo · dados fictícios</span></footer>
    </main>}
    <div aria-live="polite" aria-atomic="true" className="pointer-events-none fixed right-5 bottom-5 left-5 z-[80] flex justify-center">{notice && <p className="flex max-w-lg items-start gap-2 rounded-xl border border-primary/30 bg-card px-5 py-3 text-xs text-card-foreground shadow-xl"><Check className="mt-0.5 size-4 shrink-0 text-primary" />{notice}</p>}</div>
  </div>;
}
