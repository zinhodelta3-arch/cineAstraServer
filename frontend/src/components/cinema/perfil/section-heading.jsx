

export default function SectionHeading({ icon: Icon, title, count, children }) {
  return <div className="mb-5 flex items-center justify-between gap-3">
    <h2 className="flex items-center gap-2.5 text-lg font-bold"><Icon className="size-4 text-primary" />{title}{count !== undefined && <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{count}</span>}</h2>
    {children}
  </div>;
}
