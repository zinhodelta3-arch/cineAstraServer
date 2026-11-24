export function teamSchedule(schedule) {
  if (!schedule?.date || !schedule.start || !schedule.end) return 'Horário indisponível';
  const date = schedule.date.slice(0,10).split('-').reverse().join('/');
  const start = schedule.start.slice(0,5);
  const end = schedule.end.slice(0,5);
  return `${date} · ${start} às ${end}${schedule.end<schedule.start?' do dia seguinte':''}`;
}
