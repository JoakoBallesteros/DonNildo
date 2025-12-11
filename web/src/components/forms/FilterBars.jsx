import { useEffect, useState } from "react";

export default function FilterBar({
  filters = [],
  fields = [],
  onApply,
  onReset,
  onFilterSelect,
  resetSignal,
  selectedFilter,
  applyLabel = "Aplicar Filtros",
}) {
  const [formData, setFormData] = useState({});
  const current = selectedFilter ?? filters[0] ?? "";

  const handleSelect = (filter) => onFilterSelect?.(filter);

 
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    const next = { ...formData, [name]: value };
    setFormData(next);

    if (name === "buscar") {
      // 🟢 Filtrado en tiempo real
      onApply?.({
        ...next,
        tipo: current,
        triggeredBy: "buscar",
      });
    }
  };


  const handleApply = () => {
    onApply?.({
      ...formData,
      tipo: current,
      triggeredBy: "button",
    });
  };

  const handleReset = () => {
    const reset = {};
    setFormData(reset);
    onReset?.();
  };

  useEffect(() => setFormData({}), [resetSignal]);

  return (
    <div className="mb-6">
      {/* Pills */}
      {filters.length > 0 && (
        <div className="flex gap-3 mb-4">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
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

      {/* Contenedor */}
      <div className="bg-[#f7fbf8] border border-[#e2ede8] rounded-2xl p-6">
        <div className="grid gap-5 items-end grid-cols-1 lg:grid-cols-[minmax(16rem,1.4fr)_minmax(10rem,1fr)_minmax(10rem,1fr)_minmax(10rem,1fr)_auto]">
          
          {fields.map((field) => (
            <div
              key={field.name}
              className={`flex flex-col ${field.containerClass || ""}`}
            >
              <label className="text-sm text-[#154734] mb-1 font-semibold">
                {field.label}
              </label>

              {/* SELECT */}
              {field.type === "select" ? (
                <select
                  name={field.name}
                  value={formData[field.name] ?? ""}
                  onChange={handleInputChange}
                  className={`border border-[#d8e4df] rounded-md px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-[#154734] ${field.inputClass || ""}`}
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
                  onChange={handleInputChange}
                  placeholder={field.placeholder}
                  className={`border border-[#d8e4df] rounded-md px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-[#154734] ${field.inputClass || ""}`}
                />
              )}
            </div>
          ))}

          {/* Botones */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={handleApply}
              className="bg-[#154734] text-white px-6 py-2 rounded-md hover:bg-[#103a2b]"
            >
              {applyLabel}
            </button>

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
