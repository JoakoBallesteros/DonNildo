import { Link } from 'react-router-dom'

export default function NavCard({ to, icon: Icon, label }) {
  return (
    <Link
      to={to}
      className="group rounded-2xl bg-emerald-800 text-white
        p-6 md:p-8
        h-28 md:h-36        /* altura mayor */
        shadow hover:shadow-xl
        transition-transform duration-150 hover:-translate-y-0.5
        flex items-center"
    >
      <div className="flex items-center gap-5 md:gap-7">
        {Icon && <Icon className="w-9 h-9 md:w-12 md:h-12 opacity-95" />}
        <span className="font-semibold tracking-wide text-xl md:text-3xl">
          {label.toUpperCase()}
        </span>
      </div>
    </Link>
  )
}