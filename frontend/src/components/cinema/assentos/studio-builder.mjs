// Gerador, catálogo de peças e sanitização para o CineAstra Studio 3D v2.

export const STUDIO_PLACE_TYPES = new Set(['seat', 'vip', 'bench', 'car']);

export const STUDIO_ENVIRONMENTS = [
  { id: 'cinema', label: 'Cinema tradicional' },
  { id: 'theater', label: 'Teatro / Palco' },
  { id: 'drivein', label: 'Drive-in' },
  { id: 'stadium', label: 'Estádio / Arena' },
  { id: 'park', label: 'Parque / Ar livre' },
  { id: 'container', label: 'Sala container' },
  { id: 'banker', label: 'Sala bunker' },
  { id: 'custom', label: 'Personalizado' },
];

export const STUDIO_COLORS = [
  { label: 'Veludo bordô', hex: '#8d475a' },
  { label: 'Azul marinho', hex: '#506a89' },
  { label: 'Dourado', hex: '#c6a06b' },
  { label: 'Grafite', hex: '#494d59' },
  { label: 'Turquesa', hex: '#3e8a87' },
  { label: 'Âmbar', hex: '#c58051' },
  { label: 'Creme', hex: '#d0bd9e' },
  { label: 'Madeira', hex: '#865c45' },
  { label: 'Obsidiana', hex: '#343743' },
];

export const STUDIO_CATALOG = [
  { type: 'seat', label: 'Poltrona padrão', category: 'Assentos', color: '#8d475a', sx: 1, sy: 1, sz: 1, y: 0 },
  { type: 'vip', label: 'Poltrona VIP', category: 'Assentos', color: '#c6a06b', sx: 1, sy: 1, sz: 1, y: 0 },
  { type: 'bench', label: 'Banco / Sofá', category: 'Assentos', color: '#865c45', sx: 1, sy: 1, sz: 1, y: 0 },
  { type: 'car', label: 'Carro (Drive-in)', category: 'Assentos', color: '#506a89', sx: 1, sy: 1, sz: 1, y: 0 },

  { type: 'screen', label: 'Tela de projeção', category: 'Projeção e Palco', color: '#506a89', sx: 1.4, sy: 1.2, sz: 1, y: 0 },
  { type: 'stage', label: 'Palco frontal', category: 'Projeção e Palco', color: '#865c45', sx: 1, sy: 1, sz: 1, y: 0 },
  { type: 'stage360', label: 'Palco central 360°', category: 'Projeção e Palco', color: '#8d475a', sx: 1, sy: 1, sz: 1, y: 0 },
  { type: 'curtain', label: 'Cortina cênica', category: 'Projeção e Palco', color: '#8d475a', sx: 1, sy: 1, sz: 1, y: 0 },
  { type: 'speaker', label: 'Caixa de som', category: 'Projeção e Palco', color: '#343743', sx: 1, sy: 1, sz: 1, y: 0 },
  { type: 'podium', label: 'Púlpito', category: 'Projeção e Palco', color: '#865c45', sx: 1, sy: 1, sz: 1, y: 0 },

  { type: 'floor', label: 'Piso', category: 'Estrutura', color: '#343743', sx: 18, sy: 1, sz: 18, y: -0.25 },
  { type: 'wall', label: 'Parede', category: 'Estrutura', color: '#494d59', sx: 18, sy: 7, sz: 0.6, y: 0 },
  { type: 'riser', label: 'Patamar / Degrau', category: 'Estrutura', color: '#343743', sx: 10, sy: 1, sz: 2.6, y: 0 },
  { type: 'aisle', label: 'Corredor iluminado', category: 'Estrutura', color: '#494d59', sx: 1.8, sy: 1, sz: 12, y: 0.04 },
  { type: 'bleacher', label: 'Arquibancada', category: 'Estrutura', color: '#506a89', sx: 10, sy: 1, sz: 2.6, y: 0 },
  { type: 'turf', label: 'Gramado de estádio', category: 'Estrutura', color: '#3e8a87', sx: 1, sy: 1, sz: 1, y: 0 },
  { type: 'door', label: 'Porta', category: 'Estrutura', color: '#865c45', sx: 1, sy: 1, sz: 1, y: 0 },
  { type: 'barrier', label: 'Barreira / Guarda-corpo', category: 'Estrutura', color: '#494d59', sx: 1, sy: 1, sz: 1, y: 0 },

  { type: 'ceiling-light', label: 'Luminária de teto', category: 'Cenário e Luz', color: '#d0bd9e', sx: 1, sy: 1, sz: 1, y: 4.2 },
  { type: 'sconce', label: 'Arandela de parede', category: 'Cenário e Luz', color: '#c6a06b', sx: 1, sy: 1, sz: 1, y: 1.5 },
  { type: 'light', label: 'Poste de luz', category: 'Cenário e Luz', color: '#494d59', sx: 1, sy: 1, sz: 1, y: 0 },
  { type: 'column', label: 'Coluna', category: 'Cenário e Luz', color: '#494d59', sx: 1, sy: 1, sz: 1, y: 0 },
  { type: 'rib', label: 'Nervura acústica', category: 'Cenário e Luz', color: '#494d59', sx: 1, sy: 1, sz: 1, y: 0 },
  { type: 'tree', label: 'Árvore', category: 'Cenário e Luz', color: '#3e8a87', sx: 1, sy: 1, sz: 1, y: 0 },
  { type: 'planter', label: 'Floreira', category: 'Cenário e Luz', color: '#3e8a87', sx: 1, sy: 1, sz: 1, y: 0 },
];

