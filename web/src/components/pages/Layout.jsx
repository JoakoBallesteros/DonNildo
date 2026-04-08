import { useState, useEffect } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import Sidebar from "../pages/Sidebar.jsx";
import HamburgerButton from "../buttons/HamburgerButton.jsx";

export default function Layout() {
  const { pathname } = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(() => pathname !== "/");
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/") {
      setSidebarOpen(false);
    } else {
      setSidebarOpen(true);
    }
    setSidebarMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex font-sans" style={{ background: 'var(--hp-slate-50, #f8fafc)' }}>
      <Sidebar
        open={sidebarOpen}
        mobileOpen={sidebarMobileOpen}
        onCloseMobile={() => setSidebarMobileOpen(false)}
        onToggle={() => setSidebarOpen((o) => !o)}
      />

      <main className="flex-1 min-h-screen overflow-y-auto overflow-x-hidden">
        {/* Mobile top bar */}
        <div
          className="sticky top-0 z-30 backdrop-blur shadow-sm md:hidden"
          style={{ background: 'rgba(248,250,252,0.95)' }}
        >
          <div className="px-4 py-2 flex items-center gap-3 border-b border-slate-200">
            <HamburgerButton
              onClick={() => setSidebarMobileOpen(true)}
              label="Abrir menú"
            />
            <Link
              to="/"
              className="select-none hover:opacity-80 transition-opacity"
              style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.35rem', color: 'var(--hp-navy-800, #102354)' }}
            >
              HydroPack
            </Link>
          </div>
        </div>

        {/* Desktop: show brand when sidebar is closed */}
        {!sidebarOpen && (
          <div
            className="sticky top-0 z-30 backdrop-blur shadow-sm hidden md:block"
            style={{ background: 'rgba(248,250,252,0.95)' }}
          >
            <div className="px-4 md:px-8 py-2 flex items-center gap-3 border-b border-slate-200">
              <HamburgerButton onClick={() => setSidebarOpen(true)} />
              <Link
                to="/"
                className="select-none hover:opacity-80 transition-opacity"
                style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.35rem', color: 'var(--hp-navy-800, #102354)' }}
              >
                HydroPack
              </Link>
            </div>
          </div>
        )}

        {/* Page content */}
        <div className="px-4 md:px-8 py-4 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
