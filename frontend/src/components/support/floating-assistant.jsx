"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Popover } from "@base-ui/react/popover";
import { Bot, Send, X } from "lucide-react";
import { useFloatingAssistant } from "@/hooks/cinema/suporte/use-floating-assistant";
import { AssistantSessionLinks } from "./assistant-session-links";
import styles from "./floating-assistant.module.css";

const SUGGESTIONS = [
  "Quais são os filmes em cartaz?",
  "Como comprar ingressos?",
  "Quais são os horários das sessões?",
  "Quais formas de pagamento são aceitas?",
];

export function FloatingAssistant({ signedIn }) {
  const { question, setQuestion, messages, needsSignIn, pending, ask } = useFloatingAssistant(signedIn);
  const [open, setOpen] = useState(false);
  const conversation = useRef(null);
  const input = useRef(null);

  useEffect(() => {
    const log = conversation.current;
    if (open && log && messages.length) log.scrollTop = log.scrollHeight;
  }, [open, messages, pending]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        type="button"
        className={styles.badge}
        data-development={process.env.NODE_ENV === "development" ? "" : undefined}
        aria-label="Assistente virtual do CineAstra"
      >
        <Bot className="size-6 shrink-0" strokeWidth={1.8} aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner className={styles.positioner} positionMethod="fixed" side="top" align="start" sideOffset={10}>
          <Popover.Popup className={styles.panel}>
            <div className={styles.filmstrip} aria-hidden="true" />
            <div className={styles.body}>
              <div className={styles.intro}>
                <span className={styles.avatar}><Bot className="size-7" aria-hidden="true" /></span>
                <div className="min-w-0 flex-1 self-center">
                  <Popover.Title className="text-base leading-tight font-bold">
                    Assistente CineAstra
                  </Popover.Title>
                  <Popover.Description className="mt-1 text-sm text-muted-foreground">
                    Atendimento virtual
                  </Popover.Description>
                </div>
                <Popover.Close type="button" className={styles.close} aria-label="Fechar assistente">
                  <X className="size-5" aria-hidden="true" />
                </Popover.Close>
              </div>

              <div className={styles.conversation} ref={conversation} role="log" aria-label="Conversa com a assistente" tabIndex={0}>
                <p className={styles.bubble}>Olá! Como posso ajudar você com o CineAstra?</p>
                {messages.length === 0 && (
                  <ul className={styles.suggestions} aria-label="Sugestões de perguntas">
                    {SUGGESTIONS.map(suggestion => (
                      <li key={suggestion}>
                        <button
                          type="button"
                          className={styles.suggestion}
                          onClick={() => {
                            setQuestion(suggestion);
                            input.current?.focus();
                          }}
                        >
                          {suggestion}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {messages.map(({ role, text, sessions, showSupport }, index) => (
                  <div key={index} className={styles.bubble} data-role={role}>
                    <p>
                      {role !== "error" && <span className="sr-only">{role === "user" ? "Você. " : "Assistente. "}</span>}
                      {text}
                    </p>
                    <AssistantSessionLinks sessions={sessions} onNavigate={() => setOpen(false)} />
                    {showSupport && (
                      <Link href="/cinema/suporte" className={styles.link} onNavigate={() => setOpen(false)}>
                        Acessar o suporte
                      </Link>
                    )}
                  </div>
                ))}
                {pending && <p className={styles.bubble} data-role="pending">Buscando uma resposta…</p>}
              </div>

              <form className={styles.composer} onSubmit={ask}>
                <div className="flex items-center gap-2">
                  <input
                    ref={input}
                    aria-label="Pergunta para a assistente"
                    className={styles.input}
                    maxLength={1000}
                    onChange={event => setQuestion(event.target.value)}
                    placeholder="Digite sua dúvida aqui"
                    value={question}
                    readOnly={pending}
                    required
                  />
                  <button type="submit" className={styles.send} aria-label="Enviar pergunta" disabled={pending || needsSignIn || !question.trim()}>
                    <Send className="size-[1.125rem]" aria-hidden="true" />
                  </button>
                </div>
                {needsSignIn && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    <Link className={styles.link} href="/auth/login">Entre na sua conta</Link> para enviar a pergunta.
                  </p>
                )}
              </form>
            </div>
            <div className={styles.filmstrip} aria-hidden="true" />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
