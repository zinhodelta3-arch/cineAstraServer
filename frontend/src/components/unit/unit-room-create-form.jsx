'use client';

import { useMemo, useRef, useState } from 'react';
import { Box, Grid2X2 } from 'lucide-react';
import { unitOperation } from '@/hooks/unit/use-unit-data';
import SeatMap from '@/components/cinema/assentos/seat-map';
import RoomSceneBuilder from '@/components/cinema/assentos/room-scene-builder';
import { seatFromRoom, seatType } from '@/components/cinema/assentos/seat-layout.mjs';
import {
  MAX_SEAT_POSITION,
  SEAT_TEMPLATES,
  buildSeatBatchDraft,
  defaultTemplateForSpace,
  findDuplicateSeat,
  fitSeatTemplate,
} from '@/components/cinema/assentos/seat-batch.mjs';
import {
  STUDIO_PLACE_TYPES,
  bindSceneToRoomSeats,
  generateSceneFromSeats,
  inferEnvironment,
  sanitizeSceneForPublish,
} from '@/components/cinema/assentos/studio-builder.mjs';
import seatStyles from '@/components/cinema/assentos/seat-selection.module.css';
import styles from './unit.module.css';

const roomTypes = ['2D', '3D', '4DX', 'VIP', 'IMAX'];

