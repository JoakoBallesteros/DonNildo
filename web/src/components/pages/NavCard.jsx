import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export default function NavCard({ to, icon: Icon, label, description, delay = "0ms" }) {
  return (
    <Link
      to={to}
      className="group relative h-40 md:h-48 overflow-hidden rounded-[2rem] p-6 shadow-sm border bg-white/60 backdrop-blur-md transition-all duration-500 hover:shadow-xl hover:-translate-y-2 flex flex-col justify-between"
      style={{ 
        borderColor: 'rgba(255,255,255,0.5)',
        animationDelay: delay 
      }}
    >
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-[var(--hp-cyan-50)]/50 z-0"></div>
      
      {/* Animated glowing orb */}
      <div 
        className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-40 transition-all duration-700 blur-[30px] group-hover:scale-150"
        style={{ background: 'var(--hp-cyan-400)' }}
      />

      <div className="relative z-10 flex justify-between items-start">
        {Icon && (
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white shadow-sm shadow-[var(--hp-cyan-500)]/10 text-[var(--hp-navy-600)] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:shadow-[var(--hp-cyan-400)]/30 group-hover:text-[var(--hp-cyan-500)] border border-[var(--hp-slate-100)]">
            <Icon className="w-7 h-7" />
          </div>
        )}
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--hp-navy-50)] text-[var(--hp-navy-400)] opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>

      <div className="relative z-10">
        <h3 
          className="text-2xl font-bold tracking-tight text-[var(--hp-navy-900)] mb-1"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          {label}
        </h3>
        {description && (
          <p className="text-sm text-[var(--hp-slate-500)] font-medium leading-tight">
            {description}
          </p>
        )}
      </div>
      
      {/* Top border highlight */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--hp-cyan-300)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </Link>
  );
}