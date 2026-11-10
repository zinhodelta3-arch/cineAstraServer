"use client";

import TablePagination from '@/components/ui/table-pagination';
import Link from "next/link";
import { useDeferredValue, useRef, useState } from "react";
import { Archive, Film, Images, Pencil, Plus, RotateCcw, Search, Tags } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { publicAsset } from "@/lib/api/public-api.mjs";
import { catalogRequest, useAdminCatalogList } from "@/hooks/admin/use-admin-catalog";
import CatalogLayout, { CatalogState } from "./catalog-layout";
import styles from "./catalog.module.css";

const classifications = ["L", "10", "12", "14", "16", "18"];
const onlyHttps = (value) => !value || /^https:\/\/[^\s]+$/i.test(value);

function payloadFrom(form) {
  const value = (key) => String(form.get(key) ?? "").trim();
  const price = (key) => {
    const raw = value(key);
    if (!raw) return null;
    const number = Number(raw);
    if (!Number.isFinite(number) || number < 0 || number > 99999999.99) throw new Error("Confira os preços informados.");
    return number.toFixed(2);
  };
  const duration = Number(value("duracao"));
  const days = Number(value("dias_acesso_aluguel"));
  if (!Number.isInteger(duration) || duration < 1 || !Number.isInteger(days) || days < 1) throw new Error("Confira a duração e o prazo de aluguel.");
  if (!onlyHttps(value("trailer")) || !onlyHttps(value("url_reproducao"))) throw new Error("Os links de mídia devem usar HTTPS.");
  const result = {
    titulo: value("titulo"), descricao: value("descricao") || null, duracao: duration,
    classificacao: value("classificacao"), data_lancamento: value("data_lancamento") || null,
    diretor: value("diretor") || null, trailer: value("trailer") || null,
    url_reproducao: value("url_reproducao") || null,
    disponivel_cinema: form.has("disponivel_cinema"), disponivel_streaming: form.has("disponivel_streaming"),
    preco_aluguel: price("preco_aluguel"), preco_compra: price("preco_compra"),
    dias_acesso_aluguel: days, status: value("status"),
  };
  if (!result.titulo || result.titulo.length > 200) throw new Error("Informe um título de até 200 caracteres.");
  if (result.disponivel_streaming && result.preco_aluguel === null && result.preco_compra === null) throw new Error("Informe o preço de aluguel ou compra para disponibilizar o filme no streaming.");
  return result;
}

