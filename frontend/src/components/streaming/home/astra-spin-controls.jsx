"use client";

import {
  Brain, Coffee, Compass, Dices, Ghost, Heart, Laugh, Moon, SlidersHorizontal, Sparkles, Users, Zap,
} from "lucide-react";
import Button from "./button";
import { COMPANIES, MODES, MOODS, TIMES } from "@/hooks/streaming/astra-spin/astra-spin-engine";

const MODE_ICON = { custom: SlidersHorizontal, surprise: Sparkles, comfort: Compass, today: Moon, friends: Users };
const MOOD_ICON = { relax: Coffee, laugh: Laugh, feel: Heart, thrill: Zap, think: Brain, scare: Ghost };

function Chip({ active, onClick, icon: Icon, children }) {
  return (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      className="shrink-0 gap-1.5"
      aria-pressed={active}
      onClick={onClick}
    >
      {Icon && <Icon className="size-4" aria-hidden="true" />}
      {children}
    </Button>
  );
}

function Group({ title, children }) {
  return (
    <div role="group" aria-label={title} className="min-w-0">
      <p className="mb-3 text-sm font-medium">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export default function AstraSpinControls({ astra, genres }) {
  const {
    mode, changeMode, mood, setMood, genre, setGenre, time, setTime, company, setCompany,
    friends, friendIds, toggleFriend, tonight, spin, busy, canSpin, phase,
  } = astra;

  const current = MODES.find((m) => m.id === mode);
  const pick = (value, now, set) => set(now === value ? null : value);

  const timeGroup = (
    <Group title="Quanto tempo você tem?">
      {TIMES.map((t) => (
        <Chip key={t.id} active={time === t.id} onClick={() => setTime(t.id)}>{t.label}</Chip>
      ))}
    </Group>
  );

  return (
    <div className="mx-auto mt-12 max-w-[1100px]">
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto pb-2">
        {MODES.map((m) => (
          <Chip key={m.id} active={mode === m.id} icon={MODE_ICON[m.id]} onClick={() => changeMode(m.id)}>
            {m.label}
          </Chip>
        ))}
      </div>
      <p className="mb-8 text-sm text-muted-foreground">{current?.hint}</p>

      {mode === "custom" && (
        <div className="grid gap-8 md:grid-cols-2">
          <Group title="Como você está?">
            {MOODS.map((m) => (
              <Chip key={m.id} active={mood === m.id} icon={MOOD_ICON[m.id]} onClick={() => pick(m.id, mood, setMood)}>
                {m.label}
              </Chip>
            ))}
          </Group>
          <Group title="Com quem você vai assistir?">
            {COMPANIES.map((c) => (
              <Chip key={c.id} active={company === c.id} onClick={() => pick(c.id, company, setCompany)}>
                {c.label}
              </Chip>
            ))}
          </Group>
          {timeGroup}
          <Group title="Algum gênero em mente?">
            {genres.map((g) => (
              <Chip key={g} active={genre === g} onClick={() => pick(g, genre, setGenre)}>{g}</Chip>
            ))}
          </Group>
        </div>
      )}

      {mode === "comfort" && (
        <div className="space-y-6">
          <p className="max-w-xl text-sm text-muted-foreground">
            Olhamos o que você assistiu e salvou, e sorteamos algo fora dos seus dois gêneros mais frequentes.
          </p>
          {timeGroup}
        </div>
      )}

      {mode === "today" && (
        <div className="max-w-xl rounded-xl border border-border bg-card p-5">
          {tonight ? (
            <>
              <p className="text-lg font-semibold">{tonight.headline}</p>
              <p className="mt-1 text-sm text-muted-foreground">{tonight.detail}</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Lendo o clima do dia…</p>
          )}
        </div>
      )}

      {mode === "friends" && (
        <div className="space-y-8">
          <Group title="Quem está na roda?">
            {friends.map((f) => (
              <Chip key={f.id} active={friendIds.includes(f.id)} onClick={() => toggleFriend(f.id)}>
                <span className="grid size-5 place-items-center rounded-full bg-foreground/15 text-[11px] font-semibold">
                  {f.name[0]}
                </span>
                {f.name}
              </Chip>
            ))}
          </Group>
          {friendIds.length === 0 ? (
            <p className="text-sm text-muted-foreground">Escolha pelo menos um amigo para girar.</p>
          ) : (
            <p className="max-w-xl text-sm text-muted-foreground">
              Filmes que agradam mais amigos da roda têm mais chance de sair.
            </p>
          )}
          {timeGroup}
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <Button size="lg" className="gap-2 px-10" onClick={spin} disabled={busy || !canSpin}>
          <Dices className="size-5" aria-hidden="true" />
          {busy ? "Girando…" : phase === "revealed" ? "Girar de novo" : "Girar a roleta"}
        </Button>
      </div>
    </div>
  );
}