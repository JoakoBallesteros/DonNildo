import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../pages/Sidebar.jsx";
import HamburgerButton from "../buttons/HamburgerButton.jsx";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <Sidebar
        open={sidebarOpen}
        mobileOpen={sidebarMobileOpen}
        onCloseMobile={() => setSidebarMobileOpen(false)}
        onToggle={() => setSidebarOpen((o) => !o)}
      />

      <main className="flex-1">
        {/* Top bar sólo cuando la sidebar está cerrada */}
        {!sidebarOpen && (
          <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur shadow-sm">
            {/* Alineado a la izquierda; mismo padding que el contenido */}
            <div className="px-4 md:px-8 py-2 flex items-center gap-3">
              <HamburgerButton onClick={() => setSidebarOpen(true)} />
              <div className="text-2xl font-extrabold text-emerald-900 select-none">
                DON&nbsp;NILDO
              </div>
            </div>
          </div>
        )}

        {/* Contenido: mismo padding; sin borde superior visible */}
        <div className="px-4 md:px-8 py-4 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
