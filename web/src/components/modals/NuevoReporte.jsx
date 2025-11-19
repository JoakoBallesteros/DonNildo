import React, { useState, useEffect } from "react";
import Modal from "./Modals"; 
import { listarProductosPorAmbito } from "../../services/reportesService.mjs";
import ProductoSelect from "../ui/ProductoSelect";

export default function NuevoReporte({ isOpen, onClose, onCreate }) {
  const [ambito, setAmbito] = useState("Compras");
  const [productoId, setProductoId] = useState("");
  const [productosList, setProductosList] = useState([]);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        const prod = await listarProductosPorAmbito(ambito);
        setProductosList(prod);
      } catch (e) {
        console.error("Error cargando productos:", e);
        setProductosList([]);
      }
    };

    fetchData();
  }, [ambito, isOpen]);

  const handleSubmit = async () => {
    if (!productoId) {
      alert("Selecciona un producto.");
      return;
    }
    if (!desde || !hasta) {
      alert("Selecciona un rango de fechas.");
      return;
    }

    try {
      // Esperar a que se complete la creación del reporte
      await onCreate({
        ambito,
        id_producto: productoId,
        desde,
        hasta,
      });
      // Solo cerrar el modal si la operación fue exitosa
      // (el handler cerrará el modal en caso de éxito)
    } catch (error) {
      console.error("Error :", error);
      // Si hay error, no cerrar el modal para que el usuario pueda corregir
      // El error ya se maneja en crearReporteHandler
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo reporte"
      size="max-w-3xl"
      footer={
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#d8e4df] text-[#154734] bg-white"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 rounded-xl text-white bg-[#154734] hover:bg-[#103a2b]"
          >
            Generar
          </button>
        </div>
      }
    >
      <div className="space-y-6">

        {/* Ámbito */}
        <div className="flex gap-3">
          {["Compras", "Ventas"].map((tipo) => (
            <button
              key={tipo}
              onClick={() => setAmbito(tipo)}
              className={`px-4 py-2 rounded-full text-sm transition ${
                ambito === tipo
                  ? "bg-[#154734] text-white"
                  : "bg-[#e8f4ef] text-[#154734]"
              }`}
            >
              {tipo}
            </button>
          ))}
        </div>

        {/* FORM */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

          {/* Producto */}
          <div className="md:col-span-6">
            <label className="block text-sm text-[#154734] mb-1">Producto</label>
            <ProductoSelect
              productos={productosList}
              value={productoId ? productosList.find(p => p.id_producto === Number(productoId)) : null}
              onChange={(p) => setProductoId(p?.id_producto || null)}
            />
          </div>

          {/* Fecha Desde */}
          <div className="md:col-span-3">
            <label className="block text-sm text-[#154734] mb-1">Fecha Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm bg-white border border-[#d8e4df]"
            />
          </div>

          {/* Fecha Hasta */}
          <div className="md:col-span-3">
            <label className="block text-sm text-[#154734] mb-1">Fecha Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full rounded-xl px-3 py-2 text-sm bg-white border border-[#d8e4df]"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
