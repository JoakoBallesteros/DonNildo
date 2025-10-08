import { useState } from "react";
import { Plus, Search, Filter } from "lucide-react";

// Datos de ejemplo
const compras = [
  { id: "C001", proveedor: "Reciclados Norte S.A.", material: "Papel",  cantidad: "500 kg", precio: "$2,500", fecha: "2024-10-05", estado: "Pendiente" },
  { id: "C002", proveedor: "Plásticos del Sur",     material: "PET",    cantidad: "200 kg", precio: "$1,800", fecha: "2024-10-03", estado: "Completada" },
  { id: "C003", proveedor: "Vidrios Industriales",  material: "Vidrio", cantidad: "300 kg", precio: "$900",   fecha: "2024-10-01", estado: "En Proceso" },
];

function Badge({ status }) {
  const base =
    "inline-flex items-center px-2 py-0.5 text-xs font-medium rounded";
  const colors =
    status === "Completada"
      ? "bg-green-100 text-green-800"
      : status === "Pendiente"
      ? "bg-yellow-100 text-yellow-800"
      : status === "En Proceso"
      ? "bg-blue-100 text-blue-800"
      : "bg-gray-100 text-gray-800";
  return <span className={`${base} ${colors}`}>{status}</span>;
}

export default function Compras() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCompras = compras.filter((c) => {
    const q = searchTerm.toLowerCase();
    return (
      c.proveedor.toLowerCase().includes(q) ||
      c.material.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header y controles */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder="Buscar compras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </button>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nueva Compra
        </button>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm text-center">
          <p className="text-2xl">12</p>
          <p className="text-sm text-gray-500">Compras Pendientes</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm text-center">
          <p className="text-2xl">$8,750</p>
          <p className="text-sm text-gray-500">Total del Mes</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm text-center">
          <p className="text-2xl">25</p>
          <p className="text-sm text-gray-500">Proveedores Activos</p>
        </div>
      </div>

      {/* Tabla de compras */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="p-6">
          <h3 className="mb-4 font-semibold text-lg">Órdenes de Compra</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-600">ID</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Proveedor</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Material</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Cantidad</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Precio</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Fecha</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Estado</th>
                  <th className="px-4 py-3 font-medium text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredCompras.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/60">
                    <td className="px-4 py-3">{c.id}</td>
                    <td className="px-4 py-3 max-w-[240px] truncate">{c.proveedor}</td>
                    <td className="px-4 py-3">{c.material}</td>
                    <td className="px-4 py-3">{c.cantidad}</td>
                    <td className="px-4 py-3">{c.precio}</td>
                    <td className="px-4 py-3">{new Date(c.fecha).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Badge status={c.estado} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="rounded-md border px-3 py-1.5 text-xs hover:bg-gray-50">
                          Ver
                        </button>
                        <button className="rounded-md border px-3 py-1.5 text-xs hover:bg-gray-50">
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCompras.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No se encontraron compras para “{searchTerm}”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
