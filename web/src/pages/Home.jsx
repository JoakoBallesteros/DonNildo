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
import logo from "../img/LogoDonNildo.png";


function KpiCard({

  Icon,
  label,
  value,
  subtitle,
  className = "",
  accentClass = "",
  labelClass = "",
  valueClass = "",
}) {
  const finalLabelClass =
    labelClass || "text-xs uppercase tracking-wide text-emerald-700/70";
  const finalValueClass =
    valueClass || "text-xl font-bold text-emerald-900 leading-tight";

  return (
    <div
      className={
        "flex items-center gap-3 rounded-2xl bg-white px-3 py-3 md:px-5 md:py-4 shadow-sm border border-emerald-50 " +
        className
      }
    >
      <div
        className={
          "flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 " +
          accentClass
        }
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex flex-col">
        <span className={finalLabelClass}>{label}</span>
        <span className={finalValueClass}>{value}</span>
        {subtitle && (
          <span className="text-[11px] text-emerald-700/70 mt-0.5">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const roleRaw = localStorage.getItem("dn_role") || "";
  const role = roleRaw.toUpperCase();
  const isAdmin = role === "ADMIN";

  const perms = useMemo(() => {
    const isCompras = role === "COMPRAS";
    const isVentas = role === "VENTAS";
    const isStock = role === "STOCK";

    return {

      canCompras: isAdmin || isCompras,
      canVentas: isAdmin || isVentas,

      canStock: isAdmin || isStock || isCompras || isVentas,

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
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const ventasMes = summary?.ventasMes || {};
  const comprasMes = summary?.comprasMes || {};
  const pesajesMes = summary?.pesajesMes || {};

  // ==== Semáforo stock crítico ====
  const sinStock = summary?.stockCritico?.sin_stock ?? 0;
  const totalProd = summary?.stockCritico?.productos_activos ?? 0;
  const ratio = totalProd ? sinStock / totalProd : 0;


  let critBg = "";
  let critAccent = "";
  let critLabelColor = "text-xs uppercase tracking-wide text-emerald-700/70";
  let critValueColor = "text-xl font-bold text-emerald-900 leading-tight";

  if (sinStock === 0) {
    critBg = "border border-emerald-100";
    critAccent = "bg-emerald-50 text-emerald-700";
  } else if (ratio <= 0.25) {
    critBg = "border border-amber-100 bg-amber-50/40";
    critAccent = "bg-amber-100 text-amber-700";
    critLabelColor = "text-xs uppercase tracking-wide text-amber-700/80";
    critValueColor = "text-xl font-bold text-amber-900 leading-tight";
  } else {
    critBg = "border border-red-100 bg-red-50/60";
    critAccent = "bg-red-100 text-red-700";
    critLabelColor = "text-xs uppercase tracking-wide text-red-700/80";
    critValueColor = "text-xl font-bold text-red-900 leading-tight";
  }

  return (
    <main className="dn-home-page">
      <div className="max-w-6xl mx-auto px-4 pb-3 md:pb-5">

        {/* Encabezado con logo */}

        <div className="dn-home-header flex flex-col items-center gap-4 my-4 md:my-6">
          <img
            src={logo}
            alt="Reciclados Nildo — Packaging Sustentable"
            className="dn-home-logo w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 object-contain rounded-full"
          />
          <h2 className="dn-home-title text-2xl md:text-3xl lg:text-4xl font-bold text-emerald-900">
            Don Nildo
          </h2>
        </div>


        {/* Fila de KPIs (solo admin) */}
        {isAdmin && (
          <>
            {!summary && (
              <p className="text-sm text-slate-500 mb-4">
                Cargando métricas del mes…
              </p>
            )}

            {summary && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
                <KpiCard
                  Icon={TrendingUp}
                  label="Ventas del mes"
                  value={`$ ${Number(ventasMes.total || 0).toLocaleString(
                    "es-AR"
                  )}`}
                  subtitle={`${ventasMes.cantidad || 0} ventas`}
                />
                <KpiCard
                  Icon={ShoppingCart}
                  label="Compras del mes"
                  value={`$ ${Number(comprasMes.total || 0).toLocaleString(
                    "es-AR"
                  )}`}
                  subtitle={`${comprasMes.cantidad || 0} compras`}
                />
                <KpiCard
                  Icon={Scale}
                  label="Pesajes del mes"
                  value={`${Number(pesajesMes.kilos_totales || 0).toLocaleString(
                    "es-AR"
                  )} kg`}
                  subtitle={`${pesajesMes.movimientos || 0} movimientos`}
                />
                <KpiCard
                  Icon={AlertTriangle}
                  label="Stock crítico"
                  value={`${sinStock}`}
                  subtitle={`de ${totalProd} productos`}
                  className={critBg}
                  accentClass={critAccent}
                  labelClass={critLabelColor}
                  valueClass={critValueColor}
                />
              </div>
            )}
          </>
        )}

        {/* Navegación principal (NavCards grandes) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-6">
          {perms.canCompras && (
            <NavCard to="/compras" icon={ShoppingCart} label="Compras" />
          )}
          {perms.canVentas && (
            <NavCard to="/ventas" icon={TrendingUp} label="Ventas" />
          )}
          {perms.canStock && <NavCard to="/stock" icon={Archive} label="Stock" />}
          {perms.canReportes && (
            <NavCard to="/reportes" icon={BarChart3} label="Reportes" />
          )}
        </div>
      </div>
    </main>
  );
}
