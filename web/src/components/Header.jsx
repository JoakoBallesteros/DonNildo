import { Menu, PanelLeftOpen, PanelLeftClose } from 'lucide-react'

export default function Header({ sidebarOpen, onToggleSidebar, onOpenSidebarMobile }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-2">
        <button
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
          onClick={onOpenSidebarMobile}
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5 text-slate-600" />
        </button>

        <button
          className="hidden md:inline-flex p-2 rounded-lg hover:bg-slate-100 transition-colors"
          onClick={onToggleSidebar}
          aria-label="Alternar sidebar"
          title={sidebarOpen ? 'Ocultar menú' : 'Mostrar menú'}
        >
          {sidebarOpen ? <PanelLeftClose className="w-5 h-5 text-slate-600" /> : <PanelLeftOpen className="w-5 h-5 text-slate-600" />}
        </button>

        <span className="ml-1 md:ml-2 text-lg font-semibold text-slate-800" style={{ fontFamily: 'Syne, sans-serif' }}>
          Sistema de gestión
        </span>
      </div>

      <div className="text-sm text-slate-400">v1.0 • {import.meta.env.MODE}</div>
    </header>
  )
}