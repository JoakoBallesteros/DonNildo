import React, { useState, useEffect } from "react";
import Modal from "./Modals";

export default function Modified({
  isOpen,
  onClose,
  title = "Modificar",
  data = {},
  itemsKey,
  items,
  columns = [],
  onSave,
  computeTotal,
  extraFooter,
  size = "max-w-5xl",
}) {
  const [list, setList] = useState([]);
  const [formData, setFormData] = useState({});

  const listMode = Boolean(itemsKey) || Array.isArray(items);

  // ✅ Cargar data cada vez que cambia y el modal esté abierto
  useEffect(() => {
    if (!isOpen || !data) return;

    const src = Array.isArray(items)
      ? items
      : listMode
      ? data?.[itemsKey] || []
      : [];

    // Clonamos los datos
    setList(src.map((r) => ({ ...r })));
    setFormData({ ...data });
  }, [isOpen, data, itemsKey, items, listMode]);

  if (!isOpen || !data) return null;

  const handleChange = (i, key, value) => {
    const updated = [...list];
    updated[i][key] = value;

    if (["cantidad", "precio"].includes(key)) {
      const cantidad = parseFloat(updated[i].cantidad) || 0;
      const precio = parseFloat(updated[i].precio) || 0;
      updated[i].subtotal = cantidad * precio;
    }

    setList(updated);
  };

  const handleSave = () => {
    const updated = { ...formData };
    if (listMode && itemsKey) updated[itemsKey] = list;
    if (typeof computeTotal === "function") {
      updated.total = computeTotal(list);
    }
    if (onSave) onSave(updated);
    onClose();
  };

  // Si aún no se cargó el array, mostrar “Cargando...”
  if (listMode && list.length === 0) {
    return (
      <Modal isOpen={isOpen} title={title} onClose={onClose} size={size}>
        <div className="text-center text-slate-500 py-8">Cargando datos...</div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      size={size}
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
            Guardar cambios
          </button>
        </div>
      }
    >
      {columns.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-[#e8f4ef] text-[#154734]">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-3 py-2 text-center font-semibold"
                    style={{ width: col.width }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map((row, i) => (
                <tr
                  key={i}
                  className="border-t border-slate-100 hover:bg-[#f6faf7]"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-2 text-center">
                      {col.readOnly ? (
                        <span>{row[col.key]}</span>
                      ) : (
                        <input
                          type={col.type || "text"}
                          value={row[col.key] ?? ""}
                          onChange={(e) =>
                            handleChange(
                              i,
                              col.key,
                              col.type === "number"
                                ? Number(e.target.value)
                                : e.target.value
                            )
                          }
                          className="border border-slate-200 rounded-md px-2 py-1 w-full text-center"
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-slate-500 text-center py-8">
          Sin columnas definidas.
        </div>
      )}

      {extraFooter ? (
        <div className="mt-4 border-t border-slate-200 pt-4">
          {extraFooter}
        </div>
      ) : null}
    </Modal>
  );
}
