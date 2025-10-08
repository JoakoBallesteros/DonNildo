import { useState } from "react";
import { Download } from "lucide-react";
import ActionButton from "../buttons/ActionButton";
import VentaDetalleModal from "../modals/details";
import VentaEditarModal from "../modals/modified";

export default function DataTable({ headers, data }) {
  const [ventas, setVentas] = useState(data);
  const [selectedVenta, setSelectedVenta] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleOpenModal = (venta) => {
    setSelectedVenta(venta);
    setIsDetailOpen(true);
  };

  const handleEditModal = (venta) => {
    setSelectedVenta(venta);
    setIsEditOpen(true);
  };

  const handleCloseModals = () => {
    setIsDetailOpen(false);
    setIsEditOpen(false);
    setSelectedVenta(null);
  };

  const handleSaveChanges = (ventaEditada) => {
    const nuevasVentas = ventas.map((v) =>
      v.numero === ventaEditada.numero ? ventaEditada : v
    );
    setVentas(nuevasVentas);
  };

  return (
    <div className="overflow-x-auto bg-white rounded-xl relative">
      <table className="w-full text-sm text-left text-gray-700 border-collapse">
        <thead className="bg-[#e8f4ef] text-[#154734]">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className={`px-4 py-3 font-semibold border-r border-[#e3e9e5] last:border-none ${
                  i === headers.length - 1 ? "text-center w-[170px]" : ""
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {ventas.map((venta, i) => (
            <tr key={i} className="hover:bg-[#f6faf7] transition">
              <td className="px-4 py-3 border-r border-[#edf2ef]">{venta.numero}</td>
              <td className="px-4 py-3 border-r border-[#edf2ef]">{venta.tipo}</td>
              <td className="px-4 py-3 border-r border-[#edf2ef]">{venta.fecha}</td>
              <td className="px-4 py-3 border-r border-[#edf2ef]">${venta.total}</td>

              <td className="px-4 py-3 border-r border-[#edf2ef]">
                <button
                  onClick={() => handleOpenModal(venta)}
                  className="px-3 py-1 border border-[#154734] text-[#154734] rounded-md hover:bg-[#e8f4ef] transition"
                >
                  Ver Detalle
                </button>
              </td>

              <td className="px-4 py-3 border-r border-[#edf2ef]">
                {venta.observaciones}
              </td>

              <td className="px-4 py-3 w-[170px] border-r border-[#edf2ef] last:border-none">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-2">
                    <ActionButton
                      type="edit"
                      text="MODIFICAR"
                      className="w-[100px] py-1.5"
                      onClick={() => handleEditModal(venta)}
                    />
                    <ActionButton
                      type="delete"
                      text="ANULAR"
                      className="w-[100px] py-1.5"
                    />
                  </div>

                  <button
                    title="Descargar"
                    className="border border-[#154734] text-[#154734] rounded-md hover:bg-[#e8f4ef] transition p-1 flex items-center justify-center w-[34px] h-[34px]"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modales */}
      <VentaDetalleModal
        isOpen={isDetailOpen}
        onClose={handleCloseModals}
        data={selectedVenta}
      />

      <VentaEditarModal
        isOpen={isEditOpen}
        onClose={handleCloseModals}
        data={selectedVenta}
        onSave={handleSaveChanges}
      />
    </div>
  );
}
