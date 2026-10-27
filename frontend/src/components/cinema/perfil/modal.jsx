import { Film, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Modal({ trigger, title, description, children, open, onOpenChange, wide = false }) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    {trigger && <DialogTrigger render={trigger} />}
    <DialogContent showCloseButton={false} className={`ca-profile-dialog max-h-[88dvh] overflow-y-auto rounded-2xl border-border bg-card p-6 text-card-foreground sm:p-8 ${wide ? "sm:max-w-2xl" : "sm:max-w-lg"}`}>
      <DialogClose render={<Button variant="ghost" size="icon" className="absolute top-4 right-4 rounded-full" aria-label="Fechar janela"><X className="size-4" /></Button>} />
      <DialogHeader className="pr-8 text-left">
        <p className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-primary uppercase"><Film className="size-3.5" />CineAstra Cinema</p>
        <DialogTitle className="ca-display text-4xl font-black uppercase">{title}</DialogTitle>
        <DialogDescription className="mt-2 leading-relaxed text-muted-foreground">{description}</DialogDescription>
      </DialogHeader>
      {children}
    </DialogContent>
  </Dialog>;
}
