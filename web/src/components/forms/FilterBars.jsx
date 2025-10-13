import { useEffect, useState } from "react";

export default function FilterBar({
  filters = [],
  fields = [],
  onApply,
  onReset,
  onFilterSelect,
  resetSignal,
  selectedFilter: externalSelected, // 👈 nuevo prop
}) {
  const [selectedFilter, setSelectedFilter] = useState(filters[0] || "");
  const [formData, setFormData] = useState({});

  // 🔹 sincroniza el valor desde el padre
  useEffect(() => {
    if (externalSelected) setSelectedFilter(externalSelected);
  }, [externalSelected]);

  const handleSelect = (filter) => {
    setSelectedFilter(filter);
    if (onFilterSelect) onFilterSelect(filter);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleApply = () => {
    if (onApply) onApply({ ...formData, tipo: selectedFilter });
  };

  const handleReset = () => {
    setFormData({});
    if (onReset) onReset();
  };

  // Limpia campos cuando se reinicia
  useEffect(() => {
    setFormData({});
    setSelectedFilter(filters[0] || "");
  }, [resetSignal]);

  return (
    <div className="mb-6">
      {/* 🔹 Botones de filtro superiores */}
      {filters.length > 0 && (
        <div className="flex gap-3 mb-4">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => handleSelect(f)}
              className={`px-4 py-1.5 rounded-full font-medium transition ${
                selectedFilter === f
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
              <input
                type={field.type}
                name={field.name}
                value={formData[field.name] || ""}
                onChange={handleChange}
                placeholder={field.placeholder}
                className="border border-[#d8e4df] rounded-md px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-[#154734]"
              />
            </div>
          ))}

          {/* Botón aplicar */}
          <div className="flex justify-end">
            <button
              onClick={handleApply}
              className="bg-[#154734] text-white px-6 py-2 rounded-md hover:bg-[#103a2b]"
            >
              Aplicar Filtros
            </button>
          </div>

          {/* Reiniciar */}
          <div className="flex justify-start">
            <button
              onClick={handleReset}
              className="text-[#154734] underline text-sm hover:text-[#0d2e22] "
            >
              Reiniciar filtro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
