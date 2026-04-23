import { cn } from "../../lib/utils";

export default function HamburgerButton({ onClick, className = "", label = "Menú" }) {
  return (
    <button
      type="button" 
      onClick={onClick} 
      aria-label={label} 
      title={label}
      className={cn(
        "group relative inline-flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300",
        "bg-white/80 hover:bg-white border border-[var(--hp-slate-200)] hover:border-[var(--hp-cyan-300)] shadow-sm hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]",
        className
      )}
    >
      <span className="relative flex flex-col items-center justify-center w-5 h-4 overflow-hidden">
        <span className="w-full h-[2px] bg-[var(--hp-navy-700)] rounded transition-all duration-300 origin-center group-hover:w-4 group-hover:-translate-y-0.5" />
        <span className="w-full h-[2px] bg-[var(--hp-navy-700)] rounded transition-all duration-300 mt-1 origin-center" />
        <span className="w-full h-[2px] bg-[var(--hp-navy-700)] rounded transition-all duration-300 mt-1 origin-center group-hover:w-4 group-hover:translate-y-0.5" />
      </span>
    </button>
  );
}
