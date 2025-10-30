// src/components/Sidebar.jsx
import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import HamburgerButton from "../buttons/HamburgerButton.jsx";

const linkBase =
  "block w-full rounded-xl px-4 py-3 text-base font-semibold tracking-[0.2px] transition-colors";
const active = "bg-emerald-700 text-white";
const inactive = "text-emerald-900/85 hover:bg-emerald-100";

const userRole = localStorage.getItem("dn_role"); // 'ADMIN' | 'OPERADOR'
const ACCORDION = true; // modo acordeón: sólo una sección abierta

// helper de pertenencia de ruta
const isSectionActive = (pathname, base) =>
  pathname === base || pathname.startsWith(base + "/");

export default function Sidebar({ open, mobileOpen, onCloseMobile, onToggle }) {
  const { pathname } = useLocation();

  // Estado inicial: cerrado, excepto la sección que coincide con la ruta actual
  const [ventasOpen, setVentasOpen] = useState(() => isSectionActive(pathname, "/ventas"));
  const [stockOpen, setStockOpen] = useState(() => isSectionActive(pathname, "/stock"));
  const [reportesOpen, setReportesOpen] = useState(() => isSectionActive(pathname, "/reportes"));
  const [securityOpen, setSecurityOpen] = useState(() => isSectionActive(pathname, "/seguridad"));

  // Helpers acordeón
  const openOnly = (key) => {
    setVentasOpen(key === "ventas");
    setStockOpen(key === "stock");
    setReportesOpen(key === "reportes");
    setSecurityOpen(key === "security");
  };

  const toggleSection = (key) => {
    if (!ACCORDION) {
      if (key === "ventas") setVentasOpen(v => !v);
      if (key === "stock") setStockOpen(v => !v);
      if (key === "reportes") setReportesOpen(v => !v);
      if (key === "security") setSecurityOpen(v => !v);
      return;
    }
    const isOpen = {
      ventas: ventasOpen,
      stock: stockOpen,
      reportes: reportesOpen,
      security: securityOpen,
    }[key];

    if (isOpen) openOnly(null);   // si estaba abierta, cerramos todas
    else openOnly(key);           // si estaba cerrada, abrimos sólo esa
  };

  // Sincroniza con la ruta: al navegar, abre sólo la sección correspondiente
  useEffect(() => {
    if (!ACCORDION) return;
    if (isSectionActive(pathname, "/ventas"))       openOnly("ventas");
    else if (isSectionActive(pathname, "/stock"))   openOnly("stock");
    else if (isSectionActive(pathname, "/reportes"))openOnly("reportes");
    else if (isSectionActive(pathname, "/seguridad"))openOnly("security");
    else openOnly(null);
  }, [pathname]);

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
          "fixed md:static z-50 bg-emerald-50 border-r border-emerald-100 h-screen transition-all duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          open
            ? "md:w-72 md:pointer-events-auto"
            : "md:w-0 md:border-0 md:pointer-events-none md:overflow-hidden",
        ].join(" ")}
      >
        {open && (
          <div className="w-72 h-full flex flex-col">
            {/* Top row: marca + botón */}
            <div className="flex items-center justify-between px-4 pt-5 pb-4">
              <div className="text-3xl leading-7 font-extrabold text-emerald-900 select-none">
                DON
                <br />
                NILDO
              </div>
              <HamburgerButton onClick={onToggle} />
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-3 pb-6 space-y-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `mx-1 ${linkBase} ${isActive ? active : inactive}`
                }
              >
                Inicio
              </NavLink>

              <NavLink
                to="/compras"
                className={({ isActive }) =>
                  `mx-1 ${linkBase} ${isActive ? active : inactive}`
                }
              >
                Compras
              </NavLink>

              {/* Ventas */}
              <div className="relative mx-1">
                <NavLink
                  to="/ventas"
                  end
                  className={({ isActive }) =>
                    `pr-10 ${linkBase} ${isActive ? active : inactive}`
                  }
                >
                  Ventas
                </NavLink>
                <button
                  type="button"
                  aria-expanded={ventasOpen}
                  aria-label={ventasOpen ? "Ocultar opciones de ventas" : "Mostrar opciones de ventas"}
                  onClick={() => toggleSection("ventas")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-lg hover:bg-emerald-100"
                >
                  <ChevronRight className={`w-4 h-4 transition-transform ${ventasOpen ? "rotate-90" : ""}`} />
                </button>
              </div>
              {ventasOpen && (
                <div className="pl-5 space-y-1">
                  <NavLink
                    to="/ventas/nueva"
                    className={({ isActive }) =>
                      `mx-1 ${linkBase} ${isActive ? active : inactive}`
                    }
                  >
                    Registrar nueva venta
                  </NavLink>
                </div>
              )}

              {/* Stock */}
              <div className="relative mx-1">
                <NavLink
                  to="/stock"
                  end
                  className={({ isActive }) =>
                    `pr-10 ${linkBase} ${isActive ? active : inactive}`
                  }
                >
                  Stock
                </NavLink>
                <button
                  type="button"
                  aria-expanded={stockOpen}
                  aria-label={stockOpen ? "Ocultar opciones de stock" : "Mostrar opciones de stock"}
                  onClick={() => toggleSection("stock")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-lg hover:bg-emerald-100"
                >
                  <ChevronRight className={`w-4 h-4 transition-transform ${stockOpen ? "rotate-90" : ""}`} />
                </button>
              </div>
              {stockOpen && (
                <div className="pl-5 space-y-1">
                  <NavLink
                    to="/stock/nuevo-producto"
                    className={({ isActive }) =>
                      `mx-1 ${linkBase} ${isActive ? active : inactive}`
                    }
                  >
                    Registrar nuevo producto
                  </NavLink>
                  <NavLink
                    to="/stock/pesaje"
                    className={({ isActive }) =>
                      `mx-1 ${linkBase} ${isActive ? active : inactive}`
                    }
                  >
                    Registrar pesaje
                  </NavLink>
                </div>
              )}

              {/* Reportes */}
              <div className="relative mx-1">
                <NavLink
                  to="/reportes"
                  end
                  className={({ isActive }) =>
                    `pr-10 ${linkBase} ${isActive ? active : inactive}`
                  }
                >
                  Reportes
                </NavLink>
                <button
                  type="button"
                  aria-expanded={reportesOpen}
                  aria-label={reportesOpen ? "Ocultar opciones de reportes" : "Mostrar opciones de reportes"}
                  onClick={() => toggleSection("reportes")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-lg hover:bg-emerald-100"
                >
                  <ChevronRight className={`w-4 h-4 transition-transform ${reportesOpen ? "rotate-90" : ""}`} />
                </button>
              </div>
              {reportesOpen && (
                <div className="pl-5 space-y-1">
                  <NavLink
                    to="/reportes/nuevo"
                    className={({ isActive }) =>
                      `mx-1 ${linkBase} ${isActive ? active : inactive}`
                    }
                  >
                    Crear nuevo reporte
                  </NavLink>
                </div>
              )}

              {/* Seguridad (solo ADMIN) */}
              {userRole === "ADMIN" && (
                <>
                  <div className="relative mx-1">
                    <NavLink
                      to="/seguridad"
                      end
                      className={({ isActive }) =>
                        `pr-10 ${linkBase} ${isActive ? active : inactive}`
                      }
                    >
                      Seguridad
                    </NavLink>
                    <button
                      type="button"
                      aria-expanded={securityOpen}
                      onClick={() => toggleSection("security")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-lg hover:bg-emerald-100"
                    >
                      <ChevronRight className={`w-4 h-4 transition-transform ${securityOpen ? "rotate-90" : ""}`} />
                    </button>
                  </div>
                  {securityOpen && (
                    <div className="pl-5 space-y-1">
                      <NavLink
                        to="/seguridad/auditoria"
                        className={({ isActive }) =>
                          `mx-1 ${linkBase} ${isActive ? active : inactive}`
                        }
                      >
                        Auditoría
                      </NavLink>
                      <NavLink
                        to="/seguridad/roles"
                        className={({ isActive }) =>
                          `mx-1 ${linkBase} ${isActive ? active : inactive}`
                        }
                      >
                        Gestión de roles
                      </NavLink>
                    </div>
                  )}
                </>
              )}

              {/* Salir */}
              <button
                onClick={() => {
                  // Limpiar auth (local y session)
                  localStorage.removeItem("dn_token");
                  localStorage.removeItem("dn_user");
                  localStorage.removeItem("dn_refresh");
                  sessionStorage.removeItem("dn_token");
                  sessionStorage.removeItem("dn_user");
                  sessionStorage.removeItem("dn_refresh");
                  // Redirigir
                  window.location.replace("/login");
                }}
                className={`mx-1 w-full text-left ${linkBase} ${inactive}`}
              >
                Salir
              </button>
            </nav>
          </div>
        )}
      </aside>
    </>
  );
}

