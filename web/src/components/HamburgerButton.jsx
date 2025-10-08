
export default function HamburgerButton({ onClick, className="", label="Menú" }) {
  return (
    <button
      type="button" onClick={onClick} aria-label={label} title={label}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-lg bg-white/90 hover:bg-white shadow ${className}`}
    >
      <span className="relative block w-5 h-3">
        <span className="absolute inset-x-0 top-0 h-[2px] bg-slate-700 rounded" />
        <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-slate-700 rounded" />
        <span className="absolute inset-x-0 bottom-0 h-[2px] bg-slate-700 rounded" />
      </span>
    </button>
  );
}
