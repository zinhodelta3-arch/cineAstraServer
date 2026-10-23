"use client";

import { useRef } from "react";
import { CalendarDays, Film, Plus, Search, Ticket, X } from "lucide-react";
import { useExampleTable } from "@/hooks/use-example-table";
import { genres, statuses } from "./data";
import styles from "./example-table.module.css";

export default function ExampleTable() {
  const table = useExampleTable();
  const createButton = useRef(null);
  const metrics = [
    { label: "Filmes cadastrados", value: table.movies.length, note: "Todos os registros da demonstração", icon: Film },
    { label: "Em cartaz", value: table.showing, note: "Filmes na programação atual", icon: Ticket },
    { label: "Em breve", value: table.upcoming, note: "As próximas histórias nas telas", icon: CalendarDays },
  ];

  function closeForm() {
    table.toggleCreating();
    createButton.current?.focus();
  }

  function submit(event) {
    table.createMovie(event);
    // Keep keyboard focus on a stable control after the form is removed.
    if (event.currentTarget.checkValidity() && String(new FormData(event.currentTarget).get("title")).trim()) {
      createButton.current?.focus();
    }
  }

  return (
    <main id="admin-content" tabIndex={-1} className={styles.page}>
      <header className={styles.heading}>
        <div>
          <h1>Tabela <em>exemplo.</em></h1>
          <p>O catálogo do seu cinema, organizado em um só lugar.</p>
        </div>
        <button ref={createButton} type="button" className={styles.primary} onClick={table.toggleCreating} aria-expanded={table.creating} aria-controls="create-movie">
          {table.creating ? <X size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
          {table.creating ? "Fechar cadastro" : "Criar filme"}
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

      {table.creating && <section id="create-movie" className={styles.formPanel} aria-labelledby="create-title">
        <h2 id="create-title">Novo filme</h2>
        <p>Preencha os dados para adicionar um registro à tabela de exemplo.</p>
        <form onSubmit={submit} className={styles.form}>
          <label className={styles.titleField}>Título do filme<input name="title" required maxLength={100} placeholder="Ex.: Cinema Paradiso" autoFocus /></label>
          <label>Gênero<select name="genre" defaultValue="Drama">{genres.map((genre) => <option key={genre}>{genre}</option>)}</select></label>
          <label>Duração em minutos<input name="duration" type="number" min="1" max="600" step="1" required placeholder="120" /></label>
          <label>Status<select name="status">{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
          {table.error && <p className={styles.error} role="alert">{table.error}</p>}
          <div className={styles.formActions}><button type="button" className={styles.secondary} onClick={closeForm}>Cancelar</button><button className={styles.primary} type="submit">Adicionar filme</button></div>
        </form>
      </section>}
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
            <thead><tr><th scope="col">Filme</th><th scope="col">Gênero</th><th scope="col">Duração</th><th scope="col">Status</th></tr></thead>
            <tbody>{table.filteredMovies.map((movie) => <tr key={movie.id}>
              <th scope="row"><span className={styles.movie}><span className={styles.movieIcon}><Film size={20} aria-hidden="true" /></span>{movie.title}</span></th>
              <td>{movie.genre}</td><td>{movie.duration} min</td><td><span className={movie.status === "Em cartaz" ? styles.showing : styles.upcoming}>{movie.status}</span></td>
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
