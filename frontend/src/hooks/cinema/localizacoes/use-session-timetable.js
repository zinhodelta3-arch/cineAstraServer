"use client";

import { MOVIES, START, END, RANGE, toMin, toHM, pct } from "@/components/cinema/localizacoes/data";

export function useSessionTimetable(loc, day, now) {
  const isToday = day === 0;
  const nowLeft = isToday && now != null && now >= START && now <= END ? pct(now) : null;
  const entries = Object.entries(loc.schedule).flatMap(([id, schedule]) => {
    const movie = MOVIES[id];
    if (!movie) return [];
    const duration = parseInt(movie.duration, 10);
    const sessions = schedule.times.map((time) => {
      const start = toMin(time);
      return {
        time,
        past: isToday && now != null && start < now,
        href: `/cinema/sessao/ingressos?cinema=${loc.id}&filme=${id}&sessao=${time}&dia=${day}`,
        title: `${time} às ${toHM(start + duration)} · ${schedule.room} · ${schedule.fmt}`,
        left: `${pct(start)}%`,
        width: `calc(${(duration / RANGE) * 100}% - 3px)`,
      };
    });
    return [{ id, movie, schedule, sessions }];
  });
  return { entries, nowLeft };
}
