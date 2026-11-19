'use client';

import { useState } from 'react';
import MoneyInput from '@/components/ui/money-input';
import { unitOperation, useUnitList } from '@/hooks/unit/use-unit-data';
import { UnitListState, label } from './unit-layout';
import styles from './unit.module.css';

function finishTime(start, filmMinutes, trailerMinutes) {
  if (!start || !Number.isInteger(filmMinutes) || filmMinutes <= 0 || !Number.isInteger(trailerMinutes)) return null;
  const duration = filmMinutes + trailerMinutes;
  if (duration >= 1440) return null;
  const [h, m] = start.split(':').map(Number);
  const total = h * 60 + m + duration;
  const end = new Date(total * 60_000).toISOString().slice(11, 16);
  return total >= 1440 ? `${end} do dia seguinte` : end;
}

export default function UnitSessionForm({ item, localId, trailerMinutes, action, onClose }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [chosenFilm, setChosenFilm] = useState(() => item ? { id_filme: item.id_filme, titulo: item.titulo_filme, duracao: item.duracao_filme } : null);
  const [start, setStart] = useState(item?.horario_inicio?.slice(0, 5) ?? '');
  const films = useUnitList(`/films?limit=20&cinema=true${query ? `&titulo=${encodeURIComponent(query)}` : ''}`, unitOperation);
  const rooms = useUnitList(!item ? `/locations/${localId}/rooms?limit=20&status=ATIVA` : null, unitOperation);
  const film = films.items.find(row => row.id_filme === chosenFilm?.id_filme) ?? chosenFilm;
  const unchangedTime = item && film?.id_filme === item.id_filme && start === item.horario_inicio.slice(0, 5);
  const end = unchangedTime
    ? `${item.horario_fim.slice(0, 5)}${item.data_fim !== item.data ? ' do dia seguinte' : ''}`
    : finishTime(start, film?.duracao, trailerMinutes);
  async function save(event) {
    event.preventDefault();
    if (!film || !end) return action.setError('Escolha um filme e um horário de início para calcular o término.');
    const form = new FormData(event.currentTarget);
    const body = {
      id_filme: film.id_filme,
      data: String(form.get('data')),
      horario_inicio: start,
      idioma: String(form.get('idioma')),
      preco_inteira: String(form.get('preco_inteira') ?? ''),
    };
    if (!item) body.id_sala = String(form.get('id_sala'));
    else for (const key of Object.keys(body)) {
      if (body[key] === (key === 'horario_inicio' ? item[key].slice(0, 5) : item[key])) delete body[key];
    }
    if (!Object.keys(body).length) return action.setError('Nenhuma alteração para salvar.');
    if (await action.run(item ? `/sessions/${item.id_sessao}` : '/sessions', { method: item ? 'PATCH' : 'POST', body }, item ? 'Sessão atualizada.' : 'Sessão agendada.')) onClose();
  }

  return <form className={styles.form} onSubmit={save}>
    <label className={styles.full}>Filme<select value={film?.id_filme ?? ''} required onChange={event => setChosenFilm(films.items.find(row => row.id_filme === event.target.value) ?? null)}>
      <option value="">{films.loading ? 'Carregando filmes…' : 'Selecione um filme'}</option>
      {film && !films.items.some(row => row.id_filme === film.id_filme) && <option value={film.id_filme}>{film.titulo}</option>}
      {films.items.map(row => <option key={row.id_filme} value={row.id_filme}>{row.titulo} · {row.duracao} min</option>)}
    </select></label>
    <button type="button" className={styles.secondary} aria-expanded={searchOpen} aria-controls="session-film-search" onClick={() => setSearchOpen(open => !open)}>{searchOpen ? 'Fechar busca de filmes' : 'Ver mais filmes'}</button>
    {searchOpen && <div id="session-film-search" className={`${styles.full} ${styles.row}`}>
      <label>Buscar filmes pelo título<input type="search" value={search} maxLength={200} onChange={event => setSearch(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); setQuery(search.trim()); } }} /></label>
      <button type="button" className={styles.secondary} onClick={() => setQuery(search.trim())}>Buscar</button>
      {films.nextCursor && <button type="button" className={styles.secondary} onClick={films.loadMore} disabled={films.loadingMore}>{films.loadingMore ? 'Carregando…' : 'Carregar mais filmes'}</button>}
      <UnitListState list={films} empty="Nenhum filme encontrado." />
      {films.error && films.items.length > 0 && <p role="alert" className={styles.error}>{films.error}</p>}
    </div>}
    {!searchOpen && films.error && <p role="alert" className={styles.error}>{films.error}</p>}
    {!item ? <>
      <label className={styles.full}>Sala<select name="id_sala" required defaultValue="">
        <option value="">{rooms.loading ? 'Carregando salas…' : 'Selecione uma sala'}</option>
        {rooms.items.map(row => <option key={row.id_sala} value={row.id_sala}>{row.nome} · {row.tipo}</option>)}
      </select></label>
      <UnitListState list={rooms} empty="Nenhuma sala ativa nesta unidade." />
      {rooms.nextCursor && <button type="button" className={styles.secondary} onClick={rooms.loadMore} disabled={rooms.loadingMore}>Mais salas</button>}
    </> : <p className={`${styles.full} ${styles.muted}`}>Sala vinculada · {item.nome_sala}</p>}
    <label>Data<input name="data" type="date" required defaultValue={item?.data?.slice(0, 10) ?? ''} /></label>
    <label>Idioma<select name="idioma" defaultValue={item?.idioma ?? 'DUBLADO'}>{['DUBLADO', 'LEGENDADO', 'ORIGINAL'].map(value => <option key={value} value={value}>{label(value)}</option>)}</select></label>
    <label>Início<input name="horario_inicio" type="time" required value={start} onChange={event => setStart(event.target.value)} /></label>
    <label>Término previsto<input readOnly value={end ?? ''} placeholder="Calculado pelo sistema" aria-describedby="session-trailers" /></label>
    <p id="session-trailers" className={`${styles.full} ${styles.muted}`}>{unchangedTime ? 'Horário da sessão já cadastrada.' : `${trailerMinutes} min de trailers antes do filme${film?.duracao ? ` · Filme de ${film.duracao} min` : ''}.`}</p>
    <label className={styles.full}>Preço da inteira (R$)<MoneyInput name="preco_inteira" required defaultValue={item?.preco_inteira} /></label>
    <div className={`${styles.row} ${styles.full}`}>
      <button type="button" className={styles.secondary} onClick={onClose} disabled={action.pending}>Voltar</button>
      <button type="submit" className={styles.button} disabled={action.pending || (!item && (rooms.loading || !rooms.items.length))}>{action.pending ? 'Salvando…' : 'Salvar sessão'}</button>
    </div>
  </form>;
}
