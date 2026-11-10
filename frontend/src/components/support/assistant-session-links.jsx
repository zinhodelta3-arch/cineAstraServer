import Link from "next/link";

export function AssistantSessionLinks({ sessions, onNavigate }) {
  if (!Array.isArray(sessions) || !sessions.length) return null;

  return (
    <ul className="mt-2 grid gap-1" aria-label="Sessões encontradas">
      {sessions.map(({ id, label }) => (
        <li key={id}>
          <Link
            href={`/cinema/sessao/assentos?sessionId=${encodeURIComponent(id)}`}
            onNavigate={onNavigate}
            className="inline-block rounded-sm py-1 text-sm font-semibold text-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-ring"
          >
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
