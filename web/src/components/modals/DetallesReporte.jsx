import React from "react";

const fmtARS = (n) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const fmtNum = (n) => Number(n || 0).toLocaleString('es-AR');

const safeDate = (s) => {
  if (!s) return "—";
  if (typeof s === "string") return s.slice(0, 10);
  if (s instanceof Date) return s.toISOString().slice(0, 10);
  return "—";
};

export default function ReportDetail({ title = "Detalle de reporte", data = {} }) {
  const src = data?.detalle ? { ...data, ...data.detalle } : data;

  const id = src.id || "—";
  const tipo = src.tipo || "—";
  const producto = src.producto || "—";

  const desde = safeDate(src.fecha_desde || src.desde);
  const hasta = safeDate(src.fecha_hasta || src.hasta);

  const cantidadUnidad = src.cantidadUnidad ?? 0;
  const cantidadDinero = src.cantidadDinero ?? 0;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[#154734]">{title}</h2>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-[#f7fbf8] border rounded-xl p-3">
          <div className="text-xs text-[#5c746b] mb-1">ID reporte</div>
          <div className="text-base font-medium">{id}</div>
        </div>
        <div className="bg-[#f7fbf8] border rounded-xl p-3">
          <div className="text-xs text-[#5c746b] mb-1">Tipo</div>
          <div className="text-base font-medium">{tipo}</div>
        </div>
        <div className="bg-[#f7fbf8] border rounded-xl p-3 col-span-2">
          <div className="text-xs text-[#5c746b] mb-1">Producto</div>
          <div className="text-base font-medium">{producto}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-[#f7fbf8] border rounded-xl p-3">
          <div className="text-xs text-[#5c746b] mb-1">Desde</div>
          <div className="text-base font-medium">{desde}</div>
        </div>
        <div className="bg-[#f7fbf8] border rounded-xl p-3">
          <div className="text-xs text-[#5c746b] mb-1">Hasta</div>
          <div className="text-base font-medium">{hasta}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-[#f7fbf8] border rounded-xl p-3">
          <div className="text-xs text-[#5c746b] mb-1">Cantidad (unidades)</div>
          <div className="text-base font-medium">{fmtNum(cantidadUnidad)}</div>
        </div>
        <div className="bg-[#f7fbf8] border rounded-xl p-3">
          <div className="text-xs text-[#5c746b] mb-1">Monto (dinero)</div>
          <div className="text-base font-medium">{fmtARS(cantidadDinero)}</div>
        </div>
      </div>
    </div>
  );
}