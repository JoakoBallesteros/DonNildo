import React from "react";

const fmtARS = (n) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(Number(n)) ? Number(n) : 0);

const isISO = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const safeDate = (s) => (isISO(s) ? s : "—");

export default function ReportDetail({
  title = "Detalle de reporte",
  data = {},
}) {
  // Acepta tanto la fila entera como un objeto "detalle" viejo.
  const src = data?.detalle ? { ...data, ...data.detalle } : data;

  const id = src.id || src.reporteId || src.code || "—";
  const tipo = src.tipo || (src.scope?.toLowerCase().includes("venta") ? "Venta" : src.scope?.toLowerCase().includes("comp") ? "Compra" : "—");
  const producto = src.producto || src.productoNombre || "—";

  const desde = safeDate(src.desde || src.fechaDesde || src?.rango?.desde);
  const hasta = safeDate(src.hasta || src.fechaHasta || src?.rango?.hasta);

  const cantidadUnidad =
    src.cantidadUnidad ?? src.unidades ?? src.cantidad ?? src?.totales?.unidades ?? 0;

  const cantidadDinero =
    src.cantidadDinero ??
    src?.totales?.monto ??
    (src.precio != null && (src.cantidadUnidad ?? src.cantidad) != null
      ? Number(src.precio) * Number(src.cantidadUnidad ?? src.cantidad)
      : 0);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-[#154734]">{title}</h2>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-[#f7fbf8] border border-[#e2ede8] rounded-xl p-3">
          <div className="text-[#5c746b] text-xs">ID reporte</div>
          <div className="font-semibold">{id}</div>
        </div>
        <div className="bg-[#f7fbf8] border border-[#e2ede8] rounded-xl p-3">
          <div className="text-[#5c746b] text-xs">Tipo</div>
          <div className="font-semibold">{tipo}</div>
        </div>
        <div className="bg-[#f7fbf8] border border-[#e2ede8] rounded-xl p-3 col-span-2">
          <div className="text-[#5c746b] text-xs">Producto</div>
          <div className="font-semibold">{producto}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-[#f7fbf8] border border-[#e2ede8] rounded-xl p-3">
          <div className="text-[#5c746b] text-xs">Desde</div>
          <div className="font-semibold">{desde}</div>
        </div>
        <div className="bg-[#f7fbf8] border border-[#e2ede8] rounded-xl p-3">
          <div className="text-[#5c746b] text-xs">Hasta</div>
          <div className="font-semibold">{hasta}</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-[#f7fbf8] border border-[#e2ede8] rounded-xl p-3">
          <div className="text-[#5c746b] text-xs">Cantidad (unidades)</div>
          <div className="text-xl font-bold">{cantidadUnidad}</div>
        </div>
        <div className="bg-[#f7fbf8] border border-[#e2ede8] rounded-xl p-3">
          <div className="text-[#5c746b] text-xs">Monto (dinero)</div>
          <div className="text-xl font-bold">{fmtARS(cantidadDinero)}</div>
        </div>
      </div>
    </div>
  );
}
