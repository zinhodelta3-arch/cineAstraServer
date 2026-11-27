import { ArrowLeft, ArrowRight, MessageSquare, Search, X } from "lucide-react";
import { useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ticketStyles from "@/components/cinema/ticket.module.css";
import styles from "./support-cinema.module.css";

const accountActions = {
  CLIENTE: { href: "#chamados", label: "Meus chamados" },
  ADMIN: { href: "/admin/suporte", label: "Abrir fila de suporte" },
  SUPERVISOR: { href: "/unidade/suporte", label: "Abrir meus chamados" },
  COLABORADOR: { href: "/unidade/suporte", label: "Abrir meus chamados" },
  FORNECEDOR: { href: "/fornecedor/suporte", label: "Abrir meus chamados" },
};
const signIn = { href: "/auth/login?next=%2Fcinema%2Fsuporte", label: "Entrar na conta" };

export default function SupportHeader({ search, changeSearch, clearSearch, cinema, area, session }) {
  const searchInput = useRef(null);
  const streaming = area === "streaming";
  const backLink = (
    <Link href={streaming ? "/streaming/home" : "/cinema/home"} className="inline-flex min-h-10 items-center gap-2 rounded-sm text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring">
      <ArrowLeft size={16} aria-hidden="true" />
      {streaming ? "Voltar ao Streaming" : "Voltar ao início"}
    </Link>
  );
  const searchField = (
    <div className={cinema ? styles.search : "relative flex h-12 w-full max-w-[42rem] items-center"}>
      <Search size={20} className={cinema ? styles.searchIcon : "pointer-events-none absolute left-4 z-10 text-muted-foreground"} aria-hidden="true" />
      <Input
        ref={searchInput}
        className={cinema ? styles.input : "h-full rounded-[10px] border-border bg-card pr-12 pl-12 text-base shadow-none md:text-sm dark:bg-card"}
        type="search"
        value={search}
        onChange={changeSearch}
        placeholder={cinema ? "Ex.: ingresso, senha, reembolso" : "Digite uma dúvida, como “cancelamento”…"}
        aria-label="Pesquisar dúvidas"
        aria-controls="support-faq"
      />
      {search && <Button type="button" variant="ghost" size="icon"
        className="absolute right-2 size-9 rounded-full text-muted-foreground" aria-label="Limpar pesquisa"
        onClick={() => { clearSearch(); searchInput.current?.focus(); }}>
        <X size={18} aria-hidden="true" />
      </Button>}
    </div>
  );

  if (!cinema) return (
    <header className="mx-auto w-full max-w-[1120px] pb-6 sm:pb-8">
      {backLink}
      <h1 className="mt-3 text-[clamp(2rem,5vw,3rem)] leading-tight font-bold tracking-tight">Ajuda do Streaming</h1>
      <p className="mt-2 mb-5 max-w-[60ch] text-sm leading-6 text-muted-foreground">Consulte dúvidas sobre assinatura, cobrança, perfis e reprodução.</p>
      {searchField}
    </header>
  );

  const role = session.user?.role;
  const action = role ? accountActions[role] : signIn;

  return (
    <header className={styles.wrap}>
      <div className={styles.back}>{backLink}</div>
      <div className={styles.ticket}>
        <div className={styles.intro}>
          <h1 className={`${ticketStyles.title} ${styles.title}`}>Como podemos<br />te ajudar?</h1>
          <p className={styles.subtitle}>Tire dúvidas sobre suas compras, sua conta e os serviços do CineAstra.</p>
          {searchField}
        </div>
        <aside className={styles.stub} aria-labelledby="support-contact-title">
          <MessageSquare size={22} aria-hidden="true" />
          <h2 id="support-contact-title" className={ticketStyles.title}>Fale com o suporte</h2>
          {session.loading ? <p role="status">Verificando sua conta…</p> : <>
            <p>{role === "CLIENTE"
              ? "Abra um chamado ou veja as respostas do atendimento."
              : role ? "Acesse o suporte pelo painel da sua conta."
                : "Entre na sua conta para abrir chamados e acompanhar as respostas."}</p>
            {action && <Link href={action.href} className={styles.action}>
              {action.label} <ArrowRight size={16} aria-hidden="true" />
            </Link>}
          </>}
        </aside>
      </div>
    </header>
  );
}
