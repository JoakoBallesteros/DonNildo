import { Menu, PanelLeftOpen, PanelLeftClose } from 'lucide-react'

export default function Header({ sidebarOpen, onToggleSidebar, onOpenSidebarMobile }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {/* Mobile: abre overlay */}
        <button
          className="md:hidden p-2 rounded hover:bg-slate-100"
          onClick={onOpenSidebarMobile}
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop: mostrar/ocultar completamente */}
        <button
          className="hidden md:inline-flex p-2 rounded hover:bg-slate-100"
          onClick={onToggleSidebar}
          aria-label="Alternar sidebar"
          title={sidebarOpen ? 'Ocultar menú' : 'Mostrar menú'}
        >
          {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
        </button>

        <h1 className="ml-1 md:ml-2 text-lg font-semibold text-slate-800">Sistema de gestión</h1>
      </div>

      <div className="text-sm text-slate-500">v0.1 • {import.meta.env.MODE}</div>
    </header>
  )
}