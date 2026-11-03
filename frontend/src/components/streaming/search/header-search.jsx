"use client";

import { Suspense } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import Link from "next/link";
import { Search, X, Play } from "lucide-react";
import { Dialog, DialogPortal, DialogOverlay, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import Art from "@/components/streaming/home/art";
import useHeaderSearch from "@/hooks/streaming/search/use-header-search";
import styles from "./header-search.module.css";

function SearchField() {
  const { query, films, input, open, setOpen, loading, error, searching, change, retry, close, clear } = useHeaderSearch();
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger className={styles.trigger} aria-label="Buscar filmes">
      <Search size={18} aria-hidden="true" /><span>Buscar filmes</span>
    </DialogTrigger>
    <DialogPortal><DialogOverlay /><DialogPrimitive.Popup data-slot="dialog-content" className={styles.overlay} initialFocus={input}>
      <div className={styles.top}>
        <div className={styles.heading}>
          <DialogTitle className={styles.title}>O que vamos assistir?</DialogTitle>
          <DialogDescription className={styles.description}>Digite o nome ou parte do título de um filme.</DialogDescription>
        </div>
        <DialogClose className={styles.close} aria-label="Fechar busca"><X size={24} aria-hidden="true" /></DialogClose>
        <form className={styles.form} role="search" aria-label="Buscar no streaming" onSubmit={(event) => event.preventDefault()}>
          <Search size={24} aria-hidden="true" />
          <input ref={input} type="search" maxLength={200} aria-label="Nome do filme" placeholder="Digite o nome de um filme…"
            value={query} onChange={change} autoComplete="off" />
          {query && <button type="button" onClick={clear} aria-label="Limpar busca"><X size={20} aria-hidden="true" /></button>}
        </form>
      </div>
      <div className={styles.body}>
        {loading ? <p role="status" className={styles.message}>Carregando filmes…</p> : error ? <div role="alert" className={styles.message}>
          <p>{error}</p><button type="button" onClick={retry} className={styles.retry}>Tentar novamente</button>
        </div> : searching ? <>
          <p className={styles.count} role="status" aria-live="polite">{films.length} {films.length === 1 ? "filme encontrado" : "filmes encontrados"}</p>
          {films.length ? <div className={styles.films}>
            {films.map((movie) => <Link key={movie.id} onClick={close} className={styles.film}
              href={movie.soon ? `/streaming/busca?q=${encodeURIComponent(movie.title)}` : `/streaming/assistir/filme/${encodeURIComponent(movie.id)}`}>
              <div className={styles.poster}><Art movie={movie} variant="poster" />
                {!movie.soon && <span className={styles.play}><Play size={24} aria-hidden="true" /></span>}
              </div>
              <strong>{movie.title}</strong><span>{movie.soon ? "Em breve" : movie.duration} · {movie.genre}</span>
            </Link>)}
          </div> : <div className={styles.message}><p>Nenhum filme encontrado para “{query.trim()}”.</p><p>Tente outra palavra ou parte do título.</p></div>}
        </> : <div className={styles.message}><Search size={32} aria-hidden="true" /><p>Digite uma letra ou um nome para explorar o catálogo.</p></div>}
      </div>
    </DialogPrimitive.Popup></DialogPortal>
  </Dialog>;
}

export default function HeaderSearch() {
  return <Suspense fallback={<button type="button" className={styles.trigger} aria-label="Buscar filmes" disabled><Search size={18} aria-hidden="true" /><span>Buscar filmes</span></button>}><SearchField /></Suspense>;
}
