'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Box,
  Check,
  Copy,
  Download,
  Eye,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
  Trash2,
  Upload,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { publicGet } from '@/lib/api/public-api.mjs';
import { openStudio } from './studio-viewer.mjs';
import {
  STUDIO_CATALOG,
  STUDIO_COLORS,
  STUDIO_ENVIRONMENTS,
  STUDIO_PLACE_TYPES,
  bindSceneToRoomSeats,
  createStudioObject,
  generateSceneFromSeats,
  inferEnvironment,
  normalizeSeatCode,
  sanitizeSceneForPublish,
} from './studio-builder.mjs';
import styles from './seat-selection.module.css';

const CATALOG_CATEGORIES = ['Assentos', 'Projeção e Palco', 'Estrutura', 'Cenário e Luz'];
const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

function readThemePalette(node) {
  const probe = document.createElement('canvas').getContext('2d');
  const style = getComputedStyle(node);
  const hex = (property, fallback) => {
    const color = style.getPropertyValue(property).trim();
    if (!probe || !color) return fallback;
    probe.clearRect(0, 0, 1, 1);
    probe.fillStyle = color;
    probe.fillRect(0, 0, 1, 1);
    return (
      '#' +
      Array.from(probe.getImageData(0, 0, 1, 1).data)
        .slice(0, 3)
        .map(value => value.toString(16).padStart(2, '0'))
        .join('')
    );
  };
  return [
    hex('--background', '#231915'),
    hex('--primary', '#eec47c'),
    hex('--foreground', '#f5e9df'),
  ];
}

