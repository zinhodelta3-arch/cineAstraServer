'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Film, Pencil, Plus, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { unitOperation, useUnitAction, useUnitContext, useUnitList } from '@/hooks/unit/use-unit-data';
import UnitLayout, { UnitFeedback, UnitListState, UnitMore } from './unit-layout';
import styles from './unit.module.css';

const dialogCopy = {
  add: ['Adicionar filme', 'Busque um título no catálogo do CineAstra.'],
  edit: ['Editar oferta', 'A observação fica disponível para a equipe deste cinema.'],
  remove: ['Retirar da oferta', 'As sessões já cadastradas continuam na programação.'],
};

function OfferEditor({ dialog, action, onClose }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');
  const { kind, film } = dialog;
  const catalog = useUnitList(kind === 'add' && query ? `/films?limit=20&cinema=true&titulo=${encodeURIComponent(query)}` : null, unitOperation);
  function search(event) {
    event.preventDefault();
    const next = String(new FormData(event.currentTarget).get('titulo')).trim();
    if (!next || next === query) return;
    action.setError('');
    setSelected('');
    setQuery(next);
  }
  async function save(event) {
    event.preventDefault();
    const note = String(new FormData(event.currentTarget).get('observacao') ?? '').trim() || null;
    const path = film ? `/film-offers/${film.id_filme}` : '/film-offers';
    const operation = {
      add: { method:'POST', body:{ id_filme:selected, observacao:note } },
      edit: { method:'PATCH', body:{ observacao:note } },
      remove: { method:'DELETE' },
    }[kind];
    const messages = { add:'Filme adicionado à oferta.', edit:'Oferta atualizada.', remove:'Filme retirado da oferta.' };
    if (await action.run(path, operation, messages[kind])) onClose();
  }
  return <>
    {kind === 'add' && <form className={styles.toolbar} onSubmit={search}>
      <label className={styles.field}>Título do filme<input name="titulo" type="search" required maxLength={200} /></label>
      <button type="submit" className={styles.secondary} disabled={catalog.loading}>Buscar</button>
    </form>}
    <form className={styles.form} onSubmit={save}>
      {film && <p className={styles.full}><strong>{film.titulo}</strong></p>}
      {kind === 'add' && query && <div className={styles.full}>
        <UnitListState list={catalog} empty="Nenhum filme encontrado." />
        {catalog.items.length > 0 && <label className={styles.field}>Resultado da busca
          <select required value={selected} onChange={event => setSelected(event.target.value)}>
            <option value="">Selecione um filme</option>
            {catalog.items.map(item => <option key={item.id_filme} value={item.id_filme}>{item.titulo} · {item.duracao} min</option>)}
          </select>
        </label>}
        <UnitMore list={catalog} />
      </div>}
      {(kind === 'edit' || kind === 'add' && selected) && <label className={styles.full}>Observação da unidade (opcional)
        <textarea name="observacao" rows={3} maxLength={300} defaultValue={film?.observacao ?? ''} />
      </label>}
      <div className={`${styles.row} ${styles.full}`}>
        <button type="button" className={styles.secondary} onClick={onClose} disabled={action.pending}>Voltar</button>
        <button type="submit" className={styles.button} disabled={action.pending || kind === 'add' && !selected}>
          {action.pending ? 'Salvando…' : kind === 'remove' ? 'Retirar da oferta' : 'Salvar oferta'}
        </button>
      </div>
    </form>
  </>;
}

export default function UnitFilms({ canManage = false }) {
  const context = useUnitContext();
  const local = context.locations[0];
  const [dialog, setDialog] = useState(null);
  const [query, setQuery] = useState('');
  const params = new URLSearchParams({ limit:'20', localId:local?.id_local ?? '' });
  if (query) params.set('titulo', query);
  const films = useUnitList(local ? `/film-offers?${params}` : null, unitOperation);
  const action = useUnitAction(films.reload, unitOperation);
  const open = (kind, film = null) => {
    action.setError('');
    setDialog({ kind, film });
  };
  const close = () => setDialog(null);

  return <UnitLayout title="Filmes da unidade" description="Gerencie os filmes que este cinema pode programar." location={local?.nome}>
    <UnitFeedback error={context.error} notice={action.notice} />
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2>Oferta do cinema</h2>
        {canManage && <button type="button" className={styles.button} disabled={!local} onClick={() => open('add')}><Plus size={16} /> Adicionar filme</button>}
      </div>
      <div className={styles.body}>
        <form className={styles.toolbar} onSubmit={event => {
          event.preventDefault();
          setQuery(String(new FormData(event.currentTarget).get('titulo')).trim());
        }}>
          <label className={styles.field}>Filtrar por título<input name="titulo" type="search" maxLength={200} /></label>
          <button type="submit" className={styles.secondary} disabled={!local}>Filtrar</button>
          <Link href="/unidade/sessoes" className={styles.secondary}>Ver sessões <ArrowRight size={16} /></Link>
        </form>
        <UnitListState list={films} empty={query ? 'Nenhum filme corresponde ao filtro.' : 'Nenhum filme na oferta deste cinema.'} />
        <div className={styles.filmGrid}>
          {films.items.map(film => <article key={film.id_filme} className={`${styles.card} ${styles.ticket}`}>
            <span className={styles.cardIcon} aria-hidden="true"><Film size={19} /></span>
            <strong>{film.titulo}</strong>
            <p>{film.duracao} min</p>
            {film.observacao && <p className={styles.offerNote}>{film.observacao}</p>}
            {canManage && <div className={styles.cardFooter}>
              <button type="button" className={styles.iconButton} title="Editar oferta" aria-label={`Editar oferta de ${film.titulo}`} onClick={() => open('edit', film)}><Pencil size={16} /></button>
              <button type="button" className={styles.iconButton} title="Retirar da oferta" aria-label={`Retirar ${film.titulo} da oferta`} onClick={() => open('remove', film)}><XCircle size={16} /></button>
            </div>}
          </article>)}
        </div>
        <UnitMore list={films} />
      </div>
    </section>
    <Dialog open={Boolean(dialog)} onOpenChange={visible => { if (!visible && !action.pending) close(); }}>
      <DialogContent className={styles.dialog}>
        <DialogTitle>{dialogCopy[dialog?.kind]?.[0]}</DialogTitle>
        <DialogDescription>{dialogCopy[dialog?.kind]?.[1]}</DialogDescription>
        {dialog && <OfferEditor key={`${dialog.kind}:${dialog.film?.id_filme ?? ''}`} dialog={dialog} action={action} onClose={close} />}
        {action.error && <p role="alert" className={`${styles.message} ${styles.error}`}>{action.error}</p>}
      </DialogContent>
    </Dialog>
  </UnitLayout>;
}
