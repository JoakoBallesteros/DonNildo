import React, { useState, useEffect } from "react";
import Modal from "./Modals";

/**
 * Modal genérico para edición de datos
 * Ejemplo de uso:
 * <Modified
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title="Editar producto"
 *   data={objeto}
 *   fields={[{key:"nombre",label:"Nombre"},{key:"precio",type:"number"}]}
 *   onSave={(data)=>console.log(data)}
 * />
 */
export default function Modified({
  isOpen,
  onClose,
  title = "Modificar",
  data = {},
  fields = [],
  onSave,
}) {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (data) setFormData(data);
  }, [data]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (onSave) onSave(formData);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      size="max-w-3xl"
      footer={
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-md border border-[#154734] text-[#154734] px-4 py-2 hover:bg-[#e8f4ef]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="bg-[#154734] text-white px-6 py-2 rounded-md hover:bg-[#103a2b]"
          >
            Guardar Cambios
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.key} className="flex flex-col">
            <label className="text-sm font-semibold text-[#154734] mb-1">
              {f.label || f.key}
            </label>

            {f.type === "textarea" ? (
              <textarea
                value={formData[f.key] || ""}
                onChange={(e) => handleChange(f.key, e.target.value)}
                className="border border-slate-200 rounded-md px-3 py-2 resize-none"
                rows={3}
              />
            ) : f.type === "select" ? (
              <select
                value={formData[f.key] || ""}
                onChange={(e) => handleChange(f.key, e.target.value)}
                className="border border-slate-200 rounded-md px-3 py-2"
              >
                {f.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={f.type || "text"}
                value={formData[f.key] || ""}
                onChange={(e) => handleChange(f.key, e.target.value)}
                className="border border-slate-200 rounded-md px-3 py-2"
              />
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
