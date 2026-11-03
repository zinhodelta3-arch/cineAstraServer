"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Copy, Eye, Film, MoreHorizontal, Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import styles from "./dashboard.module.css";

const integer = (value) => BigInt(value).toLocaleString("pt-BR");
const brl = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
const normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");

function MovieActions({ movie, onCopy }) {
  const href = `/cinema/filmes/${movie.id}`;
  return <DropdownMenu>
    <DropdownMenuTrigger render={<button type="button" className={styles.actionTrigger} aria-label={`Ações para ${movie.title}`} title={`Ações para ${movie.title}`} />}>
      <MoreHorizontal size={18} aria-hidden="true" />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className={styles.actionMenu} aria-label={`Ações para ${movie.title}`}>
      <DropdownMenuItem render={<Link href={href} />} className={styles.actionItem} aria-label={`Ver ${movie.title}`} title="Ver filme">
        <Eye size={18} aria-hidden="true" /><span className="sr-only">Ver filme</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onCopy(href)} className={styles.actionItem} aria-label={`Copiar link de ${movie.title}`} title="Copiar link">
        <Copy size={18} aria-hidden="true" /><span className="sr-only">Copiar link</span>
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}

export default function MoviePerformanceTable({ items = [], loading, error, retry }) {
  const [query, setQuery] = useState("");
  const [pageSize, setPageSize] = useState(5);
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState("");
  const filtered = items.filter((movie) => normalize(movie.title).includes(normalize(query.trim())));
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  async function copyLink(href) {
    try {
      await navigator.clipboard.writeText(new URL(href, window.location.origin).href);
      setMessage("Link do filme copiado.");
    } catch {
      setMessage("Não foi possível copiar o link.");
    }
  }

  return <>
    <div className={styles.tableToolbar}>
      <label className={styles.tableSearch}>
        <Search size={16} aria-hidden="true" />
        <span className="sr-only">Buscar entre os filmes mais vendidos</span>
        <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Buscar filme" />
      </label>
      <span className={styles.tableCount}>Até 10 filmes mais vendidos</span>
    </div>
    {!loading && !error && filtered.length > 0 ? <div className={styles.tableWrap} role="region" aria-label="Filmes mais vendidos; role horizontalmente em telas pequenas" tabIndex={0}>
      <table className={styles.table}>
        <caption className="sr-only">Filmes com mais ingressos vendidos no período selecionado</caption>
        <thead><tr><th scope="col">Filme</th><th scope="col">Ingressos</th><th scope="col">Receita</th><th scope="col" aria-label="Ações" /></tr></thead>
        <tbody>
          {visible.map((movie) => <tr key={movie.id}>
            <th scope="row"><span className={styles.movieCell}><Film size={17} aria-hidden="true" /><span className={styles.movieName}>{movie.title}</span></span></th>
            <td>{integer(movie.tickets)}</td>
            <td>{brl(movie.ticketSalesValue)}</td>
            <td><MovieActions movie={movie} onCopy={copyLink} /></td>
          </tr>)}
        </tbody>
      </table>
    </div> : <div className={styles.tableState} role="status">
      {loading ? "Carregando filmes…" : error ? <><span>{error}</span><button type="button" onClick={retry}>Tentar novamente</button></> : query ? "Nenhum filme encontrado para esta busca." : "Ainda não há ingressos vendidos neste período."}
    </div>}
    <footer className={styles.tableFooter}>
      <span>{loading || error ? "—" : `${filtered.length ? (currentPage - 1) * pageSize + 1 : 0}–${Math.min(currentPage * pageSize, filtered.length)} de ${filtered.length} filmes`}</span>
      <div className={styles.pagination}>
        <label>Linhas por página <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}><option value={5}>5</option><option value={10}>10</option></select></label>
        <span>Página {currentPage} de {pageCount}</span>
        <div className={styles.pageButtons}>
          <button type="button" aria-label="Primeira página" title="Primeira página" disabled={currentPage === 1} onClick={() => setPage(1)}><ChevronsLeft size={16} aria-hidden="true" /></button>
          <button type="button" aria-label="Página anterior" title="Página anterior" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16} aria-hidden="true" /></button>
          <button type="button" aria-label="Próxima página" title="Próxima página" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight size={16} aria-hidden="true" /></button>
          <button type="button" aria-label="Última página" title="Última página" disabled={currentPage === pageCount} onClick={() => setPage(pageCount)}><ChevronsRight size={16} aria-hidden="true" /></button>
        </div>
      </div>
    </footer>
    <p className="sr-only" role="status">{message}</p>
  </>;
}
