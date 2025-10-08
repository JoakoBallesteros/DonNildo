import React from "react";

export default function VentaDetalleModal({ isOpen, onClose, data }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-start pt-24 z-50">
      <div className="bg-white rounded-2xl shadow-lg w-[80%] max-w-4xl p-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
          <h3 className="text-xl font-bold text-[#154734]">
            Detalle de Venta Nº {data?.numero || ""}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-[#154734] font-semibold"
          >
            ✕
          </button>
        </div>

        {/* Detalles de la venta */}
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-[#e8f4ef] text-[#154734]">
            <tr>
              <th className="px-3 py-2">Tipo</th>
              <th className="px-3 py-2">Producto</th>
              <th className="px-3 py-2">Cantidad</th>
              <th className="px-3 py-2">Medida</th>
              <th className="px-3 py-2">Precio Unitario</th>
              <th className="px-3 py-2">SubTotal</th>
              <th className="px-3 py-2">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {data?.productos?.map((item, index) => (
              <tr
                key={index}
                className="border-t border-slate-100 hover:bg-[#f6faf7]"
              >
                <td className="px-3 py-2">{item.tipo}</td>
                <td className="px-3 py-2">{item.producto}</td>
                <td className="px-3 py-2">{item.cantidad}</td>
                <td className="px-3 py-2">{item.medida}</td>
                <td className="px-3 py-2">${item.precio}</td>
                <td className="px-3 py-2">${item.subtotal}</td>
                <td className="px-3 py-2">{data.fecha}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total */}
        <div className="flex justify-end mt-6 border-t border-slate-200 pt-4">
          <p className="text-lg font-semibold text-[#154734]">
            Total: ${data?.total || 0}
          </p>
        </div>
      </div>
    </div>
  );
}
