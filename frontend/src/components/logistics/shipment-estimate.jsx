const activeStatuses = new Set(['ENVIADO', 'EM_TRANSITO']);
const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const distance = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

export default function ShipmentEstimate({ shipment }) {
  const value = shipment.data_prevista;
  const utcValue = typeof value === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(value)
    ? `${value.replace(' ', 'T')}Z` : value;
  const timestamp = typeof utcValue === 'string' ? Date.parse(utcValue) : NaN;
  const hasEstimate = Number.isFinite(timestamp);
  const overdue = hasEstimate && activeStatuses.has(shipment.status) && timestamp < Date.now();

  return <>
    <div><dt>Chegada estimada</dt><dd>
      {hasEstimate ? dateTime.format(timestamp) : 'Sem estimativa cadastrada.'}
      {shipment.id_rota_referencia && <p>Rota de referência #{shipment.id_rota_referencia} no envio · {distance.format(Number(shipment.distancia_rota_km))} km · {shipment.tempo_rota_min} min.</p>}
      {overdue && <p>Previsão ultrapassada. Recebimento ainda não confirmado.</p>}
    </dd></div>
    <div><dt>Localização por GPS</dt><dd>Indisponível neste envio.</dd></div>
  </>;
}
