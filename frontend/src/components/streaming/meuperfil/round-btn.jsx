

const RoundBtn = ({ label, onClick, solid, children }) => (
  <button
    type="button" aria-label={label}
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    onKeyDown={(event) => event.stopPropagation()}
    className={`size-9 rounded-full flex items-center justify-center outline-hidden focus-visible:ring-2 focus-visible:ring-primary ${solid ? "bg-primary text-primary-foreground hover:opacity-90" : "border-2 border-foreground/60 text-foreground hover:border-primary"}`}
  >
    {children}
  </button>
);

export default RoundBtn;
