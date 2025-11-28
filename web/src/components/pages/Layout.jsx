// src/components/pages/Layout.jsx
import { useState, useEffect } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import Sidebar from "../pages/Sidebar.jsx";
import HamburgerButton from "../buttons/HamburgerButton.jsx";

export default function Layout() {
  const { pathname } = useLocation();

  // 🔹 En Home ("/") arranca cerrada, en el resto abierta
  const [sidebarOpen, setSidebarOpen] = useState(() => pathname !== "/");
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  // 🔹 Si cambio de ruta:
  //    - Voy a "/"  → cierro sidebar en desktop
  //    - Voy a otra → la abro (para que se vea el menú en módulos)
  useEffect(() => {
    if (pathname === "/") {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
    // en cualquier cambio de ruta cierro el menú móvil
    setSidebarMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <Sidebar
        open={sidebarOpen}
        mobileOpen={sidebarMobileOpen}
        onCloseMobile={() => setSidebarMobileOpen(false)}
        onToggle={() => setSidebarOpen((o) => !o)}
      />

      <main className="flex-1 min-h-screen overflow-y-auto overflow-x-hidden">
        {/* Barra móvil con botón hamburguesa */}
        <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur shadow-sm md:hidden">
          <div className="px-4 py-2 flex items-center gap-3">
            <HamburgerButton
              onClick={() => setSidebarMobileOpen(true)}
              label="Abrir menú"
            />
            <Link
              to="/"
              className="text-2xl font-extrabold text-emerald-900 select-none hover:text-emerald-700"
            >
              DON&nbsp;NILDO
            </Link>
          </div>
        </div>

        {/* Top bar solo cuando la sidebar está cerrada en desktop */}
        {!sidebarOpen && (
          <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur shadow-sm hidden md:block">
            <div className="px-4 md:px-8 py-2 flex items-center gap-3">
              <HamburgerButton onClick={() => setSidebarOpen(true)} />
              <Link
                to="/"
                className="text-2xl font-extrabold text-emerald-900 select-none hover:text-emerald-700"
              >
                DON&nbsp;NILDO
              </Link>
            </div>
          </div>
        )}

        {/* Contenido */}
        <div className="px-4 md:px-8 py-4 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
