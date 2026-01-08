import React from "react";

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
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-4xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 p-6 flex-none">
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

        {/* Content Scrollable Area */}
        <div className="overflow-y-auto p-6 flex-1">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
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
          </div>

          {/* Mobile List (Cards) */}
          <div className="md:hidden space-y-4">
            {items.map((item, index) => (
              <div key={index} className="bg-white rounded-lg border border-slate-200 shadow-sm p-4">
                <div className="space-y-2">
                  {columns.map((col) => {
                    const value = item[col.key] ?? "—";
                    return (
                      <div key={col.key} className="flex justify-between items-start border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                        <span className="text-[#154734] font-bold text-sm w-1/3">
                          {col.label}:
                        </span>
                        <span className="text-slate-700 text-sm w-2/3 text-right">
                          {value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer (Fixed) */}
        <div className="border-t border-slate-200 p-6 pt-4 flex-none">
          {data.total !== undefined && (
            <div className="flex justify-end mb-4">
              <p className="text-lg font-semibold text-[#154734]">
                Total: ${data?.total || 0}
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-[#0f7a4e] text-white hover:bg-[#0d6843] transition"
            >
              Aceptar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}