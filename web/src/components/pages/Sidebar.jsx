import { useState, useEffect, useMemo } from "react";
import { NavLink, useLocation, useNavigate, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import HamburgerButton from "../buttons/HamburgerButton.jsx";
import AccountBadge from "../buttons/AccountBadge.jsx";
import { signOut } from "../../services/authService.mjs";

// ─── HydroPack navy + cyan tokens ─────────────────────────────────────────
const linkBase =
  "block w-full rounded-xl px-4 py-3 text-base font-semibold tracking-[0.2px] transition-colors";
const active  = "text-white shadow-sm";
const inactive = "hover:bg-blue-50";

const activeStyle  = { background: 'linear-gradient(90deg, #1e408f, #2554b2)', color: '#fff' };
const inactiveColor = '#173070';

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
  const SNavLink = ({ to, end, children, sub = false }) => (
    <NavLink
      to={to}
      end={end}
      onClick={onCloseMobile}
      className={({ isActive }) =>
        `${sub ? "pl-2 " : ""}mx-1 ${linkBase} ${isActive ? active : inactive}`
      }
      style={({ isActive }) =>
        isActive ? activeStyle : { color: inactiveColor }
      }
    >
      {children}
    </NavLink>
  );

  const AccordionBtn = ({ expanded, section, children }) => (
    <div className="relative mx-1">
      {children}
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => toggleSection(section)}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-lg transition-colors hover:bg-blue-100"
      >
        <ChevronRight
          className={`w-4 h-4 transition-transform`}
          style={{ color: inactiveColor, transform: expanded ? 'rotate(90deg)' : undefined }}
        />
      </button>
    </div>
  );

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={[
          "fixed md:static z-50 min-h-screen transition-all duration-200 border-r",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          open
            ? "md:w-72 md:pointer-events-auto"
            : "md:w-0 md:border-0 md:pointer-events-none md:overflow-hidden",
        ].join(" ")}
        style={{ background: '#f0f5ff', borderColor: '#dce8fd' }}
      >
        {shouldRenderContent && (
          <div className="w-72 h-full flex flex-col">
            {/* Brand / close button */}
            <div className="flex items-center justify-between px-4 pt-5 pb-4 border-b" style={{ borderColor: '#dce8fd' }}>
              <Link
                to="/"
                onClick={onCloseMobile}
                className="select-none focus:outline-none focus-visible:ring-2 rounded-md"
                style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '1.6rem', lineHeight: 1.1, color: '#0b1a38' }}
              >
                Hydro
                <span style={{ color: '#2554b2' }}>Pack</span>
              </Link>

              <HamburgerButton
                onClick={onToggle}
                className="hidden md:inline-flex"
                label={open ? "Contraer menú" : "Expandir menú"}
              />
            </div>

            <nav className="flex-1 overflow-y-auto md:overflow-visible px-3 pb-3 pt-2 flex flex-col space-y-1">

              {/* Inicio */}
              <SNavLink to="/" end>Inicio</SNavLink>

              {/* Compras */}
              {perms.canCompras && (
                <>
                  <AccordionBtn expanded={comprasOpen} section="compras">
                    <SNavLink to="/compras" end>Compras</SNavLink>
                  </AccordionBtn>
                  {comprasOpen && (
                    <div className="pl-5 space-y-1">
                      <SNavLink to="/compras/nueva" sub>Registrar nueva compra</SNavLink>
                      <SNavLink to="/compras/proveedores" sub>Proveedores</SNavLink>
                    </div>
                  )}
                </>
              )}

              {/* Ventas */}
              {perms.canVentas && (
                <>
                  <AccordionBtn expanded={ventasOpen} section="ventas">
                    <SNavLink to="/ventas" end>Ventas</SNavLink>
                  </AccordionBtn>
                  {ventasOpen && (
                    <div className="pl-5 space-y-1">
                      <SNavLink to="/ventas/nueva" sub>Registrar nueva venta</SNavLink>
                    </div>
                  )}
                </>
              )}

              {/* Stock */}
              {perms.canStockSection && (
                <>
                  <AccordionBtn expanded={stockOpen} section="stock">
                    <SNavLink to="/stock" end>Stock</SNavLink>
                  </AccordionBtn>
                  {stockOpen && (
                    <div className="pl-5 space-y-1">
                      {perms.canStockNuevoProducto    && <SNavLink to="/stock/nuevo-producto" sub>Registrar nuevo producto</SNavLink>}
                      {perms.canStockRegistrarPesaje  && <SNavLink to="/stock/pesaje" sub>Registrar pesaje</SNavLink>}
                      {perms.canStockHistorialPesajes && <SNavLink to="/stock/pesajes" sub>Historial de materiales</SNavLink>}
                    </div>
                  )}
                </>
              )}

              {/* Reportes */}
              {perms.canReportes && (
                <SNavLink to="/reportes" end>Reportes</SNavLink>
              )}

              {/* Seguridad */}
              {perms.isAdmin && (
                <>
                  <AccordionBtn expanded={securityOpen} section="security">
                    <SNavLink to="/seguridad" end>Seguridad</SNavLink>
                  </AccordionBtn>
                  {securityOpen && (
                    <div className="pl-5 space-y-1">
                      <SNavLink to="/seguridad/auditoria" sub>Auditoría</SNavLink>
                      <SNavLink to="/seguridad/roles" sub>Gestión de roles</SNavLink>
                    </div>
                  )}
                </>
              )}

              {/* Salir */}
              <button
                onClick={handleLogout}
                className={`mx-1 w-full text-left ${linkBase} ${inactive}`}
                style={{ color: inactiveColor }}
              >
                Salir
              </button>

              <div className="mt-auto px-1 pt-3">
                <AccountBadge />
              </div>
            </nav>
          </div>
        )}
      </aside>
    </>
  );
}
