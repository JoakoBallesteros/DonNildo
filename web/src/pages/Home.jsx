// src/pages/Home.jsx
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

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// Card chica de KPI

// eslint-disable-next-line no-unused-vars
function KpiCard({ icon: Icon, label, value, subtitle }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-emerald-800 text-white px-5 py-4 shadow-md">
      <Icon className="w-7 h-7" />
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-wide opacity-80">
          {label}
        </span>
        <span className="text-xl font-bold leading-tight">{value}</span>
        {subtitle && (
          <span className="text-[11px] opacity-80 mt-0.5">{subtitle}</span>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const role = (localStorage.getItem("dn_role") || "").toUpperCase();
  const isAdmin = role === "ADMIN";

  const perms = useMemo(() => {
    const isCompras = role === "COMPRAS";
    const isVentas = role === "VENTAS";

    return {
      canCompras: isAdmin || isCompras,
      canVentas: isAdmin || isVentas,
      // Stock y Reportes los pueden ver Admin / Compras / Ventas / sin rol (por ahora)
      canStock: isAdmin || isCompras || isVentas || !role,
      canReportes: isAdmin || isCompras || isVentas || !role,
    };
  }, [role, isAdmin]);

  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!isAdmin) return; // solo el admin consulta el dashboard

    let cancelled = false;

    async function fetchSummary() {
      try {
        const data = await api("/dashboard/resumen"); // GET por defecto
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
  const stockCritico = summary?.stockCritico || {};

  // Series para los gráficos (aseguramos que sean números)
  const ventasPorDiaData = (summary?.ventasPorDia || []).map((r) => ({
    dia: r.dia,
    total: Number(r.total) || 0,
  }));

  const kilosPorMaterialData = (summary?.kilosPorMaterial || []).map((r) => ({
    material: r.material,
    kilos: Number(r.kilos) || 0,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 pb-16">
      {/* Encabezado con logo */}
      <div className="flex flex-col items-center gap-4 my-8">
        <img
          src={logo}
          alt="Reciclados Nildo — Packaging Sustentable"
          className="w-48 h-48 md:w-56 md:h-56 object-contain rounded-full"
        />
        <h2 className="text-3xl md:text-4xl font-bold text-emerald-900">
          Don Nildo
        </h2>
      </div>

      {/* Fila de KPIs (solo admin) */}
      {isAdmin && summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <KpiCard
            icon={TrendingUp}
            label="Ventas del mes"
            value={`$ ${Number(ventasMes.total || 0).toLocaleString("es-AR")}`}
            subtitle={`${ventasMes.cantidad} ventas`}
          />
          <KpiCard
            icon={ShoppingCart}
            label="Compras del mes"
            value={`$ ${Number(comprasMes.total || 0).toLocaleString(
              "es-AR"
            )}`}
            subtitle={`${comprasMes.cantidad} compras`}
          />
          <KpiCard
            icon={Scale}
            label="Pesajes del mes"
            value={`${Number(
              pesajesMes.kilos_totales || 0
            ).toLocaleString("es-AR")} kg`}
            subtitle={`${pesajesMes.movimientos} movimientos`}
          />
          <KpiCard
            icon={AlertTriangle}
            label="Stock crítico"
            value={`${stockCritico.sin_stock || 0}`}
            subtitle={`de ${stockCritico.productos_activos || 0} productos`}
          />
        </div>
      )}

      {/* Navegación principal (NavCards grandes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-10">
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

      {/* Gráficos (solo admin) */}
      {isAdmin && summary && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
          <div className="bg-white rounded-2xl shadow p-4">
            <h3 className="font-semibold mb-3 text-emerald-900">
              Ventas por día (mes actual)
            </h3>
            {ventasPorDiaData.length === 0 ? (
              <p className="text-sm text-slate-500">
                No hay ventas registradas en el mes actual.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ventasPorDiaData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) =>
                      `$ ${Number(value).toLocaleString("es-AR")}`
                    }
                  />
                  <Bar dataKey="total" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow p-4">
            <h3 className="font-semibold mb-3 text-emerald-900">
              Kilos pesados por material (mes actual)
            </h3>
            {kilosPorMaterialData.length === 0 ? (
              <p className="text-sm text-slate-500">
                No hay pesajes registrados en el mes actual.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={kilosPorMaterialData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="material" interval={0} angle={-20} dy={10} />
                  <YAxis />
                  <Tooltip
                    formatter={(value) =>
                      `${Number(value).toLocaleString("es-AR")} kg`
                    }
                  />
                  <Bar dataKey="kilos" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