export default function UnitRoomCreateForm({
  localId,
  locationName,
  spaceType = 'CINEMA',
  request = unitOperation,
  onCancel,
  onCreated,
  onPartialCreated,
  onPendingChange,
}) {
  const initialTemplate = defaultTemplateForSpace({ spaceType, roomType: '2D' });
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState('2D');
  const [status, setStatus] = useState('INATIVA');
  const [layoutMode, setLayoutMode] = useState(initialTemplate);
  const [syncCapacity, setSyncCapacity] = useState(true);
  const [manualCapacity, setManualCapacity] = useState(40);
  const [config, setConfig] = useState(() => ({
    ...fitSeatTemplate(initialTemplate, 400),
    firstRow: 'A',
    firstNumber: 1,
    firstPosition: 1,
  }));
  const [special, setSpecial] = useState({});
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [previewMode, setPreviewMode] = useState('3d');
  const [publish3d, setPublish3d] = useState(true);
  const [activateAfter, setActivateAfter] = useState(true);
  const [customScene, setCustomScene] = useState(null);
  const [pending, setPending] = useState(false);
  const [stepStatus, setStepStatus] = useState('');
  const [error, setError] = useState('');
  const [partialRoom, setPartialRoom] = useState(null);
  const lockRef = useRef(false);

  const hasSeats = layoutMode !== 'empty';
  const { valid: validBatch, draft } = useMemo(
    () => (hasSeats ? buildSeatBatchDraft(config, special) : { valid: true, draft: [] }),
    [hasSeats, config, special],
  );
  const capacity = hasSeats && syncCapacity ? Math.max(1, draft.length) : Number(manualCapacity);
  const batchError = !hasSeats
    ? ''
    : !validBatch
      ? 'Confira as medidas do layout. Cada lote permite até 400 lugares.'
      : !Number.isInteger(capacity) || capacity < 1 || capacity > MAX_SEAT_POSITION
        ? 'Informe uma capacidade válida para a sala.'
        : draft.length > capacity
          ? `O layout gera ${draft.length} assentos, acima da capacidade informada (${capacity}).`
          : findDuplicateSeat(draft, 'number') || findDuplicateSeat(draft, 'position');

  const autoScene = useMemo(
    () =>
      generateSceneFromSeats({
        roomName: nome.trim() || 'Nova sala',
        roomType: tipo,
        spaceType,
        environment: customScene?.environment ?? inferEnvironment({ spaceType, roomType: tipo }),
        seats: draft,
      }),
    [nome, tipo, spaceType, draft, customScene?.environment],
  );

  const sceneValue = customScene ?? autoScene;
  const chosenSeat = draft.find(row => row.id_assento === selectedSeat);

  function updateConfig(name, value) {
    setCustomScene(null);
    setConfig(current => ({ ...current, [name]: value }));
  }

  function handleLayoutModeChange(nextMode) {
    setLayoutMode(nextMode);
    setSpecial({});
    setSelectedSeat(null);
    setCustomScene(null);
    if (nextMode !== 'empty') {
      setConfig(current => ({ ...current, ...fitSeatTemplate(nextMode, 400) }));
    }
  }

  function handleTypeChange(nextType) {
    setTipo(nextType);
    setCustomScene(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (pending || partialRoom || lockRef.current) return;
    const trimmedName = nome.trim();
    if (!trimmedName || trimmedName.length > 100) {
      setError('Informe um nome válido para a sala.');
      return;
    }
    if (!Number.isInteger(capacity) || capacity < 1 || capacity > MAX_SEAT_POSITION) {
      setError('Capacidade inválida.');
      return;
    }
    if (batchError) {
      setError(batchError);
      return;
    }

    lockRef.current = true;
    setPending(true);
    onPendingChange?.(true);
    setError('');
    let createdRoom = null;

    try {
      setStepStatus('Criando sala…');
      createdRoom = await request(`/locations/${localId}/rooms`, {
        method: 'POST',
        body: {
          nome: trimmedName,
          capacidade: capacity,
          tipo,
          status: status === 'MANUTENCAO' ? 'MANUTENCAO' : 'INATIVA',
        },
      });

      if (hasSeats && draft.length > 0) {
        setStepStatus(`Cadastrando ${draft.length} assentos…`);
        await request(`/locations/${localId}/rooms/${createdRoom.id_sala}/seats/batch`, {
          method: 'POST',
          body: {
            seats: draft.map(({ fileira, numero, posicao_visual, tipo: seatKind, status: seatStatus }) => ({
              fileira,
              numero,
              posicao_visual,
              tipo: seatKind,
              status: seatStatus,
            })),
          },
        });

        if (publish3d) {
          setStepStatus('Vinculando e publicando modelo 3D…');
          const persistedLayout = await request(`/locations/${localId}/rooms/${createdRoom.id_sala}/seat-map`);
          const persistedSeats = persistedLayout?.seats ?? [];
          const activePersisted = persistedSeats.filter(row => row.status === 'ATIVA');

          let sceneToPublish = customScene
            ? bindSceneToRoomSeats(customScene, persistedSeats)
            : generateSceneFromSeats({
                roomName: trimmedName,
                roomType: tipo,
                spaceType: persistedLayout?.spaceType ?? spaceType,
                seats: persistedSeats,
              });

          const boundIds = new Set(
            sceneToPublish.objects
              .filter(obj => STUDIO_PLACE_TYPES.has(obj.type) && obj.seatId)
              .map(obj => String(obj.seatId)),
          );
          if (boundIds.size !== activePersisted.length || activePersisted.some(seat => !boundIds.has(String(seat.id_assento)))) {
            sceneToPublish = generateSceneFromSeats({
              roomName: trimmedName,
              roomType: tipo,
              spaceType: persistedLayout?.spaceType ?? spaceType,
              environment: sceneToPublish.environment,
              seats: persistedSeats,
            });
          }

          await request(`/locations/${localId}/rooms/${createdRoom.id_sala}/scene`, {
            method: 'PATCH',
            body: sanitizeSceneForPublish(sceneToPublish),
          });
        }

        if (activateAfter && draft.length === capacity) {
          setStepStatus('Ativando sala…');
          const activated = await request(`/locations/${localId}/rooms/${createdRoom.id_sala}`, {
            method: 'PATCH',
            body: { status: 'ATIVA' },
          });
          if (activated) createdRoom = activated;
        }
      }

      const notice = hasSeats
        ? publish3d
          ? 'Sala, assentos e modelo 3D criados com sucesso.'
          : 'Sala e assentos criados com sucesso.'
        : 'Sala cadastrada com sucesso.';
      onCreated(createdRoom, notice);
    } catch (cause) {
      if (createdRoom) {
        setPartialRoom(createdRoom);
        onPartialCreated?.(createdRoom);
      }
      setError(
        createdRoom
          ? `A sala "${createdRoom.nome}" foi criada. Continue pela sala cadastrada. ${cause.message}`
          : cause.message,
      );
    } finally {
      lockRef.current = false;
      setPending(false);
      onPendingChange?.(false);
      setStepStatus('');
    }
  }

  return (
    <form className={seatStyles.layoutForm} onSubmit={handleSubmit}>
      <div className={seatStyles.layoutFields}>
        <label>
          Nome da sala
          <input
            name="nome"
            required
            maxLength={100}
            value={nome}
            placeholder="Ex.: Sala 1 IMAX"
            onChange={event => setNome(event.target.value)}
          />
        </label>
        <label>
          Formato
          <select name="tipo" value={tipo} onChange={event => handleTypeChange(event.target.value)}>
            {roomTypes.map(value => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Estado inicial
          <select name="status" value={status} onChange={event => setStatus(event.target.value)}>
            <option value="INATIVA">Inativa</option>
            <option value="MANUTENCAO">Manutenção</option>
          </select>
        </label>
        <label>
          Capacidade
          <input
            name="capacidade"
            type="number"
            required
            min="1"
            max={MAX_SEAT_POSITION}
            disabled={hasSeats && syncCapacity}
            value={capacity || ''}
            onChange={event => setManualCapacity(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="rounded-md border border-border p-3 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label className="grid gap-1 text-sm font-medium min-w-[220px]">
            Estrutura inicial de assentos e 3D
            <select
              value={layoutMode}
              onChange={event => handleLayoutModeChange(event.target.value)}
              className="min-h-10 rounded-md border border-border bg-background px-2.5 text-sm"
            >
              {Object.entries(SEAT_TEMPLATES).map(([value, preset]) => (
                <option key={value} value={value}>
                  {preset.label}
                </option>
              ))}
              <option value="empty">Criar sala vazia (cadastrar assentos depois)</option>
            </select>
          </label>

          {hasSeats && (
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncCapacity}
                  onChange={event => {
                    const checked = event.target.checked;
                    setSyncCapacity(checked);
                    if (!checked) setManualCapacity(Math.max(1, draft.length));
                  }}
                />
                Capacidade igual ao layout ({draft.length} lugares)
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={publish3d}
                  onChange={event => setPublish3d(event.target.checked)}
                />
                Publicar modelo 3D ao criar
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activateAfter && draft.length === capacity}
                  disabled={draft.length !== capacity || !draft.length}
                  onChange={event => setActivateAfter(event.target.checked)}
                />
                Ativar sala automaticamente
              </label>
            </div>
          )}
        </div>

        {hasSeats && (
          <>
            <div className={seatStyles.layoutFields}>
              <label>
                Primeira fileira
                <input
                  value={config.firstRow}
                  maxLength={4}
                  pattern="[A-Z]{1,4}"
                  onChange={event => updateConfig('firstRow', event.target.value.toUpperCase())}
                  required
                />
              </label>
              {[
                ['rows', 'Fileiras', 1, 100],
                ['blocks', 'Blocos por fileira', 1, 12],
                ['width', 'Assentos por bloco', 1, 100],
                ['gap', 'Largura do corredor', 0, 12],
                ['firstNumber', 'Primeiro número', 1, MAX_SEAT_POSITION],
                ['firstPosition', 'Primeira posição', 1, MAX_SEAT_POSITION],
              ].map(([name, fieldLabel, min, max]) => (
                <label key={name}>
                  {fieldLabel}
                  <input
                    type="number"
                    min={min}
                    max={max}
                    value={config[name] || (config[name] === 0 ? 0 : '')}
                    onChange={event =>
                      updateConfig(name, event.target.value === '' ? null : Number(event.target.value))
                    }
                    required
                  />
                </label>
              ))}
            </div>

            {batchError && (
              <p className="text-sm text-destructive" role="alert">
                {batchError}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                {draft.length} lugares configurados {locationName ? `· ${locationName}` : ''}
              </p>
              <div className={seatStyles.viewPicker} role="group" aria-label="Visualização da nova sala">
                <button type="button" aria-pressed={previewMode === '3d'} onClick={() => setPreviewMode('3d')}>
                  <Box size={15} aria-hidden="true" />
                  Construtor 3D
                </button>
                <button type="button" aria-pressed={previewMode === '2d'} onClick={() => setPreviewMode('2d')}>
                  <Grid2X2 size={15} aria-hidden="true" />
                  Mapa 2D e especiais
                </button>
              </div>
            </div>

            {previewMode === '2d' ? (
              <>
                <SeatMap
                  seats={draft.map(seatFromRoom)}
                  selectedSeat={selectedSeat}
                  onSeatSelect={id => setSelectedSeat(id)}
                  spaceType={spaceType}
                />
                {chosenSeat && (
                  <label className={seatStyles.specialField}>
                    Tipo de {chosenSeat.fileira}
                    {chosenSeat.numero}
                    <select
                      value={chosenSeat.tipo}
                      onChange={event => {
                        setCustomScene(null);
                        setSpecial(current => ({ ...current, [chosenSeat.id_assento]: event.target.value }));
                      }}
                    >
                      {Object.entries(seatType).map(([value, labelText]) => (
                        <option key={value} value={value}>
                          {labelText}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </>
            ) : (
              <RoomSceneBuilder
                mode="draft"
                roomName={nome.trim() || 'Nova sala'}
                roomType={tipo}
                spaceType={spaceType}
                seats={draft}
                value={sceneValue}
                onChange={nextScene => setCustomScene(nextScene)}
              />
            )}
          </>
        )}
      </div>

      {error && (
        <p className={`${styles.message} ${styles.error}`} role="alert">
          {error}
        </p>
      )}
      {stepStatus && (
        <p role="status" className="text-sm text-muted-foreground">
          {stepStatus}
        </p>
      )}

      <div className={styles.row} style={{ justifyContent: 'flex-end' }}>
        <button type="button" className={styles.secondary} disabled={pending} onClick={onCancel}>
          Voltar
        </button>
        <button type="submit" className={styles.button} disabled={pending || Boolean(batchError) || Boolean(partialRoom)}>
          {pending ? stepStatus || 'Criando sala…' : hasSeats && publish3d ? 'Criar sala com assentos e 3D' : hasSeats ? 'Criar sala com assentos' : 'Criar sala'}
        </button>
      </div>
    </form>
  );
}
