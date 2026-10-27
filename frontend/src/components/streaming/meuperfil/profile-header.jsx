import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ACCENT } from "./data";
import Avatar from "./avatar";
import Barcode from "./barcode";

export default function ProfileHeader({ profile, list, trailers, openEditor }) {
  return (
        <section aria-label="Meu perfil" className="ticket grid md:grid-cols-[1fr_240px] bg-card border border-border rounded-xl shadow-2xl">
          <div className="p-6 md:p-8 flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="relative w-fit">
              <Avatar avatar={profile.avatar} name={profile.name} className="size-28 md:size-32" />
              <button
                type="button" onClick={openEditor} aria-label="Editar foto do perfil"
                className="absolute -bottom-1 -right-1 size-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md outline-hidden hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Camera className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="min-w-0">
              <p className={`text-sm font-semibold ${ACCENT}`}>Plano Premium</p>
              <h1 className="f-display text-5xl md:text-6xl font-black text-card-foreground leading-[0.95] truncate">{profile.name}</h1>
              <dl className="flex gap-6 mt-4 text-sm">
                <div><dt className="text-muted-foreground text-xs">Na minha lista</dt><dd className="f-display text-3xl font-black text-card-foreground">{list.length}</dd></div>
                <div><dt className="text-muted-foreground text-xs">Trailers vistos</dt><dd className="f-display text-3xl font-black text-card-foreground">{trailers.length}</dd></div>
                <div><dt className="text-muted-foreground text-xs">Horas assistidas</dt><dd className="f-display text-3xl font-black text-card-foreground">128</dd></div>
              </dl>
              <Button variant="outline" size="sm" className="rounded-full mt-5" onClick={openEditor}>Editar perfil</Button>
            </div>
          </div>

          <div className="tear tear-v border-t-0 max-md:border-l-0 max-md:border-t-2 bg-secondary/15 p-6 flex md:flex-col justify-between items-end md:items-stretch gap-4">
            <div>
              <span className="text-xs text-muted-foreground block">Membro desde</span>
              <span className={`f-display text-4xl font-black ${ACCENT}`}>2024</span>
              <span className="text-xs text-muted-foreground block mt-1">4K HDR · 3 telas</span>
            </div>
            <Barcode seed={profile.name.length + 3} />
          </div>
        </section>
  );
}
