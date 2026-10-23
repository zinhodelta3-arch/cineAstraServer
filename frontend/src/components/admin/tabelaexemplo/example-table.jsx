"use client";

import { useRef } from "react";
import { CalendarDays, Film, Plus, Search, Ticket, Pencil, Trash2 } from "lucide-react";
import { useExampleTable } from "@/hooks/use-example-table";
import { statuses } from "./data";
import MovieDialogs from "./movie-dialogs";
import styles from "./example-table.module.css";

export default function ExampleTable() {
  const table = useExampleTable();
  const createButton = useRef(null);
  const returnFocus = useRef(null);
  const metrics = [
    { label: "Filmes cadastrados", value: table.movies.length, note: "Todos os registros da demonstração", icon: Film },
    { label: "Em cartaz", value: table.showing, note: "Filmes na programação atual", icon: Ticket },
    { label: "Em breve", value: table.upcoming, note: "As próximas histórias nas telas", icon: CalendarDays },
  ];

  function openModal(type, movie, event) {
    returnFocus.current = event.currentTarget;
    table.openModal(type, movie);
  }

  return (
    <main id="admin-content" tabIndex={-1} className={styles.page}>
      <header className={styles.heading}>
        <div>
          <h1>Tabela <em>exemplo.</em></h1>
          <p>O catálogo do seu cinema, organizado em um só lugar.</p>
        </div>
        <button ref={createButton} type="button" className={styles.primary} onClick={(event) => openModal("create", null, event)} aria-haspopup="dialog">
          <Plus size={18} aria-hidden="true" />Criar filme
        </button>
      </header>
      <div className={styles.filmStrip} aria-hidden="true" />
      <div className={styles.context}><span>Dados demonstrativos</span><p>Alterações apenas nesta página. Os registros não são salvos ao sair ou recarregar.</p></div>

      <section className={styles.metrics} aria-label="Resumo do catálogo">
        {metrics.map(({ label, value, note, icon: Icon }) => (
          <article className={styles.metric} key={label}>
            <div><span>{label}</span><Icon size={20} aria-hidden="true" /></div>
            <strong>{value.toLocaleString("pt-BR")}</strong><p>{note}</p>
          </article>
        ))}
      </section>

      <MovieDialogs table={table} returnFocus={returnFocus} fallbackFocus={createButton} />
      <p role="status" className={table.message ? styles.notice : "sr-only"}>{table.message}</p>

      <section className={styles.tablePanel} aria-labelledby="catalog-title">
        <header className={styles.tableHeading}><div><h2 id="catalog-title">Catálogo de filmes</h2><p>Consulte os títulos e acompanhe a programação.</p></div><span>{table.movies.length} registros</span></header>
        <div className={styles.toolbar}>
          <label className={styles.search}><Search size={18} aria-hidden="true" /><span className="sr-only">Buscar por filme ou gênero</span><input type="search" value={table.query} onChange={(event) => table.setQuery(event.target.value)} placeholder="Buscar por filme ou gênero…" /></label>
          <label className={styles.filter}>Status<select value={table.status} onChange={(event) => table.setStatus(event.target.value)}><option>Todos</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
        </div>
        <div className={styles.scroll} role="region" aria-label="Tabela de filmes, role horizontalmente em telas pequenas" tabIndex={0}>
          <table className={styles.table}>
            <caption className="sr-only">Filmes demonstrativos com gênero, duração e status</caption>
            <thead><tr><th scope="col">Filme</th><th scope="col">Gênero</th><th scope="col">Duração</th><th scope="col">Status</th><th scope="col">Ações</th></tr></thead>
            <tbody>{table.filteredMovies.map((movie) => <tr key={movie.id}>
              <th scope="row"><span className={styles.movie}><span className={styles.movieIcon}><Film size={20} aria-hidden="true" /></span>{movie.title}</span></th>
              <td>{movie.genre}</td><td>{movie.duration} min</td><td><span className={movie.status === "Em cartaz" ? styles.showing : styles.upcoming}>{movie.status}</span></td>
              <td><div className={styles.actions}>
                <button type="button" className={styles.secondary} aria-label={`Editar ${movie.title}`} aria-haspopup="dialog" onClick={(event) => openModal("edit", movie, event)}><Pencil size={16} aria-hidden="true" />Editar</button>
                <button type="button" className={styles.removeAction} aria-label={`Remover ${movie.title}`} aria-haspopup="dialog" onClick={(event) => openModal("remove", movie, event)}><Trash2 size={16} aria-hidden="true" />Remover</button>
              </div></td>
            </tr>)}</tbody>
          </table>
        </div>
        {table.filteredMovies.length === 0 && <div className={styles.empty}><Search size={28} aria-hidden="true" /><h3>Nenhum filme encontrado</h3><p>Tente outro título, gênero ou status.</p><button type="button" className={styles.secondary} onClick={table.clearFilters}>Limpar filtros</button></div>}
        <footer className={styles.tableFooter}><span role="status">Exibindo {table.filteredMovies.length} de {table.movies.length} filmes</span><span>Catálogo demonstrativo</span></footer>
      </section>
      <footer className={styles.footer}>CineAstra <span>O espetáculo também acontece nos bastidores.</span></footer>
    </main>
  );
}
