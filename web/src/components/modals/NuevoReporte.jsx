import React, { useState } from "react";
import Modal from "../modals/Modals";

const isISO = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

export default function NuevoReporte({ isOpen, onClose, onCreate }) {
  const [ambito, setAmbito] = useState("Compras"); // Compras | Ventas
  const [producto, setProducto] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    const p = producto.trim();
    if (!p) e.producto = "El producto es obligatorio.";
    else if (p.length < 2) e.producto = "Mínimo 2 caracteres.";
    else if (p.length > 60) e.producto = "Máximo 60 caracteres.";
    if (!isISO(desde)) e.desde = "Fecha desde inválida.";
    if (!isISO(hasta)) e.hasta = "Fecha hasta inválida.";
    if (isISO(desde) && isISO(hasta) && new Date(desde) > new Date(hasta)) {
      e.rango = "Desde no puede ser mayor que Hasta.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    onCreate?.({ ambito, producto: producto.trim(), desde, hasta });
    // reset y cerrar
    setProducto(""); setDesde(""); setHasta(""); setErrors({});
    onClose?.();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo reporte" size="max-w-2xl">
      <div className="space-y-5">
        {/* Ámbito */}
        <div className="flex gap-3">
          {["Compras", "Ventas"].map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setAmbito(k)}
              className={`px-4 py-2 rounded-full text-sm transition ${
                ambito === k ? "bg-[#154734] text-white" : "bg-[#e8f4ef] text-[#154734] hover:bg-[#dbeee6]"
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Campos */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-6">
            <label className="block text-sm text-[#154734] mb-1">Producto</label>
            <input
              className={`w-full rounded-xl px-4 py-2 text-sm bg-white border ${
                errors.producto ? "border-red-300" : "border-[#d8e4df]"
              }`}
              placeholder="Producto"
              value={producto}
              onChange={(e) => { setProducto(e.target.value); setErrors((x)=>({ ...x, producto: undefined })); }}
            />
            {errors.producto && <p className="text-xs text-red-600 mt-1">{errors.producto}</p>}
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm text-[#154734] mb-1">Fecha Desde</label>
            <input
              type="date"
              className={`w-full rounded-xl px-3 py-2 text-sm bg-white border ${
                (errors.desde || errors.rango) ? "border-red-300" : "border-[#d8e4df]"
              }`}
              value={desde}
              onChange={(e) => { setDesde(e.target.value); setErrors((x)=>({ ...x, desde: undefined, rango: undefined })); }}
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm text-[#154734] mb-1">Fecha Hasta</label>
            <input
              type="date"
              className={`w-full rounded-xl px-3 py-2 text-sm bg-white border ${
                (errors.hasta || errors.rango) ? "border-red-300" : "border-[#d8e4df]"
              }`}
              value={hasta}
              onChange={(e) => { setHasta(e.target.value); setErrors((x)=>({ ...x, hasta: undefined, rango: undefined })); }}
            />
          </div>

          {(errors.rango) && (
            <div className="md:col-span-12">
              <p className="text-sm text-red-600">{errors.rango}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#d8e4df] text-[#154734] bg-white"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            className="px-5 py-2 rounded-xl text-white bg-[#154734] hover:bg-[#103a2b]"
          >
            Generar
          </button>
        </div>
      </div>
    </Modal>
  );
}