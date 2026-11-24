const collator = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });

export const seatStatus = {
  DISPONIVEL: 'Disponível', RESERVADO: 'Reservado', VENDIDO: 'Vendido', INDISPONIVEL: 'Indisponível'
};
export const seatType = {
  COMUM: 'Comum', PCD: 'Pessoa com deficiência', OBESO: 'Pessoa obesa', IDOSO: 'Pessoa idosa', CASAL: 'Casal'
};
export const accessibleSeat = type => ['PCD','OBESO','IDOSO'].includes(type);

export function seatFromRoom(row) {
  return {
    id:String(row.id_assento), row:row.fileira, number:row.numero,
    position:row.posicao_visual??row.numero, type:row.tipo, accessible:accessibleSeat(row.tipo),
    availability:row.status==='ATIVA'?'DISPONIVEL':'INDISPONIVEL'
  };
}

export function arrangedSeats(seats) {
  const rows = new Map(), positions = new Set();
  for (const seat of seats) {
    const position = Number(seat.position ?? seat.number);
    if (!rows.has(seat.row)) rows.set(seat.row, []);
    rows.get(seat.row).push({ ...seat, position });
    positions.add(position);
  }
  const slots = [...positions].sort((a,b)=>a-b), columns = new Map();
  let column = 1, previous = 0;
  for (const position of slots) {
    // Empty columns are aisles. Collapse very large gaps in legacy numbering.
    column += Math.min(3, Math.max(0,position-previous-1));
    columns.set(position, column++);
    previous = position;
  }
  const ordered = [...rows].sort(([a],[b])=>collator.compare(a,b)).map(([label, items])=>({
    label, seats:items.sort((a,b)=>a.position-b.position)
  }));
  return {rows:ordered,columns,count:Math.max(1,column-1)};
}
