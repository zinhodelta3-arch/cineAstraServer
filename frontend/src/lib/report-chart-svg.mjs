const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' };
const xml = value => String(value).replace(/[&<>"']/g, character => entities[character]);
const width = 900;
const palette = ['#8b3b20', '#a45d12', '#315f63', '#5e4c80'];

export function reportChartSvg({ title, period, filter, legend, rows }) {
  const height = 156 + 52 * rows.length;
  const max = Math.max(...rows.map(row => Math.abs(row.value ?? 0)), 1);
  const chartRows = rows.map((row, index) => {
    const top = 131 + index * 52;
    const color = palette[row.colorIndex ?? 0] ?? palette[0];
    const barWidth = Math.abs(row.value ?? 0) / max * 260;
    return `<g>
      <text x="30" y="${top + 20}">${xml(row.label)}</text>
      ${row.detail ? `<text x="30" y="${top + 38}" class="detail">${xml(row.detail)}</text>` : ''}
      <rect x="438" y="${top + 6}" width="260" height="16" rx="3" fill="#ede6dd"/>
      <rect x="438" y="${top + 6}" width="${barWidth}" height="16" rx="3" fill="${color}"/>
      <text x="870" y="${top + 20}" text-anchor="end">${xml(row.formatted)}</text>
    </g>`;
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">
    <title>${xml(title)}</title><desc>${xml([period, filter, legend].join(' · '))}</desc>
    <style>text{font-family:Arial,sans-serif;font-size:15px;fill:#30241c}.title{font-size:24px;font-weight:700}.detail{font-size:13px;fill:#5d4d41}</style>
    <rect width="${width}" height="${height}" fill="#fffaf3"/>
    <text x="30" y="43" class="title">${xml(title)}</text>
    <text x="30" y="71" class="detail">${xml(`${period} · ${filter}`)}</text>
    <text x="30" y="103" class="detail">${xml(legend)}</text>
    <path d="M30 121H870" stroke="#b9a99b"/>
    ${chartRows}
  </svg>`;
}

export function downloadReportChart(title, report, legend, rows) {
  const { from, to, timeZone } = report.period;
  const period = `${from.split('-').reverse().join('/')} a ${to.split('-').reverse().join('/')} (${timeZone})`;
  const location = report.localId && report.rooms.find(room => room.localId === report.localId)?.locationName;
  const filter = location ? `Unidade: ${location}` : report.localId ? 'Unidade selecionada' : 'Todas as unidades';
  const svg = reportChartSvg({ title, period, filter, legend, rows });
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `cineastra-${title.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replaceAll(' ', '-')}-${from}-${to}.svg`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
