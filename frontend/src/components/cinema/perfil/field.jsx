import { Input } from "@/components/ui/input";

export default function Field({ label, id, ...props }) {
  return <div className="space-y-2"><label htmlFor={id} className="text-xs font-semibold text-muted-foreground">{label}</label><Input id={id} className="h-11 rounded-lg border-border bg-background" {...props} /></div>;
}
