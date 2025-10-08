import { NavLink } from 'react-router-dom'

const base = 'block rounded-lg px-4 py-2 text-sm font-medium transition'
const active = 'bg-emerald-700 text-white shadow-sm'
const inactive = 'text-emerald-900/80 hover:bg-emerald-100'

export default function Sidebar() {
  return (
    <aside className="w-60 bg-emerald-50 border-r border-emerald-100 p-4">
      <div className="text-2xl font-extrabold text-emerald-900 mb-6 leading-tight">
        DON<br/>NILDO
      </div>
      <nav className="space-y-2">
        <NavLink to="/" end className={({isActive}) => `${base} ${isActive?active:inactive}`}>Inicio</NavLink>
        <NavLink to="/compras"  className={({isActive}) => `${base} ${isActive?active:inactive}`}>Compras</NavLink>
        <NavLink to="/ventas"   className={({isActive}) => `${base} ${isActive?active:inactive}`}>Ventas</NavLink>
        <NavLink to="/stock"    className={({isActive}) => `${base} ${isActive?active:inactive}`}>Stock</NavLink>
        <NavLink to="/reportes" className={({isActive}) => `${base} ${isActive?active:inactive}`}>Reportes</NavLink>
        <NavLink to="/seguridad" className={({isActive}) => `${base} ${isActive?active:inactive}`}>Seguridad</NavLink>
        <NavLink to="/login" className={({isActive}) => `${base} ${isActive?active:inactive}`}>Salir</NavLink>

      </nav>
    </aside>
  )
}