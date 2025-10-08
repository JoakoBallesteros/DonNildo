import React, { useState, useEffect } from "react";

export default function VentaEditarModal({ isOpen, onClose, data, onSave }) {
  const [ventaEditada, setVentaEditada] = useState(null);

  useEffect(() => {
    if (data) {
      setVentaEditada({
        ...data,
        productos: data.productos.map((p) => ({ ...p })),
      });
    }
  }, [data]);

  if (!isOpen || !ventaEditada) return null;

  const handleChange = (index, field, value) => {
    const nuevosProductos = [...ventaEditada.productos];
    nuevosProductos[index][field] = value;

    // recalcular subtotal
    if (field === "cantidad" || field === "precio") {
      const cantidad = parseFloat(nuevosProductos[index].cantidad) || 0;
      const precio = parseFloat(nuevosProductos[index].precio) || 0;
      nuevosProductos[index].subtotal = cantidad * precio;
    }

    // recalcular total
    const nuevoTotal = nuevosProductos.reduce(
      (acc, prod) => acc + (parseFloat(prod.subtotal) || 0),
      0
    );

    setVentaEditada({
      ...ventaEditada,
      productos: nuevosProductos,
      total: nuevoTotal,
    });
  };

  const handleSave = () => {
    onSave(ventaEditada);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-start pt-20 z-50">
      <div className="bg-white rounded-2xl shadow-lg w-[90%] max-w-5xl p-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
          <h3 className="text-xl font-bold text-[#154734]">
            Editar Venta Nº {ventaEditada.numero}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-[#154734] font-semibold"
          >
            ✕
          </button>
        </div>

        {/* Tabla editable */}
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-[#e8f4ef] text-[#154734]">
            <tr>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Producto</th>
              <th className="px-3 py-2">Cantidad</th>
              <th className="px-3 py-2">Medida</th>
              <th className="px-3 py-2">Precio Unitario</th>
              <th className="px-3 py-2">SubTotal</th>
            </tr>
          </thead>
          <tbody>
            {ventaEditada.productos.map((item, index) => (
              <tr
                key={index}
                className="border-t border-slate-100 hover:bg-[#f6faf7]"
              >
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={item.tipo}
                    onChange={(e) =>
                      handleChange(index, "tipo", e.target.value)
                    }
                    className="border border-slate-200 rounded-md px-2 py-1 w-full"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={item.producto}
                    onChange={(e) =>
                      handleChange(index, "producto", e.target.value)
                    }
                    className="border border-slate-200 rounded-md px-2 py-1 w-full"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={item.cantidad}
                    onChange={(e) =>
                      handleChange(index, "cantidad", e.target.value)
                    }
                    className="border border-slate-200 rounded-md px-2 py-1 w-20 text-center"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={item.medida}
                    onChange={(e) =>
                      handleChange(index, "medida", e.target.value)
                    }
                    className="border border-slate-200 rounded-md px-2 py-1 w-24 text-center"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    value={item.precio}
                    onChange={(e) =>
                      handleChange(index, "precio", e.target.value)
                    }
                    className="border border-slate-200 rounded-md px-2 py-1 w-28 text-center"
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  ${item.subtotal.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Fecha y total */}
        <div className="flex justify-between items-center mt-6 border-t border-slate-200 pt-4">
          <div>
            <label className="text-sm font-semibold text-[#154734] mr-2">
              Fecha:
            </label>
            <input
              type="text"
              value={ventaEditada.fecha}
              onChange={(e) =>
                setVentaEditada({ ...ventaEditada, fecha: e.target.value })
              }
              className="border border-slate-200 rounded-md px-3 py-1"
            />
          </div>

          <p className="text-lg font-semibold text-[#154734]">
            Total: ${ventaEditada.total.toFixed(2)}
          </p>
        </div>

        {/* Botón guardar */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            className="bg-[#154734] text-white px-6 py-2 rounded-md hover:bg-[#103a2b] transition"
          >
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
