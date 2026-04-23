import { useMemo, useEffect, useState } from "react";
import NavCard from "../components/pages/NavCard.jsx";
import {
  ShoppingCart,
  TrendingUp,
  Archive,
  BarChart3,
  Scale,
  AlertTriangle,
  Activity
} from "lucide-react";
import api from "../lib/apiClient";
import logo from "../img/LogoHydroPack.png";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";

function KpiCard({
  Icon,
  label,
  value,
  subtitle,
  className = "",
  accentStyle = {},
  labelColor = "#2554b2",
  valueColor = "#0b1a38",
  trend = null,
}) {
  return (
    <Card className={`overflow-hidden group ${className}`}>
      <CardContent className="p-5 flex flex-col gap-4 relative z-10">
        <div className="flex justify-between items-start">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner transition-transform group-hover:scale-110 duration-300"
            style={{ background: '#f0f5ff', color: '#2554b2', ...accentStyle }}
          >
            <Icon className="w-6 h-6" />
          </div>
          {trend && (
            <Badge variant={trend > 0 ? "success" : "destructive"}>
              {trend > 0 ? "+" : ""}{trend}%
            </Badge>
          )}
        </div>
        
        <div className="flex flex-col">
          <span className="text-sm font-semibold uppercase tracking-wider mb-1" style={{ color: labelColor }}>
            {label}
          </span>
          <span className="text-3xl font-bold leading-none tracking-tight mb-2" style={{ color: valueColor, fontFamily: 'Syne, sans-serif' }}>
            {value}
          </span>
          {subtitle && (
            <span className="text-xs font-medium opacity-80" style={{ color: labelColor }}>
              {subtitle}
            </span>
          )}
        </div>
      </CardContent>
      {/* Decorative background flare */}
      <div 
        className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 pointer-events-none"
        style={{ background: accentStyle.color || '#2554b2' }}
      />
    </Card>
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
  const [loading, setLoading] = useState(isAdmin);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    async function fetchSummary() {
      try {
        const data = await api("/dashboard/resumen");
        if (!cancelled) {
          setSummary(data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Error cargando resumen de dashboard:", err);
        if (!cancelled) setLoading(false);
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
    critClass  = "border-amber-200 bg-amber-50/50";
    critAccent = { background: '#fef3c7', color: '#d97706' };
    critLabel  = "#b45309";
    critValue  = "#78350f";
  } else {
    critClass  = "border-red-200 bg-red-50/50";
    critAccent = { background: '#fee2e2', color: '#dc2626' };
    critLabel  = "#b91c1c";
    critValue  = "#7f1d1d";
  }

  return (
    <main className="min-h-[calc(100vh-80px)] relative overflow-hidden flex flex-col pb-10">
      {/* Background Decorators */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--hp-cyan-100)] opacity-40 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-[var(--hp-navy-200)] opacity-30 blur-[80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 w-full z-10 flex-1 flex flex-col mt-8 md:mt-12">
        {/* Brand header */}
        <div className="flex flex-col items-center justify-center gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="relative group">
            <div className="absolute -inset-4 bg-gradient-to-r from-[var(--hp-cyan-400)] to-[var(--hp-navy-500)] rounded-full blur-xl opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <img
              src={logo}
              alt="HydroPack Logo"
              className="relative w-32 h-32 md:w-40 md:h-40 object-contain drop-shadow-2xl"
            />
          </div>
          <div className="text-center">
            <h2
              className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight"
              style={{ fontFamily: 'Syne, sans-serif', color: 'var(--hp-navy-900)' }}
            >
              HydroPack
            </h2>
            <p className="mt-2 text-[var(--hp-slate-600)] font-medium tracking-wide">
              Sistema Inteligente de Gestión
            </p>
          </div>
        </div>

        {/* KPI row (admin only) */}
        {isAdmin && (
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i} className="h-32 animate-pulse bg-slate-100/50" />
                ))}
              </div>
            ) : summary ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <KpiCard
                  Icon={TrendingUp}
                  label="Ventas del mes"
                  value={`$ ${Number(ventasMes.total || 0).toLocaleString("es-AR")}`}
                  subtitle={`${ventasMes.cantidad || 0} operaciones`}
                />
                <KpiCard
                  Icon={ShoppingCart}
                  label="Compras del mes"
                  value={`$ ${Number(comprasMes.total || 0).toLocaleString("es-AR")}`}
                  subtitle={`${comprasMes.cantidad || 0} operaciones`}
                />
                <KpiCard
                  Icon={Scale}
                  label="Volumen procesado"
                  value={`${Number(pesajesMes.kilos_totales || 0).toLocaleString("es-AR")} kg`}
                  subtitle={`${pesajesMes.movimientos || 0} pesajes`}
                />
                <KpiCard
                  Icon={AlertTriangle}
                  label="Estado de Stock"
                  value={`${sinStock} críticos`}
                  subtitle={`sobre ${totalProd} productos`}
                  className={critClass}
                  accentStyle={critAccent}
                  labelColor={critLabel}
                  valueColor={critValue}
                />
              </div>
            ) : null}
          </div>
        )}

        {/* Main nav cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300 fill-mode-both mt-auto">
          {perms.canCompras  && <NavCard to="/compras"  icon={ShoppingCart} label="Compras" description="Gestión de proveedores e insumos" delay="0ms" />}
          {perms.canVentas   && <NavCard to="/ventas"   icon={TrendingUp}   label="Ventas" description="Facturación y clientes" delay="100ms" />}
          {perms.canStock    && <NavCard to="/stock"    icon={Archive}       label="Stock" description="Inventario y pesajes" delay="200ms" />}
          {perms.canReportes && <NavCard to="/reportes" icon={BarChart3}     label="Reportes" description="Analítica y métricas" delay="300ms" />}
        </div>
      </div>
    </main>
  );
}
