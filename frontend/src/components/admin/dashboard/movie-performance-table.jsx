"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Eye, Film, MoreHorizontal, Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import TablePagination from "@/components/ui/table-pagination";
import { useLocalPagination } from "@/hooks/use-paginated-list";
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
  const [message, setMessage] = useState("");
  const filtered = items.filter((movie) => normalize(movie.title).includes(normalize(query.trim())));
  const pagination = useLocalPagination(filtered, { initialPageSize: 5, loading });

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
        <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); pagination.goToPage(1); }} placeholder="Buscar filme" />
      </label>
      <span className={styles.tableCount}>Até 10 filmes mais vendidos</span>
    </div>
    {!loading && !error && filtered.length > 0 ? <div className={styles.tableWrap} role="region" aria-label="Filmes mais vendidos; role horizontalmente em telas pequenas" tabIndex={0}>
      <table className={styles.table}>
        <caption className="sr-only">Filmes com mais ingressos vendidos no período selecionado</caption>
        <thead><tr><th scope="col">Filme</th><th scope="col">Ingressos</th><th scope="col">Receita</th><th scope="col" aria-label="Ações" /></tr></thead>
        <tbody>
          {pagination.items.map((movie) => <tr key={movie.id}>
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
    <TablePagination list={{ ...pagination, error }} noun="filmes" pageSizes={[5, 10]} />
    <p className="sr-only" role="status">{message}</p>
  </>;
}
