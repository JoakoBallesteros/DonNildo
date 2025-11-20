import React from "react";

/**
 * 🔹 DetailModal (versión generalizada)
 *
 * Props:
 * - isOpen: boolean → controla si se muestra el modal
 * - onClose: función → se ejecuta al cerrar el modal
 * - title: string → título del modal
 * - columns: array → nombres de columnas [{key, label}]
 * - data: objeto con la información principal (ej: { numero, fecha, total, items: [] })
 * - itemsKey: string → nombre de la propiedad que contiene los ítems (ej: "productos", "detalles", etc.)
 */
export default function DetailModal({
  isOpen,
  onClose,
  title = "Detalle",
  columns = [],
  data = {},
  itemsKey = "items",
}) {
  if (!isOpen) return null;

  const items = data[itemsKey] || [];

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-start pt-24 z-50">
      <div className="bg-white rounded-2xl shadow-lg w-[80%] max-w-4xl p-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
          <h3 className="text-xl font-bold text-[#154734]">
            {title} Nº {data?.numero || ""}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-[#154734] font-semibold"
          >
            ✕
          </button>
        </div>

        {/* Tabla de detalles */}
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-[#e8f4ef] text-[#154734]">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="px-3 py-2">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr
                key={index}
                className="border-t border-slate-100 hover:bg-[#f6faf7]"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-2">
                    {item[col.key] ?? ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        {data.total !== undefined && (
          <div className="flex justify-end mt-6 border-t border-slate-200 pt-4">
            <p className="text-lg font-semibold text-[#154734]">
              Total: ${data?.total || 0}
            </p>
          </div>
        )}
        {/* Footer: botón para cerrar el modal sin usar la X */}
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-[#0f7a4e] text-white hover:bg-[#0d6843] transition"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}