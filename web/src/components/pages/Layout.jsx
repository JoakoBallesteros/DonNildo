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
    <div className="min-h-screen flex font-sans relative overflow-hidden bg-[var(--hp-slate-50)]">
      {/* Global animated background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-[var(--hp-cyan-100)]/40 to-transparent blur-[120px] mix-blend-multiply opacity-50 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-[var(--hp-navy-200)]/30 to-[var(--hp-cyan-50)]/20 blur-[100px] mix-blend-multiply opacity-50 animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
        <div className="absolute top-[40%] left-[20%] w-[30%] h-[30%] rounded-full bg-[var(--hp-cyan-50)]/40 blur-[80px] opacity-40 animate-pulse" style={{ animationDuration: '7s', animationDelay: '1s' }} />
      </div>

      <Sidebar
        open={sidebarOpen}
        mobileOpen={sidebarMobileOpen}
        onCloseMobile={() => setSidebarMobileOpen(false)}
        onToggle={() => setSidebarOpen((o) => !o)}
      />

      <main className="flex-1 min-h-screen overflow-y-auto overflow-x-hidden relative z-10 scroll-smooth">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-[var(--hp-slate-200)]/60 shadow-sm md:hidden transition-all duration-300">
          <div className="px-4 py-3 flex items-center gap-4">
            <HamburgerButton
              onClick={() => setSidebarMobileOpen(true)}
              label="Abrir menú"
            />
            <Link
              to="/"
              className="select-none hover:opacity-80 transition-opacity flex items-center gap-2 group"
            >
              <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[var(--hp-cyan-400)] to-[var(--hp-navy-600)] flex items-center justify-center shadow-md">
                <div className="w-2.5 h-2.5 bg-white rounded-sm rotate-45 group-hover:rotate-90 transition-transform duration-500" />
              </div>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.4rem', color: 'var(--hp-navy-900)' }}>
                Hydro<span className="text-[var(--hp-cyan-500)]">Pack</span>
              </span>
            </Link>
          </div>
        </div>

        {/* Desktop: show brand when sidebar is closed */}
        {!sidebarOpen && (
          <div className="sticky top-0 z-30 bg-white/60 backdrop-blur-xl border-b border-[var(--hp-slate-200)]/50 shadow-[0_4px_30px_rgba(0,0,0,0.02)] hidden md:block transition-all duration-300">
            <div className="px-6 py-4 flex items-center gap-4">
              <HamburgerButton onClick={() => setSidebarOpen(true)} />
              <Link
                to="/"
                className="select-none hover:opacity-80 transition-opacity flex items-center gap-2 group ml-2"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--hp-cyan-400)] to-[var(--hp-navy-600)] flex items-center justify-center shadow-md">
                  <div className="w-3 h-3 bg-white rounded-sm rotate-45 group-hover:rotate-90 transition-transform duration-500" />
                </div>
                <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.5rem', color: 'var(--hp-navy-900)' }}>
                  Hydro<span className="text-[var(--hp-cyan-500)]">Pack</span>
                </span>
              </Link>
            </div>
          </div>
        )}

        {/* Page content */}
        <div className="px-4 md:px-8 py-6 md:py-8 max-w-[1600px] mx-auto min-h-full">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
