// Utilitários compartilhados para geração e validação de lotes de assentos.

import { inferEnvironment } from './studio-builder.mjs';

export const SEAT_TEMPLATES = {
  cinema: { label: 'Cinema com corredor central', rows: 4, blocks: 2, width: 5, gap: 1 },
  vip: { label: 'Sala VIP', rows: 3, blocks: 2, width: 3, gap: 2 },
  drive: { label: 'Drive-in em setores', rows: 3, blocks: 2, width: 4, gap: 2 },
  event: { label: 'Plateia de evento', rows: 4, blocks: 3, width: 4, gap: 1 },
  stadium: { label: 'Arquibancada em setores', rows: 6, blocks: 3, width: 6, gap: 2 },
  park: { label: 'Bancos ao ar livre', rows: 4, blocks: 2, width: 4, gap: 2 },
  bunker: { label: 'Bunker privativo', rows: 2, blocks: 1, width: 4, gap: 0 },
  container: { label: 'Contêiner com corredor', rows: 4, blocks: 2, width: 2, gap: 1 },
  row: { label: 'Fileiras inteiras', rows: 1, blocks: 1, width: 8, gap: 0 },
};

export const MAX_SEAT_POSITION = 2147483647;

export function nextSeatRow(value, index) {
  let number = [...value].reduce((count, char) => count * 26 + char.charCodeAt(0) - 64, 0) + index;
  let row = '';
  while (number) {
    number--;
    row = String.fromCharCode(65 + (number % 26)) + row;
    number = Math.floor(number / 26);
  }
  return row;
}

export const seatSlotKey = (row, number) => `${row}:${number}`;

export const countActiveSeats = rows => rows.filter(row => row.status === 'ATIVA').length;

export function findDuplicateSeat(records, field) {
  const seen = new Set();
  for (const record of records) {
    const position = field === 'position' ? record.posicao_visual ?? record.numero : record.numero;
    const slot = seatSlotKey(record.fileira, position);
    if (seen.has(slot)) {
      return `A fileira ${record.fileira} já tem um assento com ${field === 'position' ? 'a posição' : 'o número'} ${position}.`;
    }
    seen.add(slot);
  }
  return '';
}

export function defaultTemplateForSpace({ spaceType, roomType } = {}) {
  const environment = inferEnvironment({ spaceType });
  const template = { drivein:'drive', theater:'event', stadium:'stadium', park:'park', banker:'bunker', container:'container', custom:'event' }[environment];
  if (template) return template;
  if (roomType === 'VIP') return 'vip';
  return 'cinema';
}

export function fitSeatTemplate(templateId, maxRemaining) {
  const preset = SEAT_TEMPLATES[templateId] ?? SEAT_TEMPLATES.cinema;
  const remaining = Math.max(1, maxRemaining);
  const blocks = Math.min(preset.blocks, remaining);
  const width = Math.min(preset.width, Math.floor(remaining / blocks));
  return {
    ...preset,
    blocks,
    width,
    rows: Math.min(preset.rows, Math.floor(remaining / (blocks * width))),
  };
}

export function buildSeatBatchDraft(config, specialTypes = {}) {
  const { rows, blocks, width, gap, firstRow, firstNumber, firstPosition } = config;
  const total = rows * blocks * width;
  const rowSize = blocks * width;
  const lastPosition = firstPosition + rowSize + (blocks - 1) * gap - 1;
  const valid =
    /^[A-Z]{1,4}$/.test(firstRow) &&
    [rows, blocks, width, firstNumber, firstPosition].every(value => Number.isInteger(value) && value > 0) &&
    Number.isInteger(gap) &&
    gap >= 0 &&
    rows <= 100 &&
    blocks <= 12 &&
    width <= 100 &&
    gap <= 12 &&
    total <= 400 &&
    lastPosition <= MAX_SEAT_POSITION &&
    firstNumber + rowSize - 1 <= MAX_SEAT_POSITION;

  if (!valid) return { valid: false, draft: [] };

  const draft = Array.from({ length: total }, (_, index) => {
    const indexInRow = index % rowSize;
    const fileira = nextSeatRow(firstRow, Math.floor(index / rowSize));
    const numero = firstNumber + indexInRow;
    const id_assento = seatSlotKey(fileira, numero);
    return {
      id_assento,
      fileira,
      numero,
      status: 'ATIVA',
      tipo: specialTypes[id_assento] ?? 'COMUM',
      posicao_visual: firstPosition + indexInRow + Math.floor(indexInRow / width) * gap,
    };
  });

  return { valid: true, draft };
}
