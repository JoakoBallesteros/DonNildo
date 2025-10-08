import React, { useState } from "react";
import PageContainer from "../components/pages/PageContainer";
import DataTable from "../components/tables/DataTable";

// 🟩 Datos de ejemplo
const headers = [
  "N° Venta",
  "Tipo",
  "Fecha",
  "Total",
  "Detalle",
  "Observaciones",
  "Acciones",
];

const data = [
  {
    numero: 1,
    tipo: "Mixta",
    fecha: "08/10/2025",
    total: 3500,
    observaciones: "-",
    productos: [
      {
        tipo: "Caja",
        producto: "Cartón reciclado",
        cantidad: 10,
        medida: "kg",
        precio: 200,
        subtotal: 2000,
      },
      {
        tipo: "Material",
        producto: "Papel Kraft",
        cantidad: 5,
        medida: "kg",
        precio: 300,
        subtotal: 1500,
      },
    ],
  },
];

export default function Ventas() {
  const [ventas] = useState(data);
  const [activeFilter, setActiveFilter] = useState("todo");

  return (
    <PageContainer
      title="Lista de Ventas"
      actions={
        <button className="bg-[#154734] text-white px-4 py-2 rounded-md hover:bg-[#103a2b] transition">
          Añadir nueva venta
        </button>
      }
    >
      <div className="space-y-6">
        {/* 🟢 Botones de filtro */}
        <div className="flex gap-3">
          {[
            { key: "todo", label: "Todo" },
            { key: "materiales", label: "Materiales" },
            { key: "cajas", label: "Cajas" },
            { key: "mixtas", label: "Mixtas" },
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={() => setActiveFilter(btn.key)}
              className={`px-4 py-1.5 rounded-full font-medium transition ${
                activeFilter === btn.key
                  ? "bg-[#154734] text-white shadow-sm"
                  : "bg-[#e8f4ef] text-[#154734] hover:bg-[#dbeee6]"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* 🟢 Barra de filtros */}
        <div className="bg-[#f7fbf8] rounded-xl p-5 flex flex-wrap gap-4 items-end border border-[#e2ede8]">
          <div className="flex flex-col">
            <label className="text-sm text-[#154734] font-semibold mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Proveedor, orden..."
              className="border border-[#d8e4df] rounded-md px-3 py-2 w-64 focus:outline-none focus:ring-1 focus:ring-[#154734]"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-[#154734] font-semibold mb-1">Desde</label>
            <input
              type="text"
              placeholder="dd/mm/aaaa"
              className="border border-[#d8e4df] rounded-md px-3 py-2 w-40 focus:outline-none focus:ring-1 focus:ring-[#154734]"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-[#154734] font-semibold mb-1">Hasta</label>
            <input
              type="text"
              placeholder="dd/mm/aaaa"
              className="border border-[#d8e4df] rounded-md px-3 py-2 w-40 focus:outline-none focus:ring-1 focus:ring-[#154734]"
            />
          </div>

          <button className="bg-[#154734] text-white px-6 py-2 rounded-md hover:bg-[#103a2b] transition ml-auto">
            Aplicar Filtros
          </button>
        </div>

        {/* 🟢 Tabla */}
        <div className="mt-4">
          <DataTable headers={headers} data={ventas} />
        </div>
      </div>
    </PageContainer>
  );
}
