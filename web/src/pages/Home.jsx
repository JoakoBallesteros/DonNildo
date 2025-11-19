// src/pages/Home.jsx
import { useMemo } from "react";
import NavCard from "../components/pages/NavCard.jsx";
import {
  ShoppingCart,
  TrendingUp,
  Archive,
  BarChart3,
} from "lucide-react";
import logo from "../img/LogoDonNildo.png";

export default function Home() {
  // rol guardado por el login / AccountBadge
  const role = localStorage.getItem("dn_role") || "";

  const perms = useMemo(() => {
    const r = role.toUpperCase();

    const isAdmin = r === "ADMIN";
    const isCompras = r === "COMPRAS";
    const isVentas = r === "VENTAS";

    return {
      canCompras: isAdmin || isCompras,
      canVentas: isAdmin || isVentas,
      // Stock y Reportes los pueden ver Admin / Compras / Ventas
      canStock: isAdmin || isCompras || isVentas || !r,
      canReportes: isAdmin || isCompras || isVentas || !r,
    };
  }, [role]);

  return (
    <div className="max-w-6xl mx-auto px-4 pb-16">
      {/* Encabezado con logo */}
      <div className="flex flex-col items-center gap-4 my-8">
        <img
          src={logo}
          alt="Reciclados Nildo — Packaging Sustentable"
          className="w-50 h-50 md:w-56 md:h-56 object-contain rounded-full"
        />
        <h2 className="text-3xl md:text-4xl font-bold text-emerald-900">
          Don Nildo
        </h2>
      </div>

      {/* Cuadrícula de botones grandes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-6">
        {perms.canCompras && (
          <NavCard to="/compras" icon={ShoppingCart} label="Compras" />
        )}
        {perms.canVentas && (
          <NavCard to="/ventas" icon={TrendingUp} label="Ventas" />
        )}
        {perms.canStock && (
          <NavCard to="/stock" icon={Archive} label="Stock" />
        )}
        {perms.canReportes && (
          <NavCard to="/reportes" icon={BarChart3} label="Reportes" />
        )}
      </div>
    </div>
  );
}
