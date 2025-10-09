import { useState } from "react";
import PrimaryButton from "../buttons/PrimaryButton";

/**
 * 🔹 FilterBar (versión generalizada)
 * 
 * Props:
 * - filters: array con las etiquetas de filtro (ej: ["Todo", "Materiales", "Cajas"])
 * - fields: array de campos para el cuadro de filtros (cada campo tiene {label, type, placeholder, name})
 * - onApply: función callback para "Aplicar Filtros"
 * - onReset: función callback para "Reiniciar Filtro"
 * - onFilterSelect: función callback para los botones superiores
 */
export default function FilterBar({
  filters = [],
  fields = [],
  onApply,
  onReset,
  onFilterSelect,
}) {
  const [selectedFilter, setSelectedFilter] = useState(filters[0] || "");

  const handleSelect = (filter) => {
    setSelectedFilter(filter);
    if (onFilterSelect) onFilterSelect(filter);
  };

  return (
    <div className="mb-8">
      {/* 🔹 Botones de filtro superiores */}
      {filters.length > 0 && (
        <div className="flex gap-3 mb-6">
          {filters.map((label) => (
            <button
              key={label}
              onClick={() => handleSelect(label)}
              className={`px-5 py-2 rounded-full font-medium transition ${
                selectedFilter === label
                  ? "bg-[#154734] text-white shadow-sm"
                  : "bg-[#e8f4ef] text-[#154734] hover:bg-[#dbeee6]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* 🔹 Cuadro de filtros */}
      <div className="bg-[#f7fbf8] border border-[#e2ede8] rounded-2xl p-6">
        <div
          className={`grid ${
            fields.length === 3
              ? "grid-cols-[1.2fr_1fr_1fr_auto_auto]"
              : "grid-cols-[repeat(auto-fit,minmax(200px,1fr))]"
          } gap-5 items-end`}
        >
          {/* Campos dinámicos */}
          {fields.map((field) => (
            <div key={field.name} className="flex flex-col">
              <label className="text-sm text-[#154734] mb-1 font-semibold">
                {field.label}
              </label>
              <input
                type={field.type}
                name={field.name}
                placeholder={field.placeholder}
                className="border border-[#d8e4df] rounded-md px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-[#154734]"
              />
            </div>
          ))}

          {/* Botón aplicar */}
          <div className="flex justify-end">
            <button
              onClick={onApply}
              className="bg-[#154734] text-white px-6 py-2 rounded-md hover:bg-[#103a2b]"
            >
              Aplicar Filtros
            </button>
          </div>

          {/* Reiniciar */}
          <div className="flex justify-start">
            <button
              onClick={onReset}
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