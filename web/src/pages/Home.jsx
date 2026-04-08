import { useMemo, useEffect, useState } from "react";
import NavCard from "../components/pages/NavCard.jsx";
import {
  ShoppingCart,
  TrendingUp,
  Archive,
  BarChart3,
  Scale,
  AlertTriangle,
} from "lucide-react";
import api from "../lib/apiClient";
import logo from "../img/LogoHydroPack.png";

function KpiCard({
  Icon,
  label,
  value,
  subtitle,
  className = "",
  accentStyle = {},
  labelColor = "#2554b2",
  valueColor = "#0b1a38",
}) {
  return (
    <div
      className={"flex items-center gap-3 rounded-2xl bg-white px-3 py-3 md:px-5 md:py-4 shadow-sm border " + className}
      style={{ borderColor: '#dce8fd' }}
    >
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
        style={{ background: '#f0f5ff', color: '#2554b2', ...accentStyle }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-xs uppercase tracking-wide font-medium" style={{ color: labelColor }}>
          {label}
        </span>
        <span className="text-xl font-bold leading-tight truncate" style={{ color: valueColor, fontFamily: 'Syne, sans-serif' }}>
          {value}
        </span>
        {subtitle && (
          <span className="text-[11px] mt-0.5" style={{ color: labelColor }}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const roleRaw = localStorage.getItem("dn_role") || "";
  const role    = roleRaw.toUpperCase();
  const isAdmin = role === "ADMIN";

  const perms = useMemo(() => {
    const isCompras = role === "COMPRAS";
    const isVentas  = role === "VENTAS";
    const isStock   = role === "STOCK";
    return {
      canCompras:  isAdmin || isCompras,
      canVentas:   isAdmin || isVentas,
      canStock:    isAdmin || isStock || isCompras || isVentas,
      canReportes: isAdmin,
    };
  }, [role, isAdmin]);

  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    async function fetchSummary() {
      try {
        const data = await api("/dashboard/resumen");
        if (!cancelled) setSummary(data);
      } catch (err) {
        console.error("Error cargando resumen de dashboard:", err);
      }
    }
    fetchSummary();
    return () => { cancelled = true; };
  }, [isAdmin]);

  const ventasMes  = summary?.ventasMes  || {};
  const comprasMes = summary?.comprasMes || {};
  const pesajesMes = summary?.pesajesMes || {};

  const sinStock  = summary?.stockCritico?.sin_stock ?? 0;
  const totalProd = summary?.stockCritico?.productos_activos ?? 0;
  const ratio     = totalProd ? sinStock / totalProd : 0;

  let critClass  = "";
  let critAccent = {};
  let critLabel  = "#2554b2";
  let critValue  = "#0b1a38";

  if (sinStock === 0) {
    critClass  = "";
    critAccent = { background: '#f0f5ff', color: '#2554b2' };
  } else if (ratio <= 0.25) {
    critClass  = "border-amber-100 bg-amber-50/40";
    critAccent = { background: '#fef3c7', color: '#92400e' };
    critLabel  = "#92400e";
    critValue  = "#78350f";
  } else {
    critClass  = "border-red-100 bg-red-50/60";
    critAccent = { background: '#fee2e2', color: '#991b1b' };
    critLabel  = "#991b1b";
    critValue  = "#7f1d1d";
  }

  return (
    <main className="hp-home-page">
      <div className="max-w-6xl mx-auto px-4 pb-3 md:pb-5">

        {/* Brand header */}
        <div className="hp-home-header flex flex-col items-center gap-4 my-4 md:my-6">
          <img
            src={logo}
            alt="HydroPack — Sistema de gestión"
            className="hp-home-logo w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 object-contain drop-shadow-xl"
          />
          <h2
            className="hp-home-title text-2xl md:text-3xl lg:text-4xl font-bold"
            style={{ fontFamily: 'Syne, sans-serif', color: '#0b1a38' }}
          >
            HydroPack
          </h2>
        </div>

        {/* KPI row (admin only) */}
        {isAdmin && (
          <>
            {!summary && (
              <p className="text-sm text-slate-400 mb-4 text-center">
                Cargando métricas del mes…
              </p>
            )}
            {summary && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
                <KpiCard
                  Icon={TrendingUp}
                  label="Ventas del mes"
                  value={`$ ${Number(ventasMes.total || 0).toLocaleString("es-AR")}`}
                  subtitle={`${ventasMes.cantidad || 0} ventas`}
                />
                <KpiCard
                  Icon={ShoppingCart}
                  label="Compras del mes"
                  value={`$ ${Number(comprasMes.total || 0).toLocaleString("es-AR")}`}
                  subtitle={`${comprasMes.cantidad || 0} compras`}
                />
                <KpiCard
                  Icon={Scale}
                  label="Pesajes del mes"
                  value={`${Number(pesajesMes.kilos_totales || 0).toLocaleString("es-AR")} kg`}
                  subtitle={`${pesajesMes.movimientos || 0} movimientos`}
                />
                <KpiCard
                  Icon={AlertTriangle}
                  label="Stock crítico"
                  value={`${sinStock}`}
                  subtitle={`de ${totalProd} productos`}
                  className={critClass}
                  accentStyle={critAccent}
                  labelColor={critLabel}
                  valueColor={critValue}
                />
              </div>
            )}
          </>
        )}

        {/* Main nav cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-6">
          {perms.canCompras  && <NavCard to="/compras"  icon={ShoppingCart} label="Compras" />}
          {perms.canVentas   && <NavCard to="/ventas"   icon={TrendingUp}   label="Ventas" />}
          {perms.canStock    && <NavCard to="/stock"    icon={Archive}       label="Stock" />}
          {perms.canReportes && <NavCard to="/reportes" icon={BarChart3}     label="Reportes" />}
        </div>
      </div>
    </main>
  );
}
