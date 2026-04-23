import { useState, useEffect, useMemo } from "react";
import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import { ChevronRight, LogOut, LayoutDashboard, ShoppingCart, TrendingUp, Package, BarChart3, ShieldCheck } from "lucide-react";
import HamburgerButton from "../buttons/HamburgerButton.jsx";
import AccountBadge from "../buttons/AccountBadge.jsx";
import { signOut } from "../../services/authService.mjs";
import { cn } from "../../lib/utils";

// ─── HydroPack navy + cyan tokens ─────────────────────────────────────────
const getRole = () => localStorage.getItem("dn_role") || "";
const ACCORDION = true;

const isSectionActive = (pathname, base) =>
  pathname === base || pathname.startsWith(base + "/");

export default function Sidebar({ open, mobileOpen, onCloseMobile, onToggle }) {
  const { pathname } = useLocation();
  const [role, setRole] = useState(getRole());
  const navigate = useNavigate();

  const [comprasOpen, setComprasOpen]   = useState(() => isSectionActive(pathname, "/compras"));
  const [ventasOpen, setVentasOpen]     = useState(() => isSectionActive(pathname, "/ventas"));
  const [stockOpen, setStockOpen]       = useState(() => isSectionActive(pathname, "/stock"));
  const [reportesOpen, setReportesOpen] = useState(() => isSectionActive(pathname, "/reportes"));
  const [securityOpen, setSecurityOpen] = useState(() => isSectionActive(pathname, "/seguridad"));

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error("[Sidebar] Error al cerrar sesión:", e);
    } finally {
      navigate("/login", { replace: true });
    }
  };

  const openOnly = (key) => {
    setComprasOpen(key === "compras");
    setVentasOpen(key === "ventas");
    setStockOpen(key === "stock");
    setReportesOpen(key === "reportes");
    setSecurityOpen(key === "security");
  };

  const toggleSection = (key) => {
    if (!ACCORDION) {
      if (key === "compras")  setComprasOpen((v) => !v);
      if (key === "ventas")   setVentasOpen((v) => !v);
      if (key === "stock")    setStockOpen((v) => !v);
      if (key === "reportes") setReportesOpen((v) => !v);
      if (key === "security") setSecurityOpen((v) => !v);
      return;
    }
    const isOpen = { compras: comprasOpen, ventas: ventasOpen, stock: stockOpen, reportes: reportesOpen, security: securityOpen }[key];
    if (isOpen) openOnly(null);
    else openOnly(key);
  };

  useEffect(() => {
    if (!ACCORDION) return;
    if (isSectionActive(pathname, "/compras"))   openOnly("compras");
    else if (isSectionActive(pathname, "/ventas"))    openOnly("ventas");
    else if (isSectionActive(pathname, "/stock"))     openOnly("stock");
    else if (isSectionActive(pathname, "/reportes"))  openOnly("reportes");
    else if (isSectionActive(pathname, "/seguridad")) openOnly("security");
    else openOnly(null);
  }, [pathname]);

  useEffect(() => {
    const id = setInterval(() => {
      const r = getRole();
      if (r !== role) setRole(r);
    }, 500);
    return () => clearInterval(id);
  }, [role]);

  const perms = useMemo(() => {
    const r = (role || "").toUpperCase();
    const isAdmin   = r === "ADMIN";
    const isCompras = r === "COMPRAS";
    const isVentas  = r === "VENTAS";
    const isStock   = r === "STOCK";
    return {
      isAdmin,
      isCompras,
      isVentas,
      isStock,
      canCompras:              isAdmin || isCompras,
      canVentas:               isAdmin || isVentas,
      canStockSection:         isAdmin || isStock || isCompras || isVentas,
      canReportes:             isAdmin,
      canStockNuevoProducto:   isAdmin || isStock,
      canStockRegistrarPesaje: isAdmin || isStock,
      canStockHistorialPesajes:isAdmin || isStock || isCompras || isVentas,
    };
  }, [role]);

  const shouldRenderContent = open || mobileOpen;

  // Shared styled NavLink renderer
  const SNavLink = ({ to, end, children, sub = false, icon: Icon }) => (
    <NavLink
      to={to}
      end={end}
      onClick={onCloseMobile}
      className={({ isActive }) => cn(
        "group relative flex items-center w-full rounded-xl px-4 py-3 mx-1 text-[15px] font-medium tracking-wide transition-all duration-300",
        sub ? "pl-11 py-2 text-sm text-[var(--hp-slate-600)] hover:text-[var(--hp-navy-900)] hover:bg-[var(--hp-cyan-50)]/50" : "",
        isActive && !sub ? "text-white bg-gradient-to-r from-[var(--hp-navy-700)] to-[var(--hp-navy-500)] shadow-lg shadow-[var(--hp-navy-900)]/20" : "",
        !isActive && !sub ? "text-[var(--hp-navy-800)] hover:bg-white/60 hover:text-[var(--hp-navy-900)] hover:shadow-sm" : "",
        isActive && sub ? "text-[var(--hp-navy-900)] font-bold bg-[var(--hp-cyan-50)]" : ""
      )}
    >
      {({ isActive }) => (
        <>
          {isActive && !sub && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
          )}
          {Icon && (
            <Icon className={cn("w-5 h-5 mr-3 transition-transform duration-300 group-hover:scale-110", isActive ? "text-[var(--hp-cyan-300)]" : "text-[var(--hp-slate-400)] group-hover:text-[var(--hp-cyan-500)]")} />
          )}
          <span className="relative z-10">{children}</span>
        </>
      )}
    </NavLink>
  );

  const AccordionBtn = ({ expanded, section, children }) => (
    <div className="relative mx-1">
      {children}
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => toggleSection(section)}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-lg transition-colors hover:bg-white/50 text-[var(--hp-slate-400)] hover:text-[var(--hp-navy-900)]"
      >
        <ChevronRight
          className={cn("w-4 h-4 transition-transform duration-300", expanded ? "rotate-90 text-[var(--hp-navy-900)]" : "")}
        />
      </button>
    </div>
  );

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          "fixed md:static z-50 min-h-screen transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] border-r bg-white/70 backdrop-blur-2xl shadow-[4px_0_24px_rgba(0,0,0,0.02)] border-[var(--hp-slate-200)]/60",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          open
            ? "md:w-[280px] md:pointer-events-auto"
            : "md:w-0 md:border-0 md:pointer-events-none md:overflow-hidden"
        )}
      >
        {shouldRenderContent && (
          <div className="w-[280px] h-full flex flex-col relative">
            {/* Subtle mesh background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[var(--hp-cyan-100)]/30 to-transparent rounded-full blur-[60px] pointer-events-none" />

            {/* Brand / close button */}
            <div className="flex items-center justify-between px-6 pt-8 pb-6 mb-2 relative z-10">
              <Link
                to="/"
                onClick={onCloseMobile}
                className="select-none focus:outline-none focus-visible:ring-2 rounded-md flex items-center gap-2 group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--hp-cyan-400)] to-[var(--hp-navy-600)] flex items-center justify-center shadow-lg group-hover:shadow-[var(--hp-cyan-400)]/40 transition-shadow">
                  <div className="w-3 h-3 bg-white rounded-sm rotate-45 group-hover:rotate-90 transition-transform duration-500" />
                </div>
                <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.6rem', lineHeight: 1.1, color: 'var(--hp-navy-900)' }}>
                  Hydro<span style={{ color: 'var(--hp-cyan-500)' }}>Pack</span>
                </div>
              </Link>

              <HamburgerButton
                onClick={onToggle}
                className="hidden md:inline-flex opacity-50 hover:opacity-100"
                label={open ? "Contraer menú" : "Expandir menú"}
              />
            </div>

            <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 flex flex-col space-y-1.5 relative z-10">

              <SNavLink to="/" end icon={LayoutDashboard}>Inicio</SNavLink>

              {perms.canCompras && (
                <>
                  <AccordionBtn expanded={comprasOpen} section="compras">
                    <SNavLink to="/compras" end icon={ShoppingCart}>Compras</SNavLink>
                  </AccordionBtn>
                  <div className={cn("grid transition-all duration-300 ease-in-out", comprasOpen ? "grid-rows-[1fr] opacity-100 mb-2" : "grid-rows-[0fr] opacity-0")}>
                    <div className="overflow-hidden space-y-1 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-[var(--hp-cyan-300)]/50 before:to-transparent">
                      <SNavLink to="/compras/nueva" sub>Registrar compra</SNavLink>
                      <SNavLink to="/compras/proveedores" sub>Proveedores</SNavLink>
                    </div>
                  </div>
                </>
              )}

              {perms.canVentas && (
                <>
                  <AccordionBtn expanded={ventasOpen} section="ventas">
                    <SNavLink to="/ventas" end icon={TrendingUp}>Ventas</SNavLink>
                  </AccordionBtn>
                  <div className={cn("grid transition-all duration-300 ease-in-out", ventasOpen ? "grid-rows-[1fr] opacity-100 mb-2" : "grid-rows-[0fr] opacity-0")}>
                    <div className="overflow-hidden space-y-1 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-[var(--hp-cyan-300)]/50 before:to-transparent">
                      <SNavLink to="/ventas/nueva" sub>Registrar venta</SNavLink>
                      <SNavLink to="/ventas/clientes" sub>Clientes</SNavLink>
                      <SNavLink to="/ventas/precios" sub>Listas de Precios</SNavLink>
                    </div>
                  </div>
                </>
              )}

              {perms.canStockSection && (
                <>
                  <AccordionBtn expanded={stockOpen} section="stock">
                    <SNavLink to="/stock" end icon={Package}>Stock</SNavLink>
                  </AccordionBtn>
                  <div className={cn("grid transition-all duration-300 ease-in-out", stockOpen ? "grid-rows-[1fr] opacity-100 mb-2" : "grid-rows-[0fr] opacity-0")}>
                    <div className="overflow-hidden space-y-1 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-[var(--hp-cyan-300)]/50 before:to-transparent">
                      {perms.canStockNuevoProducto    && <SNavLink to="/stock/nuevo-producto" sub>Nuevo producto</SNavLink>}
                      {perms.canStockRegistrarPesaje  && <SNavLink to="/stock/pesaje" sub>Registrar pesaje</SNavLink>}
                      {perms.canStockHistorialPesajes && <SNavLink to="/stock/pesajes" sub>Historial</SNavLink>}
                    </div>
                  </div>
                </>
              )}

              {perms.canReportes && (
                <SNavLink to="/reportes" end icon={BarChart3}>Reportes</SNavLink>
              )}

              {perms.isAdmin && (
                <>
                  <AccordionBtn expanded={securityOpen} section="security">
                    <SNavLink to="/seguridad" end icon={ShieldCheck}>Seguridad</SNavLink>
                  </AccordionBtn>
                  <div className={cn("grid transition-all duration-300 ease-in-out", securityOpen ? "grid-rows-[1fr] opacity-100 mb-2" : "grid-rows-[0fr] opacity-0")}>
                    <div className="overflow-hidden space-y-1 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-[var(--hp-cyan-300)]/50 before:to-transparent">
                      <SNavLink to="/seguridad/auditoria" sub>Auditoría</SNavLink>
                      <SNavLink to="/seguridad/roles" sub>Gestión de roles</SNavLink>
                    </div>
                  </div>
                </>
              )}

              <div className="flex-1" />

              <div className="pt-4 pb-2 mt-4 relative">
                <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-[var(--hp-slate-200)] to-transparent" />
                
                <button
                  onClick={handleLogout}
                  className="group flex w-full items-center rounded-xl px-4 py-3 mx-1 text-sm font-medium text-[var(--hp-slate-500)] hover:text-red-600 hover:bg-red-50/50 transition-all duration-300"
                >
                  <LogOut className="w-5 h-5 mr-3 group-hover:-translate-x-1 transition-transform" />
                  Cerrar sesión
                </button>

                <div className="mt-2 px-1">
                  <AccountBadge />
                </div>
              </div>
            </nav>
          </div>
        )}
      </aside>
    </>
  );
}
