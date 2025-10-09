import { useState } from "react";
import PrimaryButton from "../buttons/PrimaryButton";

export default function FilterBar({ onFilter }) {
  const [selectedFilter, setSelectedFilter] = useState("Todo");
  const filters = ["Todo", "Materiales", "Cajas", "Mixtas"];

  const handleSelect = (filter) => {
    setSelectedFilter(filter);
    if (onFilter) onFilter(filter);
  };

  const handleReset = () => {
    // acá podrías resetear tus filtros o llamar a una función externa
    console.log("Filtros reiniciados");
  };

  return (
    <div className="mb-8">
      {/* 🔹 Botones de filtro superiores */}
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

      {/* 🔹 Cuadro de filtros */}
      <div className="bg-[#f7fbf8] border border-[#e2ede8] rounded-2xl p-6">
        <div className="grid grid-cols-[1.2fr_1fr_1fr_auto_auto] gap-5 items-end">
        {/* Buscar */}
        <div className="flex flex-col">
          <label className="text-sm text-[#154734] mb-1 font-semibold">
            Buscar
          </label>
          <input
            type="text"
            placeholder="Proveedor, orden..."
            className="border border-[#d8e4df] rounded-md px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-[#154734]"
          />
        </div>

        {/* Fecha desde */}
        <div className="flex flex-col">
          <label className="text-sm text-[#154734] mb-1 font-semibold">
            Fecha desde
          </label>
          <input
            type="date"
            className="border border-[#d8e4df] rounded-md px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-[#154734]"
          />
        </div>

        {/* Fecha hasta */}
        <div className="flex flex-col">
          <label className="text-sm text-[#154734] mb-1 font-semibold">
            Fecha hasta
          </label>
          <input
            type="date"
            className="border border-[#d8e4df] rounded-md px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-[#154734]"
          />
        </div>

        {/* Botón aplicar */}
        <div className="flex justify-end">
          <button className="bg-[#154734] text-white px-6 py-2 rounded-md hover:bg-[#103a2b]">
            Aplicar Filtros
          </button>
        </div>

        {/* Reiniciar */}
        <div className="flex justify-start">
          <button className="text-[#154734] underline text-sm hover:text-[#0d2e22]">
            Reiniciar filtro
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}