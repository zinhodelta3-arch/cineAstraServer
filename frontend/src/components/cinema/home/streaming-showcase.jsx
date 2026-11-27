"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, TvMinimalPlay } from "lucide-react";
import useStreamingAccess from "@/hooks/cinema/use-streaming-access";
import styles from "./streaming-showcase.module.css";

export default function StreamingShowcase() {
  const canAccessStreaming = useStreamingAccess();

  return (
    <section className="mx-auto max-w-[1600px] px-5 py-12 md:px-8 md:py-16" aria-labelledby="home-streaming-title">
      <div className={styles.ticket}>
        <div className={styles.copy}>
          <h2 id="home-streaming-title" className={`f-display ${styles.title}`}>
            A próxima sessão <span>é na sua casa.</span>
          </h2>
          <p className="text-muted-foreground">
            No <strong className="text-foreground">CineAstra Streaming</strong>, você explora o catálogo de filmes,
            monta sua lista e retoma de onde parou.{!canAccessStreaming && " Escolha um plano com acesso para assistir."}
          </p>
          <Link
            href={canAccessStreaming ? "/streaming" : "/cinema/planos"}
            prefetch={false}
            className="mt-6 inline-flex min-h-12 items-center gap-3 rounded-md bg-primary px-5 py-2.5 font-extrabold text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            {canAccessStreaming ? "Abrir Streaming" : "Ver planos"}
            <ArrowRight className="size-[18px]" aria-hidden="true" />
          </Link>
        </div>
        <figure className={styles.catalog}>
          <div className={styles.screenTicket}>
            <Image
              src="/streaming/catalogo-demonstracao.webp"
              alt="Grade de filmes do CineAstra Streaming com os pôsteres do catálogo"
              width={1004}
              height={574}
              unoptimized
              className="block h-auto w-full rounded-sm bg-background"
            />
          </div>
          <figcaption className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <TvMinimalPlay className="size-4 shrink-0 text-primary" aria-hidden="true" />
            Catálogo do CineAstra Streaming
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
