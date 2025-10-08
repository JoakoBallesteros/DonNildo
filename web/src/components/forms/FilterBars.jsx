import { useState } from "react";
import PrimaryButton from "../buttons/PrimaryButton";

export default function FilterBar({ onFilter }) {
  const [selectedFilter, setSelectedFilter] = useState("Todo");
  const filters = ["Todo", "Materiales", "Cajas", "Mixtas"];

  const handleSelect = (filter) => {
    setSelectedFilter(filter);
    if (onFilter) onFilter(filter);
  };

  return (
    <div className="mb-6">
      {/* 🔹 Botones de filtro arriba */}
      <div className="flex gap-3 mb-4">
        {filters.map((label) => (
          <button
            key={label}
            onClick={() => handleSelect(label)}
            className={`px-4 py-2 rounded-full font-medium transition ${
              selectedFilter === label
                ? "bg-[#154734] text-white"
                : "bg-[#e8f4ef] text-[#154734] hover:bg-[#d3ebdd]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 🔹 Cuadro de filtros */}
      <div className="bg-[#f9fdfb] border border-[#d8e6de] rounded-2xl p-5">
        <div className="grid grid-cols-4 gap-4 items-end">
          <div className="flex flex-col">
            <label className="text-sm text-[#154734] mb-1 font-medium">
              Buscar
            </label>
            <input
              type="text"
              placeholder="Proveedor, orden..."
              className="border border-[#cfdcd3] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#154734]"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-[#154734] mb-1 font-medium">
              Desde
            </label>
            <input
              type="text"
              placeholder="dd/mm/aaaa"
              className="border border-[#cfdcd3] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#154734]"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-[#154734] mb-1 font-medium">
              Hasta
            </label>
            <input
              type="text"
              placeholder="dd/mm/aaaa"
              className="border border-[#cfdcd3] rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[#154734]"
            />
          </div>

          <div className="flex rounded-lg px-3 justify-center">
            <PrimaryButton text="Aplicar Filtros" className="w-[400px]"/>
          </div>
        </div>
      </div>
    </div>
  );
}
