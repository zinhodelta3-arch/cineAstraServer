

export default function Barcode({ seed = 7 }) {
  return (
    <div className="flex items-end gap-[2px] h-10" aria-hidden="true">
      {Array.from({ length: 34 }).map((_, i) => (
        <span key={i} className="bg-foreground/70" style={{ width: ((i * seed) % 3) + 1, height: `${60 + ((i * 13 + seed) % 40)}%` }} />
      ))}
    </div>
  );
}
