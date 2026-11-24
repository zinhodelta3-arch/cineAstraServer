'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import styles from './seat-selection.module.css';

const places = new Set(['seat','vip','bench','car']);
const normalize = value => value.trim().toUpperCase().replace(/\s+/g,'');
const objectFields = ['id','type','x','y','z','sx','sy','sz','rotation','color','label'];

export default function RoomScenePublisher({ path, request, seats }) {
  const listId = useId();
  const [draft,setDraft] = useState(null);
  const [labels,setLabels] = useState({});
  const [error,setError] = useState('');
  const [notice,setNotice] = useState('');
  const [pending,setPending] = useState(false);
  const locked = useRef(false);
  const uploadVersion = useRef(0);
  const active = useMemo(() => seats.filter(seat => seat.status === 'ATIVA'),[seats]);
  const byLabel = useMemo(() => new Map(active.map(seat => [normalize(`${seat.fileira}-${seat.numero}`),String(seat.id_assento)])),[active]);
  const byId = useMemo(() => new Map(Array.from(byLabel,([label,id])=>[id,label])),[byLabel]);
  function seatIdFor(label) {
    const key = normalize(label);
    return byLabel.get(key) ?? byLabel.get(key.replace(/^([A-Z]+)(\d+)$/,'$1-$2'));
  }
  const candidates = draft?.objects.filter(object => places.has(object.type)) ?? [];
  const assignments = new Map(candidates.map(object => [object.id,seatIdFor(labels[object.id] ?? '')]));
  const assigned = Array.from(assignments.values()).filter(Boolean);
  const unique = new Set(assigned);
  const missing = active.length - unique.size;
  const duplicates = assigned.length - unique.size;
  const invalid = assigned.length !== candidates.filter(object=>labels[object.id]?.trim()).length;

  async function load(file) {
    const version = ++uploadVersion.current;
    setError(''); setNotice(''); setDraft(null); setLabels({});
    if (!file) return;
    try {
      if (file.size > 384 * 1024) throw new Error('O arquivo deve ter até 384 KB.');
      const scene = JSON.parse(await file.text());
      if (version !== uploadVersion.current) return;
      if (scene?.format !== 'CineAstra-Studio-3D' || scene.version !== 2 ||
          !Array.isArray(scene.objects) || !scene.objects.length || scene.objects.length > 1200 ||
          scene.objects.some(object => !object || !Number.isInteger(object.id) || typeof object.label !== 'string') ||
          new Set(scene.objects.map(object => object.id)).size !== scene.objects.length) {
        throw new Error('Selecione um arquivo válido exportado pelo Studio 3D, versão 2.');
      }
      const { format, version: sceneVersion, environment, name, sceneSize } = scene;
      setDraft({ format, version: sceneVersion, environment, name, sceneSize, objects: scene.objects.map(object =>
        Object.fromEntries(objectFields.map(field => [field,object[field]]))) });
      setLabels(Object.fromEntries(scene.objects.filter(object => places.has(object.type)).map(object =>
        [object.id,byId.get(String(object.seatId)) ?? byId.get(seatIdFor(object.label)) ?? ''])));
    } catch (cause) {
      if (version === uploadVersion.current) setError(cause instanceof SyntaxError ? 'Não foi possível ler o JSON exportado pelo Studio 3D.' : cause.message);
    }
  }

  async function publish(event) {
    event.preventDefault();
    if (!draft || pending || locked.current || missing || duplicates || invalid || !active.length) return;
    locked.current = true;
    setPending(true); setError(''); setNotice('');
    try {
      await request(`${path}/scene`,{ method:'PATCH',body:{ ...draft,objects:draft.objects.map(object => {
        const seatId = assignments.get(object.id);
        return seatId ? { ...object,seatId } : object;
      }) } });
      setNotice('Modelo 3D publicado para os clientes.');
    } catch (cause) {
      setError(cause.message);
    } finally {
      locked.current = false;
      setPending(false);
    }
  }

  return <details className="rounded-md border border-border p-3">
    <summary className="cursor-pointer font-semibold">Publicar modelo 3D</summary>
    <form className={styles.layoutForm + ' mt-3'} onSubmit={publish}>
      <p className="text-sm text-muted-foreground">Importe o JSON exportado pelo Studio 3D e confira o vínculo de cada assento ativo da sala antes de publicar.</p>
      <label className="grid gap-1 text-sm">Modelo do Studio 3D
        <input type="file" accept=".json,application/json" disabled={pending || !active.length} onChange={event=>load(event.target.files[0])} />
      </label>
      {!active.length && <p className="text-sm text-muted-foreground">Cadastre os assentos da sala para publicar o modelo.</p>}
      {draft && <>
        <p role="status" className="text-sm">{unique.size} de {active.length} assentos vinculados.
          {duplicates > 0 && ` Há ${duplicates} vínculos repetidos.`}</p>
        <datalist id={listId}>{Array.from(byLabel.keys(),label=><option key={label} value={label} />)}</datalist>
        <div className={styles.studioBindings}>
          {candidates.map(object => <label key={object.id}>{object.label || `Lugar do modelo ${object.id}`}
            <input list={listId} value={labels[object.id] ?? ''} placeholder="Assento da sala"
              disabled={pending} aria-invalid={Boolean(labels[object.id] && !assignments.get(object.id))}
              onChange={event=>{setNotice('');setLabels(current=>({...current,[object.id]:event.target.value}));}} />
          </label>)}
        </div>
        <Button type="submit" className="justify-self-start" disabled={pending || Boolean(missing || duplicates) || invalid}>
          {pending ? 'Publicando…' : 'Publicar modelo'}
        </Button>
      </>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="text-sm">{notice}</p>}
    </form>
  </details>;
}
