import { Link } from 'react-router-dom'

export default function NavCard({ to, icon: Icon, label }) {
  return (
    <Link
      to={to}
      className="group relative overflow-hidden rounded-2xl text-white
        p-6 md:p-8
        h-28 md:h-36
        shadow-lg hover:shadow-2xl
        transition-all duration-200 hover:-translate-y-1
        flex items-center"
      style={{
        background: 'linear-gradient(135deg, #102354 0%, #1e408f 60%, #2554b2 100%)',
        borderTop: '1px solid rgba(96,165,250,0.2)',
      }}
    >
      {/* Subtle glowing accent top-right */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 group-hover:opacity-30 transition-opacity"
        style={{ background: 'radial-gradient(circle, #22d3ee, transparent 70%)' }}
      />

      <div className="relative flex items-center gap-5 md:gap-7">
        {Icon && (
          <div
            className="flex items-center justify-center w-11 h-11 rounded-xl"
            style={{ background: 'rgba(34,211,238,0.15)', color: '#67e8f9' }}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
        <span
          className="font-bold tracking-wide text-xl md:text-2xl text-white"
          style={{ fontFamily: 'Syne, sans-serif' }}
        >
          {label.toUpperCase()}
        </span>
      </div>
    </Link>
  )
}