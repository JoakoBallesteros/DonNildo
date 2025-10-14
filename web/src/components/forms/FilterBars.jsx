// src/components/forms/FilterBars.jsx
import { useEffect, useState } from "react";

export default function FilterBar({
  filters = [],
  fields = [],
  onApply,
  onReset,
  onFilterSelect,         // recibe el nuevo valor de la pill
  resetSignal,
  selectedFilter,         // 👈 CONTROLADO: viene del padre (p.ej. "Todo"|"Cajas"|"Materiales")
  applyLabel = "Aplicar Filtros",
}) {
  // solo guardamos los campos del formulario
  const [formData, setFormData] = useState({});

  const current = selectedFilter ?? filters[0] ?? ""; // para render

  const handleSelect = (filter) => {
    onFilterSelect?.(filter); // no seteamos estado local de la pill
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleApply = () => {
    onApply?.({ ...formData, tipo: current });
  };

  const handleReset = () => {
    setFormData({});
    onReset?.();
  };

  // limpiar cuando llega resetSignal
  useEffect(() => {
    setFormData({});
  }, [resetSignal]);

  return (
    <div className="mb-6">
      {/* 🔹 Pills */}
      {filters.length > 0 && (
        <div className="flex gap-3 mb-4">
          {filters.map((f) => (
            <button
              key={f}
              type="button"                             // evita submit accidental
              onClick={() => handleSelect(f)}
              className={`px-4 py-1.5 rounded-full font-medium transition ${
                current === f
                  ? "bg-[#154734] text-white shadow-sm"
                  : "bg-[#e8f4ef] text-[#154734] hover:bg-[#dbeee6]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* 🔹 Cuadro de filtros */}
      <div className="bg-[#f7fbf8] border border-[#e2ede8] rounded-2xl p-6">
        <div className="grid grid-cols-[1.2fr_1fr_1fr_auto_auto] gap-5 items-end">
          {fields.map((field) => (
            <div key={field.name} className="flex flex-col">
              <label className="text-sm text-[#154734] mb-1 font-semibold">
                {field.label}
              </label>

              {field.type === "select" ? (
                <select
                  name={field.name}
                  value={formData[field.name] ?? ""}
                  onChange={handleChange}
                  className="border border-[#d8e4df] rounded-md px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-[#154734]"
                >
                  {(field.options || []).map((opt) => (
                    <option key={String(opt.value)} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type}
                  name={field.name}
                  value={formData[field.name] ?? ""}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className="border border-[#d8e4df] rounded-md px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-[#154734]"
                />
              )}
            </div>
          ))}

          {/* Botón aplicar */}
          <button
            type="button"
            onClick={handleApply}
            className="bg-[#154734] text-white px-6 py-2 rounded-md hover:bg-[#103a2b]"
          >
            {applyLabel}
          </button>

          {/* Reiniciar */}
          <div className="flex justify-start">
            <button
              type="button"
              onClick={handleReset}
              className="text-[#154734] underline text-sm hover:text-[#0d2e22]"
            >
              Reiniciar filtro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

