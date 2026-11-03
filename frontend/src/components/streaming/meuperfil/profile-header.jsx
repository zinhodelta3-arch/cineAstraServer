import Link from "next/link";
import { ACCENT } from "@/components/streaming/home/data";
import Barcode from "./barcode";

export default function ProfileHeader({ profile, favorites, history }) {
  const photo = profile.photoUrl ? `/api/streaming/profiles/${profile.id}/photo` : `/streaming/avatars/${profile.avatar}.svg`;
  const completed = history.filter((item) => item.completed).length;
  const hours = (history.reduce((total, item) => total + item.positionSeconds, 0) / 3600).toFixed(1).replace(".", ",");
  return (
    <section aria-label="Meu perfil" className="ticket grid md:grid-cols-[1fr_240px] bg-card border border-border rounded-xl shadow-2xl">
      <div className="p-6 md:p-8 flex flex-col sm:flex-row sm:items-center gap-6">
        <img src={photo} alt={`Foto de ${profile.name}`} className="size-28 md:size-32 shrink-0 rounded-full object-cover border-2 border-primary" />
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${ACCENT}`}>Perfil CineAstra</p>
          <h1 className="f-display text-5xl md:text-6xl font-black text-card-foreground leading-[0.95] truncate">{profile.name}</h1>
          <dl className="flex gap-6 mt-4 text-sm flex-wrap">
            <div><dt className="text-muted-foreground text-xs">Na minha lista</dt><dd className="f-display text-3xl font-black text-card-foreground">{favorites}</dd></div>
            <div><dt className="text-muted-foreground text-xs">Filmes concluídos</dt><dd className="f-display text-3xl font-black text-card-foreground">{completed}</dd></div>
            <div><dt className="text-muted-foreground text-xs">Horas assistidas</dt><dd className="f-display text-3xl font-black text-card-foreground">{hours}</dd></div>
          </dl>
          <Link href="/streaming/perfis" className="mt-5 inline-flex rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-primary focus-visible:outline-2 focus-visible:outline-primary">Gerenciar perfis</Link>
        </div>
      </div>
      <div className="tear tear-v border-t-0 max-md:border-l-0 max-md:border-t-2 bg-secondary/15 p-6 flex md:flex-col justify-between items-end md:items-stretch gap-4">
        <div><span className="text-xs text-muted-foreground block">SEU ESPAÇO NO CINEMA</span><span className={`f-display text-4xl font-black ${ACCENT}`}>CINEASTRA</span></div>
        <Barcode seed={profile.name.length + 3} />
      </div>
    </section>
  );
}
