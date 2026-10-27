import useProfileForm from "@/hooks/streaming/meuperfil/use-profile-form";
import { Check, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AVATARS } from "./data";
import Avatar from "./avatar";

export default function EditForm({ profile, onSave, onCancel }) {
  const { name, avatar, error, fileRef, onFile, cleanName, choosePhoto, removePhoto, chooseAvatar, changeName, submit } = useProfileForm(profile, onSave);


  return (
    <>
      <DialogHeader>
        <DialogTitle className="f-display text-4xl font-black leading-none">Editar perfil</DialogTitle>
        <DialogDescription>Troque sua foto ou escolha um avatar.</DialogDescription>
      </DialogHeader>

      <div className="flex items-center gap-5">
        <Avatar avatar={avatar} name={cleanName || "perfil"} className="size-24" />
        <div className="flex flex-col gap-2">
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="sr-only" tabIndex={-1} aria-hidden="true" />
          <Button type="button" size="sm" className="rounded-full" onClick={choosePhoto}>
            <Upload className="size-4" aria-hidden="true" /> Enviar foto
          </Button>
          {avatar.type === "image" && (
            <Button type="button" size="sm" variant="ghost" className="rounded-full text-muted-foreground" onClick={removePhoto}>
              <Trash2 className="size-4" aria-hidden="true" /> Remover foto
            </Button>
          )}
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-destructive -mt-2">{error}</p>}

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Ou escolha um avatar</p>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {AVATARS.map((a) => {
            const selected = avatar.type === "preset" && avatar.id === a.id;
            return (
              <button
                key={a.id} type="button" aria-label={`Avatar ${a.id}`} aria-pressed={selected}
                onClick={() => chooseAvatar(a.id)}
                className={`relative rounded-full outline-hidden focus-visible:ring-2 focus-visible:ring-primary transition-transform hover:scale-105 ${selected ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""}`}
              >
                <Avatar avatar={{ type: "preset", id: a.id }} name="" className="size-full aspect-square border-0" />
                {selected && <span className="absolute -bottom-1 -right-1 size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center"><Check className="size-3" /></span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="profile-name">Nome do perfil</Label>
        <Input id="profile-name" value={name} maxLength={24} onChange={changeName} className="rounded-full px-5" />
      </div>

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" className="rounded-full" onClick={onCancel}>Cancelar</Button>
        <Button type="button" className="rounded-full" disabled={!cleanName} onClick={submit}>Salvar alterações</Button>
      </DialogFooter>
    </>
  );
}