export default function RoomSceneBuilder({
  mode = 'room',
  roomName = 'Sala CineAstra',
  roomType = '2D',
  spaceType = 'CINEMA',
  seats = [],
  path,
  request,
  publicSceneUrl,
  value,
  onChange,
  onPublished,
}) {
  const seatDatalistId = useId();
  const canvasRef = useRef(null);
  const viewerRef = useRef(null);
  const gestureRef = useRef(null);
  const publishLock = useRef(false);

  const [internalScene, setInternalScene] = useState(() =>
    generateSceneFromSeats({ roomName, roomType, spaceType, seats }),
  );
  const scene = value ?? internalScene;

  const [selectedId, setSelectedId] = useState(() => scene.objects[0]?.id ?? null);
  const [newPieceType, setNewPieceType] = useState('seat');
  const [cameraMode, setCameraMode] = useState('overview');
  const [webglFailed, setWebglFailed] = useState(false);
  const shouldLoadExisting = Boolean(mode === 'room' && publicSceneUrl);
  const [loadedKey, setLoadedKey] = useState('');
  const loadingExisting = shouldLoadExisting && loadedKey !== publicSceneUrl;
  const [hasPublishedScene, setHasPublishedScene] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [preset, setPreset] = useState(null);

  const activeSeats = useMemo(() => seats.filter(seat => !seat.status || seat.status === 'ATIVA'), [seats]);
  const hasPersistedSeats = useMemo(
    () => activeSeats.some(seat => seat.id_assento != null && /^[1-9]\d{0,9}$/.test(String(seat.id_assento))),
    [activeSeats],
  );

  const seatCodeToId = useMemo(
    () =>
      new Map(
        activeSeats
          .filter(seat => seat.id_assento != null)
          .map(seat => [normalizeSeatCode(`${seat.fileira}-${seat.numero}`), String(seat.id_assento)]),
      ),
    [activeSeats],
  );

  const seatIdToCode = useMemo(
    () => new Map(Array.from(seatCodeToId, ([code, id]) => [id, code])),
    [seatCodeToId],
  );

  function commitScene(nextScene) {
    setError('');
    setNotice('');
    if (onChange) onChange(nextScene);
    else setInternalScene(nextScene);
  }

  // Carrega cena 3D já publicada quando aberto em modo de edição de sala
  useEffect(() => {
    if (!shouldLoadExisting) return;
    const abort = new AbortController();
    publicGet(publicSceneUrl, { signal: abort.signal })
      .then(loaded => {
        if (abort.signal.aborted) return;
        const clean = sanitizeSceneForPublish(loaded);
        setHasPublishedScene(true);
        if (onChange) onChange(clean);
        else setInternalScene(clean);
        setSelectedId(clean.objects[0]?.id ?? null);
      })
      .catch(cause => {
        if (abort.signal.aborted) return;
        setHasPublishedScene(false);
        if (cause?.status && cause.status !== 404) {
          setError('Não foi possível carregar o modelo 3D salvo. Gerando prévia inicial a partir dos assentos.');
        }
        const generated = generateSceneFromSeats({ roomName, roomType, spaceType, seats });
        if (onChange) onChange(generated);
        else setInternalScene(generated);
        setSelectedId(generated.objects[0]?.id ?? null);
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoadedKey(publicSceneUrl);
      });
    return () => abort.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldLoadExisting, publicSceneUrl]);

  // Inicializa instância WebGL2 uma única vez e atualiza cena via updateScene
  useEffect(() => {
    if (webglFailed || loadingExisting) return;
    const node = canvasRef.current;
    if (!node) return;
    let view;
    try {
      view = openStudio(node, scene, () => setWebglFailed(true));
    } catch {
      const frame = requestAnimationFrame(() => setWebglFailed(true));
      return () => cancelAnimationFrame(frame);
    }
    viewerRef.current = view;
    const applyTheme = () => view.setTheme(...readThemePalette(node));
    applyTheme();
    const observer = new MutationObserver(applyTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'style'],
    });
    return () => {
      observer.disconnect();
      viewerRef.current = null;
      view.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webglFailed, loadingExisting]);

  useEffect(() => {
    viewerRef.current?.updateScene(scene);
  }, [scene]);

  useEffect(() => {
    viewerRef.current?.setSeats({ selectedObjectId: selectedId });
  }, [selectedId, scene]);

  const selectedObject = useMemo(
    () => scene.objects.find(item => item.id === selectedId) ?? scene.objects[0] ?? null,
    [scene.objects, selectedId],
  );

  // Estatísticas de vínculo para publicação no backend
  const bindingStats = useMemo(() => {
    if (!hasPersistedSeats) {
      const placeCount = scene.objects.filter(obj => STUDIO_PLACE_TYPES.has(obj.type)).length;
      return {
        placeCount,
        uniqueCount: placeCount,
        missing: Math.max(0, activeSeats.length - placeCount),
        duplicates: 0,
        invalid: false,
      };
    }
    const candidates = scene.objects.filter(obj => STUDIO_PLACE_TYPES.has(obj.type));
    const validIds = new Set(activeSeats.map(seat => String(seat.id_assento)));
    const assigned = candidates
      .map(obj => (obj.seatId && validIds.has(String(obj.seatId)) ? String(obj.seatId) : null))
      .filter(Boolean);
    const unique = new Set(assigned);
    return {
      placeCount: candidates.length,
      uniqueCount: unique.size,
      missing: Math.max(0, activeSeats.length - unique.size),
      duplicates: assigned.length - unique.size,
      invalid: candidates.some(obj => obj.seatId && !validIds.has(String(obj.seatId))),
    };
  }, [activeSeats, hasPersistedSeats, scene.objects]);

  function updateObject(id, patch) {
    commitScene({
      ...scene,
      objects: scene.objects.map(obj => (obj.id === id ? { ...obj, ...patch } : obj)),
    });
  }

  function addObject() {
    if (scene.objects.length >= 1200) {
      setError('A cena atingiu o limite máximo de 1200 objetos.');
      return;
    }
    const base = selectedObject
      ? { x: selectedObject.x + 2.2, z: selectedObject.z, rotation: selectedObject.rotation }
      : { x: 0, z: 0, rotation: STUDIO_PLACE_TYPES.has(newPieceType) ? Math.PI : 0 };
    const created = createStudioObject(newPieceType, base, scene.objects);
    commitScene({ ...scene, objects: [...scene.objects, created] });
    setSelectedId(created.id);
  }

  function duplicateSelected() {
    if (!selectedObject || scene.objects.length >= 1200) return;
    const copy = createStudioObject(
      selectedObject.type,
      {
        ...selectedObject,
        id: undefined,
        seatId: undefined,
        x: selectedObject.x + 2,
        label: `${selectedObject.label} (cópia)`.slice(0, 100),
      },
      scene.objects,
    );
    commitScene({ ...scene, objects: [...scene.objects, copy] });
    setSelectedId(copy.id);
  }

  function removeSelected() {
    if (!selectedObject) return;
    if (scene.objects.length <= 1) {
      setError('A cena precisa manter pelo menos 1 objeto.');
      return;
    }
    const remaining = scene.objects.filter(obj => obj.id !== selectedObject.id);
    commitScene({ ...scene, objects: remaining });
    setSelectedId(remaining[0]?.id ?? null);
  }

  function regenerateFromSeats(nextEnvironment) {
    const regenerated = generateSceneFromSeats({
      roomName,
      roomType,
      spaceType,
      environment: nextEnvironment,
      seats,
    });
    commitScene(regenerated);
    setPreset(null);
    setSelectedId(regenerated.objects[0]?.id ?? null);
    setCameraMode('overview');
    viewerRef.current?.overview();
    setNotice('Modelo 3D gerado a partir da disposição atual dos assentos.');
  }

  function autoBindSeats() {
    const bound = bindSceneToRoomSeats(scene, seats);
    commitScene(bound);
    setNotice('Vínculos entre poltronas 3D e assentos da sala atualizados.');
  }

  async function importJson(file) {
    if (!file) return;
    setError('');
    setNotice('');
    try {
      if (file.size > 384 * 1024) throw new Error('O arquivo deve ter até 384 KB.');
      const parsed = JSON.parse(await file.text());
      if (
        parsed?.format !== 'CineAstra-Studio-3D' ||
        parsed.version !== 2 ||
        !Array.isArray(parsed.objects) ||
        !parsed.objects.length ||
        parsed.objects.length > 1200
      ) {
        throw new Error('Selecione um arquivo válido do Studio 3D (versão 2).');
      }
      const clean = sanitizeSceneForPublish(parsed);
      const bound = hasPersistedSeats ? bindSceneToRoomSeats(clean, seats) : clean;
      commitScene(bound);
      setSelectedId(bound.objects[0]?.id ?? null);
      setNotice('Arquivo JSON importado para o construtor 3D.');
    } catch (cause) {
      setError(cause instanceof SyntaxError ? 'Não foi possível ler o arquivo JSON selecionado.' : cause.message);
    }
  }

  function exportJson() {
    const clean = sanitizeSceneForPublish(scene);
    const blob = new Blob([JSON.stringify(clean, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(clean.name || 'sala-3d').toLowerCase().replace(/[^a-z0-9-_]+/g, '-')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function publishScene() {
    if (mode !== 'room' || !request || !path || pending || publishLock.current) return;
    if (!hasPersistedSeats) {
      setError('Cadastre os assentos ativos da sala antes de publicar o modelo 3D.');
      return;
    }
    if (bindingStats.missing > 0 || bindingStats.duplicates > 0 || bindingStats.invalid) {
      setError('Vincule todos os assentos ativos da sala sem repetições antes de publicar.');
      return;
    }
    publishLock.current = true;
    setPending(true);
    setError('');
    setNotice('');
    try {
      const payload = sanitizeSceneForPublish(scene);
      await request(`${path}/scene`, { method: 'PATCH', body: payload });
      setHasPublishedScene(true);
      setNotice('Modelo 3D publicado para os clientes.');
      onPublished?.(payload);
    } catch (cause) {
      setError(cause.message);
    } finally {
      publishLock.current = false;
      setPending(false);
    }
  }

  function resolveSeatCode(value) {
    const code = normalizeSeatCode(value);
    return seatCodeToId.get(code) ?? seatCodeToId.get(code.replace(/^([A-Z]+)(\d+)$/, '$1-$2')) ?? '';
  }

  function handleCanvasPointerUp(event) {
    const drag = gestureRef.current;
    if (drag?.id !== event.pointerId) return;
    gestureRef.current = null;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (
      drag.moved ||
      Math.hypot(event.clientX - drag.x, event.clientY - drag.y) >= 5 ||
      event.clientX < bounds.left ||
      event.clientX >= bounds.right ||
      event.clientY < bounds.top ||
      event.clientY >= bounds.bottom
    ) {
      return;
    }
    const pickedId = viewerRef.current?.pickObject(event.clientX, event.clientY);
    if (pickedId) {
      setSelectedId(pickedId);
      if (cameraMode === 'inside') viewerRef.current?.inside(pickedId);
    }
  }

  function enterFirstPerson() {
    if (!selectedObject) return;
    setCameraMode('inside');
    viewerRef.current?.inside(selectedObject.id);
  }

  const fallbackEnvironment = inferEnvironment({ spaceType, roomType });

  return (
    <div className={styles.builderShell}>
      <div className={styles.builderTopbar}>
        <div className={styles.builderTopbarGroup}>
          <label className={styles.builderField}>
            Modelo inicial 3D
            <select
              value={preset ?? scene.environment ?? fallbackEnvironment}
              onChange={event => setPreset(event.target.value)}
            >
              {STUDIO_ENVIRONMENTS.map(env => (
                <option key={env.id} value={env.id}>
                  {env.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.builderField}>
            Nome do modelo
            <input
              value={scene.name}
              maxLength={70}
              onChange={event => commitScene({ ...scene, name: event.target.value })}
            />
          </label>
          <label className={styles.builderField} style={{ width: '96px' }}>
            Escala sala
            <input
              type="number"
              min={5}
              max={240}
              step={1}
              value={scene.sceneSize}
              onChange={event =>
                commitScene({ ...scene, sceneSize: Math.min(240, Math.max(5, Number(event.target.value) || 28)) })
              }
            />
          </label>
        </div>
        <div className={styles.builderActionRow}>
          <Button type="button" variant="outline" size="sm" disabled={loadingExisting} onClick={() => regenerateFromSeats(preset ?? scene.environment ?? fallbackEnvironment)}>
            <Wand2 size={15} aria-hidden="true" />
            Gerar 3D dos assentos
          </Button>
          {hasPersistedSeats && (
            <Button type="button" variant="outline" size="sm" onClick={autoBindSeats}>
              <Check size={15} aria-hidden="true" />
              Auto-vincular
            </Button>
          )}
          <label className={styles.builderFileLabel}>
            <Upload size={15} aria-hidden="true" />
            Importar JSON
            <input type="file" accept=".json,application/json" onChange={event => importJson(event.target.files?.[0])} />
          </label>
          <Button type="button" variant="outline" size="sm" onClick={exportJson}>
            <Download size={15} aria-hidden="true" />
            Exportar JSON
          </Button>
        </div>
      </div>

      {loadingExisting ? (
        <p role="status" className={styles.sceneMessage}>
          Carregando construtor 3D…
        </p>
      ) : (
        <div className={styles.builderWorkspace}>
          <div className={styles.builderViewport}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className={styles.studioToolbar} role="group" aria-label="Câmera do construtor 3D">
                <button
                  type="button"
                  aria-pressed={cameraMode === 'overview'}
                  onClick={() => {
                    setCameraMode('overview');
                    viewerRef.current?.overview();
                  }}
                >
                  <Box size={15} aria-hidden="true" />
                  Visão geral
                </button>
                <button
                  type="button"
                  aria-pressed={cameraMode === 'inside'}
                  disabled={!selectedObject || !STUDIO_PLACE_TYPES.has(selectedObject.type)}
                  onClick={enterFirstPerson}
                >
                  <Eye size={15} aria-hidden="true" />
                  Primeira pessoa
                </button>
                <button type="button" aria-label="Aproximar câmera" onClick={() => viewerRef.current?.zoom(0.84)}>
                  <Plus size={15} aria-hidden="true" />
                </button>
                <button type="button" aria-label="Afastar câmera" onClick={() => viewerRef.current?.zoom(1.18)}>
                  <Minus size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Resetar câmera"
                  onClick={() => {
                    setCameraMode('overview');
                    viewerRef.current?.overview();
                  }}
                >
                  <RotateCcw size={15} aria-hidden="true" />
                </button>
              </div>
              <span className={styles.sceneMessage}>Arraste para girar · Clique em qualquer peça para editar</span>
            </div>

            {webglFailed ? (
              <p role="status" className={styles.sceneMessage}>
                A prévia WebGL2 não está disponível neste dispositivo. Você ainda pode editar os objetos na barra lateral ou importar/publicar o JSON.
              </p>
            ) : (
              <canvas
                ref={canvasRef}
                className={styles.builderCanvas}
                tabIndex={0}
                aria-label="Construtor 3D da sala. Arraste ou use as setas para girar a câmera e clique em um objeto para editar."
                onKeyDown={event => {
                  const offsets = {
                    ArrowLeft: [14, 0],
                    ArrowRight: [-14, 0],
                    ArrowUp: [0, 12],
                    ArrowDown: [0, -12],
                  };
                  if (!offsets[event.key]) return;
                  event.preventDefault();
                  viewerRef.current?.look(...offsets[event.key]);
                }}
                onPointerDown={event => {
                  if (!event.isPrimary || event.button !== 0) return;
                  gestureRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
                  event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={event => {
                  const drag = gestureRef.current;
                  if (drag?.id !== event.pointerId) return;
                  const dx = event.clientX - drag.x;
                  const dy = event.clientY - drag.y;
                  if (!drag.moved && Math.hypot(dx, dy) < 5) return;
                  gestureRef.current = { ...drag, x: event.clientX, y: event.clientY, moved: true };
                  viewerRef.current?.look(dx, dy);
                }}
                onPointerUp={handleCanvasPointerUp}
                onPointerCancel={() => {
                  gestureRef.current = null;
                }}
              />
            )}

            <div className={styles.builderStatusBar}>
              <span>
                {scene.objects.length} / 1200 objetos ·{' '}
                {hasPersistedSeats
                  ? `${bindingStats.uniqueCount} de ${activeSeats.length} assentos ativos vinculados`
                  : `${bindingStats.placeCount} lugares no modelo 3D`}
                {bindingStats.duplicates > 0 ? ` · ${bindingStats.duplicates} duplicado(s)` : ''}
              </span>
              {mode === 'room' && (
                <span>{hasPublishedScene ? 'Modelo 3D já publicado na sala' : 'Rascunho ainda não publicado'}</span>
              )}
            </div>
          </div>

          <aside className={styles.builderInspector} aria-label="Inspetor de objetos 3D">
            <div className={styles.builderSection}>
              <h4>Adicionar objeto ao 3D</h4>
              <div className="flex gap-2 items-end">
                <label className={styles.builderField} style={{ flex: 1 }}>
                  Peça do Studio
                  <select value={newPieceType} onChange={event => setNewPieceType(event.target.value)}>
                    {CATALOG_CATEGORIES.map(category => (
                      <optgroup key={category} label={category}>
                        {STUDIO_CATALOG.filter(item => item.category === category).map(item => (
                          <option key={item.type} value={item.type}>
                            {item.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
                <Button type="button" size="sm" onClick={addObject}>
                  <Plus size={15} aria-hidden="true" />
                  Adicionar
                </Button>
              </div>
            </div>

            <div className={styles.builderSection}>
              <h4>Selecionar objeto ({scene.objects.length})</h4>
              <label className={styles.builderField}>
                Objeto na cena
                <select
                  value={selectedObject?.id ?? ''}
                  onChange={event => setSelectedId(Number(event.target.value))}
                >
                  {scene.objects.map(obj => (
                    <option key={obj.id} value={obj.id}>
                      #{obj.id} · {obj.label || obj.type}
                      {obj.seatId && seatIdToCode.get(String(obj.seatId))
                        ? ` [${seatIdToCode.get(String(obj.seatId))}]`
                        : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {selectedObject && (
              <div className={styles.builderSection}>
                <div className="flex items-center justify-between gap-2">
                  <h4>Editar #{selectedObject.id}</h4>
                  <div className="flex gap-1">
                    <Button type="button" variant="outline" size="sm" onClick={duplicateSelected} title="Duplicar objeto">
                      <Copy size={14} aria-hidden="true" />
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={removeSelected} title="Remover objeto">
                      <Trash2 size={14} aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className={styles.builderField}>
                    Rótulo
                    <input
                      value={selectedObject.label}
                      maxLength={100}
                      onChange={event => updateObject(selectedObject.id, { label: event.target.value })}
                    />
                  </label>
                  <label className={styles.builderField}>
                    Tipo
                    <select
                      value={selectedObject.type}
                      onChange={event => {
                        const nextType = event.target.value;
                        const patch = { type: nextType };
                        if (!STUDIO_PLACE_TYPES.has(nextType)) patch.seatId = undefined;
                        updateObject(selectedObject.id, patch);
                      }}
                    >
                      {STUDIO_CATALOG.map(item => (
                        <option key={item.type} value={item.type}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {hasPersistedSeats && STUDIO_PLACE_TYPES.has(selectedObject.type) && (
                  <>
                    <datalist id={seatDatalistId}>
                      {Array.from(seatCodeToId.keys(), code => (
                        <option key={code} value={code} />
                      ))}
                    </datalist>
                    <label className={styles.builderField}>
                      Vínculo com assento da sala
                      <input
                        list={seatDatalistId}
                        value={seatIdToCode.get(String(selectedObject.seatId ?? '')) ?? ''}
                        placeholder="Ex.: A-1"
                        onChange={event => {
                          const raw = event.target.value;
                          const matchedId = resolveSeatCode(raw);
                          updateObject(selectedObject.id, {
                            seatId: matchedId || undefined,
                            ...(matchedId ? { label: normalizeSeatCode(raw) } : {}),
                          });
                        }}
                      />
                    </label>
                  </>
                )}

                <div className={styles.builderTriple}>
                  {[
                    ['x', 'Pos X'],
                    ['y', 'Alt Y'],
                    ['z', 'Prof Z'],
                  ].map(([axis, labelText]) => (
                    <label key={axis} className={styles.builderField}>
                      {labelText}
                      <input
                        type="number"
                        step={0.5}
                        min={-2000}
                        max={2000}
                        value={selectedObject[axis]}
                        onChange={event =>
                          updateObject(selectedObject.id, {
                            [axis]: Math.min(2000, Math.max(-2000, Number(event.target.value) || 0)),
                          })
                        }
                      />
                    </label>
                  ))}
                </div>

                <div className={styles.builderTriple}>
                  {[
                    ['sx', 'Larg'],
                    ['sy', 'Alt'],
                    ['sz', 'Comp'],
                  ].map(([axis, labelText]) => (
                    <label key={axis} className={styles.builderField}>
                      {labelText}
                      <input
                        type="number"
                        step={0.1}
                        min={0.05}
                        max={200}
                        value={selectedObject[axis]}
                        onChange={event =>
                          updateObject(selectedObject.id, {
                            [axis]: Math.min(200, Math.max(0.05, Number(event.target.value) || 1)),
                          })
                        }
                      />
                    </label>
                  ))}
                </div>

                <div className="flex items-end gap-2">
                  <label className={styles.builderField} style={{ flex: 1 }}>
                    Rotação (°)
                    <input
                      type="number"
                      step={15}
                      value={Math.round(selectedObject.rotation * RAD_TO_DEG)}
                      onChange={event =>
                        updateObject(selectedObject.id, {
                          rotation: Math.round(((Number(event.target.value) || 0) * DEG_TO_RAD) * 100) / 100,
                        })
                      }
                    />
                  </label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateObject(selectedObject.id, {
                        rotation: Math.round((selectedObject.rotation + Math.PI / 4) * 100) / 100,
                      })
                    }
                  >
                    <RotateCw size={14} aria-hidden="true" />
                    +45°
                  </Button>
                </div>

                <div className="grid gap-1.5">
                  <span className="text-xs font-semibold">Cor do objeto</span>
                  <div className={styles.builderSwatches}>
                    {STUDIO_COLORS.map(swatch => (
                      <button
                        key={swatch.hex}
                        type="button"
                        className={styles.builderSwatch}
                        style={{ background: swatch.hex }}
                        title={swatch.label}
                        aria-label={swatch.label}
                        aria-pressed={selectedObject.color?.toLowerCase() === swatch.hex}
                        onClick={() => updateObject(selectedObject.id, { color: swatch.hex })}
                      />
                    ))}
                    <input
                      type="color"
                      aria-label="Cor personalizada"
                      value={selectedObject.color || '#494d59'}
                      onChange={event => updateObject(selectedObject.id, { color: event.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {mode === 'room' && (
              <div className={styles.builderSection}>
                {!hasPersistedSeats && (
                  <p className="text-xs text-muted-foreground">
                    Cadastre os assentos ativos da sala para publicar o modelo 3D.
                  </p>
                )}
                <Button
                  type="button"
                  disabled={
                    pending ||
                    !hasPersistedSeats ||
                    bindingStats.missing > 0 ||
                    bindingStats.duplicates > 0 ||
                    bindingStats.invalid
                  }
                  onClick={publishScene}
                >
                  {pending ? 'Publicando modelo…' : 'Publicar modelo 3D na sala'}
                </Button>
              </div>
            )}
          </aside>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
    </div>
  );
}