const catalogMap = new Map(STUDIO_CATALOG.map(item => [item.type, item]));
const collator = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });
const round2 = value => Math.round(value * 100) / 100;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function normalizeSeatCode(value) {
  return String(value ?? '').trim().toUpperCase().replace(/\s+/g, '');
}

export function inferEnvironment({ spaceType } = {}) {
  if (spaceType === 'DRIVE_IN' || spaceType === 'ESTACIONAMENTO') return 'drivein';
  if (spaceType === 'ESTADIO') return 'stadium';
  if (spaceType === 'PRACA' || spaceType === 'ESPACO_PUBLICO') return 'park';
  if (spaceType === 'TEATRO' || spaceType === 'SALAO_EVENTOS') return 'theater';
  if (spaceType === 'BUNKER') return 'banker';
  if (spaceType === 'CONTAINER') return 'container';
  if (spaceType === 'OUTRO') return 'custom';
  return 'cinema';
}

export function projectionLandmark(environment, fallback = 'Tela') {
  return { stadium: 'Campo', drivein: 'Telão', theater: 'Palco e telão', park: 'Telão' }[environment] ?? fallback;
}

export function nextSceneObjectId(objects) {
  let max = 0;
  for (const item of objects) {
    if (Number.isInteger(item?.id) && item.id > max) max = item.id;
  }
  return Math.min(16777215, max + 1);
}

export function createStudioObject(type, overrides = {}, existingObjects = []) {
  const preset = catalogMap.get(type) ?? catalogMap.get('seat');
  const id = overrides.id ?? nextSceneObjectId(existingObjects);
  return {
    id,
    type: preset.type,
    x: round2(overrides.x ?? 0),
    y: round2(overrides.y ?? preset.y ?? 0),
    z: round2(overrides.z ?? 0),
    sx: round2(clamp(overrides.sx ?? preset.sx ?? 1, 0.05, 200)),
    sy: round2(clamp(overrides.sy ?? preset.sy ?? 1, 0.05, 200)),
    sz: round2(clamp(overrides.sz ?? preset.sz ?? 1, 0.05, 200)),
    rotation: round2(overrides.rotation ?? 0),
    color: /^#[a-f0-9]{6}$/i.test(overrides.color ?? '') ? overrides.color.toLowerCase() : preset.color,
    label: String(overrides.label ?? preset.label).slice(0, 100),
    ...(overrides.seatId ? { seatId: String(overrides.seatId) } : {}),
  };
}

function seatColorForType(seatType, placeType, environment) {
  if (placeType === 'car') return '#506a89';
  if (placeType === 'bench') return '#865c45';
  if (seatType === 'PCD' || seatType === 'OBESO' || seatType === 'IDOSO') return '#506a89';
  if (seatType === 'CASAL') return '#c58051';
  if (placeType === 'vip') return '#c6a06b';
  if (environment === 'banker') return '#494d59';
  if (environment === 'container') return '#3e8a87';
  return '#8d475a';
}