export default function FilmsAdmin() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Todos");
  const [dialog, setDialog] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const lock = useRef(false);
  const search = useDeferredValue(query.trim());
  const params = new URLSearchParams({ limit: "20" });
  if (search) params.set("titulo", search);
  if (status !== "Todos") params.set("status", status);
  const list = useAdminCatalogList(`films?${params}`);
  const genreList = useAdminCatalogList(dialog?.type === "genres" ? "genres?limit=100" : null);
  const filmGenres = useAdminCatalogList(dialog?.type === "genres" ? `films/${dialog.film.id_filme}/genres?limit=100` : null);

  function open(type, film = null) { setError(""); setNotice(""); setDialog({ type, film }); }
  function close() { if (!pending) setDialog(null); }

  async function run(task, success, closeAfter = true) {
    if (lock.current) return;
    lock.current = true; setPending(true); setError("");
    try {
      await task();
      setNotice(success);
      list.reload();
      if (closeAfter) setDialog(null);
    } catch (cause) { setError(cause.message); }
    finally { lock.current = false; setPending(false); }
  }

  function save(event) {
    event.preventDefault();
    let body;
    try { body = payloadFrom(new FormData(event.currentTarget)); }
    catch (cause) { setError(cause.message); return; }
    const film = dialog?.film;
    run(() => catalogRequest(film ? `films/${film.id_filme}` : "films", { method: film ? "PATCH" : "POST", body }), film ? "Filme atualizado." : "Filme cadastrado.");
  }

  async function toggleGenre(genre) {
    const film = dialog?.film;
    if (!film) return;
    const linked = filmGenres.items.some((item) => item.id_genero === genre.id_genero);
    await run(async () => {
      await catalogRequest(linked ? `films/${film.id_filme}/genres/${genre.id_genero}` : `films/${film.id_filme}/genres`, { method: linked ? "DELETE" : "POST", body: linked ? undefined : { genreId: genre.id_genero } });
      filmGenres.reload();
    }, linked ? "Gênero removido do filme." : "Gênero associado ao filme.", false);
  }

  const film = dialog?.film;
  return <CatalogLayout title="Filmes" description="Organize os títulos disponíveis no CineAstra." action={<button type="button" className={styles.primary} onClick={() => open("form")}><Plus size={16} aria-hidden="true" />Novo filme</button>}>
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    <section className={styles.panel} aria-labelledby="films-title">
      <header className={styles.panelHeader}><div><h2 id="films-title">Catálogo de filmes</h2><p>Edite títulos, associe gêneros e organize imagens.</p></div><span className={styles.count}>{list.items.length} carregados</span></header>
      <div className={styles.toolbar}>
        <label className={styles.search}><Search size={16} aria-hidden="true" /><span className="sr-only">Buscar filme pelo título</span><input type="search" maxLength={200} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar filme" /></label>
        <label className={styles.filter}>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option>Todos</option><option value="ATIVO">Ativos</option><option value="INATIVO">Inativos</option></select></label>
      </div>
      {list.items.length > 0 && <div className={styles.tableWrap} role="region" aria-label="Tabela de filmes; role horizontalmente em telas pequenas" tabIndex={0}><table className={styles.table}>
        <caption className="sr-only">Filmes cadastrados no catálogo administrativo</caption>
        <thead><tr><th scope="col">Filme</th><th scope="col">Duração</th><th scope="col">Classificação</th><th scope="col">Disponibilidade</th><th scope="col">Status</th><th scope="col" aria-label="Ações" /></tr></thead>
        <tbody>{list.items.map((item) => <tr key={item.id_filme}><th scope="row"><span className={styles.filmCell}><span className={styles.poster}>{publicAsset(item.imagem) ? <img src={publicAsset(item.imagem)} alt="" /> : <Film size={17} aria-hidden="true" />}</span><span>{item.titulo}</span></span></th><td>{item.duracao} min</td><td>{item.classificacao === "L" ? "Livre" : `${item.classificacao} anos`}</td><td className={styles.muted}>{[item.disponivel_cinema && "Cinema", item.disponivel_streaming && "Streaming"].filter(Boolean).join(" · ") || "Indisponível"}</td><td><span className={`${styles.badge} ${item.status === "INATIVO" ? styles.inactive : ""}`}>{item.status === "ATIVO" ? "Ativo" : "Inativo"}</span></td><td><div className={styles.actions}>
          <button type="button" className={styles.iconButton} aria-label={`Editar ${item.titulo}`} title="Editar filme" onClick={() => open("form", item)}><Pencil size={16} aria-hidden="true" /></button>
          <button type="button" className={styles.iconButton} aria-label={`Gêneros de ${item.titulo}`} title="Associar gêneros" onClick={() => open("genres", item)}><Tags size={16} aria-hidden="true" /></button>
          <Link className={styles.iconButton} href={`/admin/filmes/imagens?filme=${item.id_filme}`} aria-label={`Imagens de ${item.titulo}`} title="Imagens do filme"><Images size={16} aria-hidden="true" /></Link>
          <button type="button" className={`${styles.iconButton} ${item.status === "ATIVO" ? styles.destructive : ""}`} aria-label={`${item.status === "ATIVO" ? "Arquivar" : "Reativar"} ${item.titulo}`} title={item.status === "ATIVO" ? "Arquivar filme" : "Reativar filme"} onClick={() => open("status", item)}>{item.status === "ATIVO" ? <Archive size={16} aria-hidden="true" /> : <RotateCcw size={16} aria-hidden="true" />}</button>
        </div></td></tr>)}</tbody>
      </table></div>}
      <CatalogState list={list} empty="Nenhum filme encontrado para este filtro." noun="filmes" />
      <TablePagination list={list} />
    </section>
    <Dialog open={Boolean(dialog)} onOpenChange={(value) => { if (!value) close(); }}><DialogContent className={styles.dialog}>
      <DialogTitle className={styles.dialogTitle}>{dialog?.type === "genres" ? `Gêneros de ${film?.titulo}` : dialog?.type === "status" ? `${film?.status === "ATIVO" ? "Arquivar" : "Reativar"} filme` : film ? "Editar filme" : "Novo filme"}</DialogTitle>
      {dialog?.type === "form" && <><DialogDescription className={styles.dialogDescription}>Preencha os dados do filme. Gêneros e imagens podem ser organizados após o cadastro.</DialogDescription><form key={film?.id_filme ?? "new"} className={styles.form} onSubmit={save}>
        <label className={styles.wide}>Título<input name="titulo" required maxLength={200} defaultValue={film?.titulo ?? ""} /></label>
        <label>Duração (minutos)<input name="duracao" type="number" min="1" required defaultValue={film?.duracao ?? ""} /></label>
        <label>Classificação<select name="classificacao" defaultValue={film?.classificacao ?? "L"}>{classifications.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Data de lançamento<input name="data_lancamento" type="date" defaultValue={film?.data_lancamento?.slice(0, 10) ?? ""} /></label>
        <label>Direção<input name="diretor" maxLength={150} defaultValue={film?.diretor ?? ""} /></label>
        <label className={styles.wide}>Sinopse<textarea name="descricao" maxLength={10000} defaultValue={film?.descricao ?? ""} /></label>
        <label className={styles.wide}>Trailer (URL HTTPS)<input name="trailer" type="url" defaultValue={film?.trailer ?? ""} /></label>
        <label className={styles.wide}>Reprodução (URL HTTPS)<input name="url_reproducao" type="url" defaultValue={film?.url_reproducao ?? ""} /></label>
        <div className={`${styles.checks} ${styles.wide}`}><label><input type="checkbox" name="disponivel_cinema" defaultChecked={film?.disponivel_cinema ?? true} /> Disponível no cinema</label><label><input type="checkbox" name="disponivel_streaming" defaultChecked={film?.disponivel_streaming ?? false} /> Disponível no streaming</label></div>
        <label>Aluguel (R$)<input name="preco_aluguel" type="number" min="0" step="0.01" defaultValue={film?.preco_aluguel ?? ""} /></label>
        <label>Compra (R$)<input name="preco_compra" type="number" min="0" step="0.01" defaultValue={film?.preco_compra ?? ""} /></label>
        <label>Dias de acesso no aluguel<input name="dias_acesso_aluguel" type="number" min="1" max="36500" required defaultValue={film?.dias_acesso_aluguel ?? 3} /></label>
        <label>Status<select name="status" defaultValue={film?.status ?? "ATIVO"}><option value="ATIVO">Ativo</option><option value="INATIVO">Inativo</option></select></label>
        <p className={`${styles.hint} ${styles.wide}`}>Streaming exige preço de aluguel ou compra. Links de mídia precisam usar um host autorizado pelo sistema.</p>
        {error && <p className={`${styles.error} ${styles.wide}`} role="alert">{error}</p>}
        <div className={`${styles.dialogActions} ${styles.wide}`}><button type="button" className={styles.secondary} onClick={close} disabled={pending}>Cancelar</button><button type="submit" className={styles.primary} disabled={pending}>{pending ? "Salvando…" : film ? "Salvar alterações" : "Cadastrar filme"}</button></div>
      </form></>}
      {dialog?.type === "genres" && <><DialogDescription className={styles.dialogDescription}>Marque os gêneros associados a este filme.</DialogDescription>
        {genreList.loading || filmGenres.loading ? <p role="status">Carregando gêneros…</p> : null}
        {(genreList.error || filmGenres.error) && <p className={styles.error} role="alert">{genreList.error || filmGenres.error}</p>}
        {error && <p className={styles.error} role="alert">{error}</p>}
        <ul className={styles.checkboxList}>{genreList.items.map((genre) => { const linked = filmGenres.items.some((item) => item.id_genero === genre.id_genero); return <li key={genre.id_genero}><label><input type="checkbox" checked={linked} onChange={() => toggleGenre(genre)} disabled={pending || filmGenres.loading || (!linked && (genre.status !== "ATIVO" || film.status !== "ATIVO"))} />{genre.nome}{genre.status !== "ATIVO" && <span className={styles.muted}>(inativo)</span>}</label></li>; })}</ul>
        <div className={styles.dialogActions}>{filmGenres.nextCursor && <button type="button" className={styles.secondary} onClick={filmGenres.loadMore} disabled={filmGenres.loadingMore}>Carregar associações</button>}{genreList.nextCursor && <button type="button" className={styles.secondary} onClick={genreList.loadMore} disabled={genreList.loadingMore}>Mais gêneros</button>}<button type="button" className={styles.secondary} onClick={close}>Fechar</button></div>
      </>}
      {dialog?.type === "status" && <><DialogDescription className={styles.dialogDescription}>{film?.status === "ATIVO" ? `Arquivar ${film?.titulo} remove o filme do catálogo público. O registro permanece disponível no admin.` : `Reativar ${film?.titulo} o torna disponível conforme as configurações do filme.`}</DialogDescription>{error && <p className={styles.error} role="alert">{error}</p>}<div className={styles.dialogActions}><button type="button" className={styles.secondary} onClick={close}>Cancelar</button><button type="button" className={film?.status === "ATIVO" ? styles.danger : styles.primary} disabled={pending} onClick={() => run(() => catalogRequest(`films/${film.id_filme}`, { method: film.status === "ATIVO" ? "DELETE" : "PATCH", body: film.status === "ATIVO" ? undefined : { status: "ATIVO" } }), film?.status === "ATIVO" ? "Filme arquivado." : "Filme reativado.")}>{pending ? "Aguarde…" : film?.status === "ATIVO" ? "Arquivar filme" : "Reativar filme"}</button></div></>}
    </DialogContent></Dialog>
  </CatalogLayout>;
}