function seatObjectType({ seat, roomType, environment }) {
  if (environment === 'drivein') return 'car';
  if (environment === 'park') return 'bench';
  if (seat.tipo === 'CASAL') return 'bench';
  if (roomType === 'VIP') return 'vip';
  return 'seat';
}

export function generateSceneFromSeats({
  roomName = 'Sala',
  roomType = '2D',
  spaceType = 'CINEMA',
  environment: explicitEnv,
  seats = [],
} = {}) {
  const environment = explicitEnv || inferEnvironment({ spaceType, roomType });
  const activeSeats = seats.filter(seat => !seat.status || seat.status === 'ATIVA');
  const rowsMap = new Map();
  const positionSet = new Set();

  for (const seat of activeSeats) {
    const rowLabel = String(seat.fileira ?? 'A').trim().toUpperCase() || 'A';
    const position = Number(seat.posicao_visual ?? seat.numero ?? 1);
    if (!rowsMap.has(rowLabel)) rowsMap.set(rowLabel, []);
    rowsMap.get(rowLabel).push({ ...seat, rowLabel, position });
    positionSet.add(position);
  }

  const rowEntries = [...rowsMap.entries()]
    .sort(([a], [b]) => collator.compare(a, b))
    .map(([label, items]) => ({
      label,
      items: items.sort((a, b) => a.position - b.position),
    }));

  const sortedPositions = [...positionSet].sort((a, b) => a - b);
  const minPos = sortedPositions[0] ?? 1;
  const maxPos = sortedPositions.at(-1) ?? 8;
  const colSpan = Math.max(4, maxPos - minPos + 1);
  const rowCount = Math.max(1, rowEntries.length);

  const isDriveIn = environment === 'drivein';
  const isStadium = environment === 'stadium';
  const isCompact = environment === 'banker' || environment === 'container';
  const isOutdoor = isDriveIn || environment === 'park' || isStadium;
  const colStep = isDriveIn ? 4.8 : isCompact ? 2.15 : roomType === 'VIP' ? 2.85 : 2.35;
  const rowStep = isDriveIn ? 7.4 : isCompact ? 2.45 : roomType === 'VIP' ? 3.55 : 2.95;
  const riserStep = isStadium ? 0.48 : isOutdoor ? 0 : roomType === 'VIP' ? 0.34 : 0.28;

  const audienceWidth = Math.max(12, colSpan * colStep + 4);
  const audienceDepth = Math.max(10, rowCount * rowStep + 4);
  const screenDistance = isDriveIn ? 11 : isCompact ? 4.5 : 7.5;
  const frontZ = -(audienceDepth / 2 + screenDistance);
  const backZ = audienceDepth / 2 + 4.5;
  const roomWidth = Math.max(isDriveIn ? 26 : isCompact ? 15 : 19, audienceWidth + (isOutdoor ? 10 : isCompact ? 3 : 7));
  const roomDepth = Math.max(isDriveIn ? 32 : isCompact ? 18 : 24, backZ - frontZ + 6);
  const centerZ = (frontZ + backZ) / 2;
  const fieldZ = frontZ - 17;
  const projectionZ = isStadium ? fieldZ - 24 : frontZ + 0.8;

  const objects = [];
  let nextId = 1;
  const push = (type, props) => {
    const obj = createStudioObject(type, { ...props, id: nextId++ }, objects);
    objects.push(obj);
    return obj;
  };

  // Base do espaço
  if (isStadium) {
    push('turf', { x: 0, y: 0, z: fieldZ, sx: 0.85, sy: 1, sz: 0.6, color: '#386343', label: 'Campo central' });
    push('floor', { x: 0, y: -0.25, z: (fieldZ + 22 + backZ) / 2, sx: roomWidth, sy: 1, sz: backZ - fieldZ - 18, color: '#343743', label: 'Setor da arquibancada' });
    for (const side of [-1, 1]) {
      push('light', { x: side * Math.max(roomWidth / 2, 21), z: fieldZ, sy: 1.6, label: 'Refletor do estádio' });
    }
  } else {
    const floorColor = isDriveIn ? '#2c303a' : environment === 'park' ? '#3e8a87' : environment === 'theater' ? '#493632' : '#343743';
    push('floor', { x: 0, y: -0.25, z: centerZ, sx: roomWidth, sy: 1, sz: roomDepth, color: floorColor, label: 'Piso da sala' });
  }

  // Paredes / limites quando ambiente fechado
  if (!isOutdoor) {
    const wallColor = environment === 'theater' ? '#633c44' : environment === 'container' ? '#3e8a87' : '#494d59';
    const wallHeight = isCompact ? 5.5 : Math.max(8, Math.round(rowCount * riserStep + 6.5));
    push('wall', { x: 0, y: 0, z: frontZ - 2.2, sx: roomWidth, sy: wallHeight, sz: 0.7, color: wallColor, label: 'Parede frontal' });
    push('wall', { x: 0, y: 0, z: backZ, sx: roomWidth, sy: wallHeight, sz: 0.7, color: wallColor, label: 'Parede dos fundos' });
    push('wall', { x: -roomWidth / 2, y: 0, z: centerZ, sx: 0.7, sy: wallHeight, sz: roomDepth, color: wallColor, label: 'Parede esquerda' });
    push('wall', { x: roomWidth / 2, y: 0, z: centerZ, sx: 0.7, sy: wallHeight, sz: roomDepth, color: wallColor, label: 'Parede direita' });
    push('door', { x: -roomWidth / 2 + 0.45, y: 0, z: backZ - 4.5, rotation: Math.PI / 2, color: '#865c45', label: 'Entrada / Saída' });
    push('door', { x: roomWidth / 2 - 0.45, y: 0, z: frontZ + 5.2, rotation: -Math.PI / 2, color: '#865c45', label: 'Saída de emergência' });
    if (isCompact) {
      for (const side of [-1, 1]) {
        push('rib', { x: side * (roomWidth / 2 - 0.8), z: centerZ, color: wallColor, label: environment === 'banker' ? 'Painel acústico' : 'Reforço do contêiner' });
      }
    }
  } else if (isDriveIn || environment === 'park') {
    for (const side of [-1, 1]) {
      push('tree', { x: side * (roomWidth / 2 - 1.5), y: 0, z: frontZ + 4, color: '#3e8a87', label: 'Paisagismo' });
      push('tree', { x: side * (roomWidth / 2 - 1.5), y: 0, z: backZ - 4, color: '#3e8a87', label: 'Paisagismo' });
      push('light', { x: side * (roomWidth / 2 - 2.5), y: 0, z: centerZ, rotation: side > 0 ? -Math.PI / 2 : Math.PI / 2, color: '#494d59', label: 'Poste lateral' });
    }
  }

  // Tela ou palco (face principal em +Z voltada para a plateia; assentos ficam em Z maior com rotation = PI)
  if (environment === 'theater') {
    push('stage', { x: 0, y: 0, z: frontZ + 2.8, sx: Math.max(1, roomWidth / 16), sy: 1, sz: 1, color: '#865c45', label: 'Palco principal' });
    push('curtain', { x: -roomWidth * 0.28, y: 0, z: frontZ + 1.1, sx: 0.9, sy: 1, sz: 1, color: '#8d475a', label: 'Cortina esquerda' });
    push('curtain', { x: roomWidth * 0.28, y: 0, z: frontZ + 1.1, sx: 0.9, sy: 1, sz: 1, color: '#8d475a', label: 'Cortina direita' });
  }
  const screenScale = clamp(roomWidth / 15.5, 0.95, isStadium ? 3 : isDriveIn ? 2.1 : 1.7);
  const screenColor = roomType === 'IMAX' ? '#3e8a87' : roomType === 'VIP' ? '#c6a06b' : '#506a89';
  push('screen', {
    x: 0,
    y: isStadium ? 4 : isDriveIn || environment === 'theater' ? 1.5 : 0.6,
    z: projectionZ,
    sx: screenScale,
    sy: clamp(screenScale * 0.88, 0.9, 2.3),
    color: screenColor,
    label: isStadium ? 'Telão do estádio' : isDriveIn ? 'Telão Drive-in' : `Tela ${roomType || '2D'}`,
  });

  // Caixas de som frontais
  const speakerX = clamp(roomWidth * 0.36, 6.5, roomWidth / 2 - 1.8);
  push('speaker', { x: -speakerX, y: 0.2, z: frontZ + 2.1, rotation: 0.18, color: '#343743', label: 'Caixa de som L' });
  push('speaker', { x: speakerX, y: 0.2, z: frontZ + 2.1, rotation: -0.18, color: '#343743', label: 'Caixa de som R' });

  // Corredor(es) baseados em lacunas de posicao_visual
  const gaps = [];
  for (let i = 1; i < sortedPositions.length; i++) {
    if (sortedPositions[i] - sortedPositions[i - 1] > 1) {
      const midPos = (sortedPositions[i] + sortedPositions[i - 1]) / 2;
      gaps.push((midPos - (minPos + maxPos) / 2) * colStep);
    }
  }
  for (const ax of gaps.slice(0, 4)) {
    push('aisle', {
      x: ax,
      y: 0.04,
      z: (frontZ + 6 + backZ - 2) / 2,
      sx: 1.35,
      sy: 1,
      sz: Math.max(6, audienceDepth - 2),
      color: '#494d59',
      label: 'Corredor',
    });
  }

  // Iluminação nas paredes laterais
  if (!isOutdoor) {
    const lightCount = Math.min(4, Math.max(2, Math.ceil(rowCount / 2)));
    for (let i = 0; i < lightCount; i++) {
      const lz = frontZ + 6 + (i + 0.5) * ((audienceDepth) / lightCount);
      push('sconce', { x: -roomWidth / 2 + 0.5, y: 0.8, z: lz, rotation: Math.PI / 2, color: '#c6a06b', label: `Arandela E${i + 1}` });
      push('sconce', { x: roomWidth / 2 - 0.5, y: 0.8, z: lz, rotation: -Math.PI / 2, color: '#c6a06b', label: `Arandela D${i + 1}` });
    }
    push('ceiling-light', { x: 0, y: Math.max(4.5, rowCount * riserStep + 3.2), z: centerZ, sx: 1.2, sy: 1, sz: 1.2, color: '#d0bd9e', label: 'Luz principal' });
  }

  // Fileiras, patamares (riser) e assentos
  const startZ = frontZ + screenDistance + 2;
  const centerPos = (minPos + maxPos) / 2;

  for (let r = 0; r < rowEntries.length; r++) {
    const row = rowEntries[r];
    const rowZ = startZ + r * rowStep;
    const rowY = r * riserStep;

    if ((isStadium || (!isOutdoor && r > 0)) && objects.length < 1150) {
      const platformHeight = isStadium ? (rowY + 0.24) / 0.4425 : Math.max(1, (rowY + 0.2) / 0.35);
      push(isStadium ? 'bleacher' : 'riser', {
        x: 0,
        y: isStadium ? -0.24 : rowY - 0.17,
        z: rowZ,
        sx: Math.max(8, colSpan * colStep + 1.8),
        sy: platformHeight,
        sz: rowStep * 0.96,
        color: '#343743',
        label: `${isStadium ? 'Arquibancada' : 'Patamar'} ${row.label}`,
      });
    }

    for (const seat of row.items) {
      if (objects.length >= 1200) break;
      const x = (seat.position - centerPos) * colStep;
      const type = seatObjectType({ seat, roomType, environment });
      const scale = seat.tipo === 'OBESO' ? 1.15 : 1;
      const idAssento = seat.id_assento != null && /^[1-9]\d{0,9}$/.test(String(seat.id_assento))
        ? String(seat.id_assento)
        : undefined;
      push(type, {
        x,
        y: rowY,
        z: rowZ,
        sx: type === 'bench' && seat.tipo === 'CASAL' ? 0.9 : scale,
        sy: 1,
        sz: 1,
        rotation: Math.PI,
        color: seatColorForType(seat.tipo, type, environment),
        label: `${row.label}-${seat.numero}`,
        seatId: idAssento,
      });
    }
  }

  const visibleDepth = isStadium ? backZ - projectionZ : roomDepth;
  const sceneSize = round2(clamp(Math.max(roomWidth, visibleDepth) * 0.65, 10, 240));

  return {
    format: 'CineAstra-Studio-3D',
    version: 2,
    environment,
    name: String(roomName || 'Sala CineAstra').trim().slice(0, 70) || 'Sala CineAstra',
    sceneSize,
    objects,
  };
}

export function bindSceneToRoomSeats(scene, seats) {
  if (!scene || !Array.isArray(scene.objects)) return scene;
  const active = seats.filter(seat => seat.status === 'ATIVA');
  const byLabel = new Map(active.map(seat => [normalizeSeatCode(`${seat.fileira}-${seat.numero}`), String(seat.id_assento)]));
  const byCompact = new Map(active.map(seat => [normalizeSeatCode(`${seat.fileira}${seat.numero}`), String(seat.id_assento)]));
  const used = new Set();

  const resolveId = (label) => {
    const key = normalizeSeatCode(label);
    return byLabel.get(key) ?? byCompact.get(key) ?? byLabel.get(key.replace(/^([A-Z]+)(\d+)$/, '$1-$2'));
  };

  return {
    ...scene,
    objects: scene.objects.map(object => {
      if (!STUDIO_PLACE_TYPES.has(object.type)) {
        const clean = { ...object };
        delete clean.seatId;
        return clean;
      }
      const existingValid = object.seatId && active.some(s => String(s.id_assento) === String(object.seatId))
        ? String(object.seatId)
        : null;
      const candidate = existingValid ?? resolveId(object.label);
      if (candidate && !used.has(candidate)) {
        used.add(candidate);
        return { ...object, seatId: candidate };
      }
      const clean = { ...object };
      delete clean.seatId;
      return clean;
    }),
  };
}

const VALID_TYPES = new Set(STUDIO_CATALOG.map(item => item.type));
const VALID_ENVS = new Set(STUDIO_ENVIRONMENTS.map(item => item.id));

export function sanitizeSceneForPublish(scene) {
  const environment = VALID_ENVS.has(scene?.environment) ? scene.environment : 'cinema';
  const name = String(scene?.name ?? 'Sala CineAstra').trim().slice(0, 70) || 'Sala CineAstra';
  const sceneSize = round2(clamp(Number(scene?.sceneSize) || 28, 2, 240));
  const usedIds = new Set();
  const objects = [];

  for (const raw of (scene?.objects ?? []).slice(0, 1200)) {
    if (!raw || !VALID_TYPES.has(raw.type)) continue;
    let id = Number.isInteger(raw.id) && raw.id >= 1 && raw.id <= 16777215 ? raw.id : nextSceneObjectId(objects);
    while (usedIds.has(id)) id = id >= 16777215 ? 1 : id + 1;
    usedIds.add(id);

    const clean = {
      id,
      type: raw.type,
      x: round2(clamp(Number(raw.x) || 0, -2000, 2000)),
      y: round2(clamp(Number(raw.y) || 0, -2000, 2000)),
      z: round2(clamp(Number(raw.z) || 0, -2000, 2000)),
      sx: round2(clamp(Number(raw.sx) || 1, 0.05, 200)),
      sy: round2(clamp(Number(raw.sy) || 1, 0.05, 200)),
      sz: round2(clamp(Number(raw.sz) || 1, 0.05, 200)),
      rotation: round2(clamp(Number(raw.rotation) || 0, -10000, 10000)),
      color: /^#[a-f0-9]{6}$/i.test(raw.color ?? '') ? raw.color.toLowerCase() : '#494d59',
      label: String(raw.label ?? '').slice(0, 100),
    };
    if (STUDIO_PLACE_TYPES.has(clean.type) && raw.seatId && /^[1-9]\d{0,9}$/.test(String(raw.seatId))) {
      clean.seatId = String(raw.seatId);
    }
    objects.push(clean);
  }

  return {
    format: 'CineAstra-Studio-3D',
    version: 2,
    environment,
    name,
    sceneSize,
    objects,
  };
}
