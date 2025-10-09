import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import PageContainer from "../components/pages/PageContainer";
import DataTable from "../components/tables/DataTable";
import ActionButton from "../components/buttons/ActionButton";
import Modal from "../components/modals/Modals";

// MOCK
const DATA = [
  {
    numero: 1,
    tipo: "Mixta",
    fecha: "08/10/2025",
    total: 3500,
    observaciones: "—",
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
  const [ventas, _setVentas] = useState(DATA);
  const [filtro, setFiltro] = useState("todo");
  const [detail, setDetail] = useState(null);
  const [edit, setEdit] = useState(null);

  const columns = useMemo(
    () => [
      { id: "n", header: "N° Venta", accessor: "numero" },
      { id: "tipo", header: "Tipo", accessor: "tipo" },
      { id: "fecha", header: "Fecha", accessor: "fecha" },
      {
        id: "total",
        header: "Total",
        accessor: (r) => `$${r.total}`,
        align: "right",
      },
      {
        id: "detalle",
        header: "Detalle",
        render: (r) => (
          <button
            onClick={() => setDetail(r)}
            className="px-3 py-1 border border-[#154734] text-[#154734] rounded-md hover:bg-[#e8f4ef]"
          >
            Ver Detalle
          </button>
        ),
      },
      { id: "obs", header: "Observaciones", accessor: "observaciones" },
      {
        id: "acc",
        header: "Acciones",
        align: "center",
        width: 170,
        render: (r) => (
          <div className="flex justify-between items-center">
            <div className="flex flex-col gap-2">
              <ActionButton
                type="edit"
                text="MODIFICAR"
                className="w-[100px] py-1.5"
                onClick={() => setEdit(r)}
              />
              <ActionButton
                type="delete"
                text="ANULAR"
                className="w-[100px] py-1.5"
              />
            </div>
            <button
              type="button"
              aria-label="Descargar comprobante"
              className="grid place-items-center h-9 w-9 rounded-md border border-[#154734] text-[#154734] bg-white hover:bg-[#e8f4ef] focus:outline-none focus:ring-2 focus:ring-[#154734]/30"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <PageContainer
      title="Lista de Ventas"
      actions={
        <button className="bg-[#154734] text-white px-4 py-2 rounded-md hover:bg-[#103a2b]">
          Añadir nueva venta
        </button>
      }
    >
      {/* Pills */}
      <div className="flex gap-3 mb-6">
        {["todo", "materiales", "cajas", "mixtas"].map((k) => (
          <button
            key={k}
            onClick={() => setFiltro(k)}
            className={`px-4 py-1.5 rounded-full font-medium transition ${
              filtro === k
                ? "bg-[#154734] text-white shadow-sm"
                : "bg-[#e8f4ef] text-[#154734] hover:bg-[#dbeee6]"
            }`}
          >
            {k[0].toUpperCase() + k.slice(1)}
          </button>
        ))}
      </div>

      {/* Barra filtros (idéntica a la tuya) */}
      <div className="bg-[#f7fbf8] rounded-xl p-5 flex flex-wrap gap-4 items-end border border-[#e2ede8] mb-6">
        <div className="flex flex-col">
          <label className="text-sm text-[#154734] font-semibold mb-1">
            Buscar
          </label>
          <input
            placeholder="Proveedor, orden..."
            className="border border-[#d8e4df] rounded-md px-3 py-2 w-64 focus:outline-none focus:ring-1 focus:ring-[#154734]"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-[#154734] font-semibold mb-1">
            Desde
          </label>
          <input
            placeholder="dd/mm/aaaa"
            className="border border-[#d8e4df] rounded-md px-3 py-2 w-40 focus:outline-none focus:ring-1 focus:ring-[#154734]"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-[#154734] font-semibold mb-1">
            Hasta
          </label>
          <input
            placeholder="dd/mm/aaaa"
            className="border border-[#d8e4df] rounded-md px-3 py-2 w-40 focus:outline-none focus:ring-1 focus:ring-[#154734]"
          />
        </div>
        <button className="ml-auto bg-[#154734] text-white px-6 py-2 rounded-md hover:bg-[#103a2b]">
          Aplicar Filtros
        </button>
      </div>

      <DataTable columns={columns} data={ventas} stickyHeader />

      {/* Modal Detalle (usa Modal genérico) */}
      <Modal
        isOpen={!!detail}
        title={detail ? `Detalle Venta #${detail.numero}` : "Detalle"}
        onClose={() => setDetail(null)}
        size="max-w-5xl"
      >
        {detail && (
          <table className="w-full text-sm border-collapse">
            <thead className="bg-[#e8f4ef] text-[#154734]">
              <tr>
                {[
                  "Tipo",
                  "Producto",
                  "Cantidad",
                  "Medida",
                  "Precio Unit.",
                  "Subtotal",
                ].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detail.productos.map((p, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-3 py-2">{p.tipo}</td>
                  <td className="px-3 py-2">{p.producto}</td>
                  <td className="px-3 py-2">{p.cantidad}</td>
                  <td className="px-3 py-2">{p.medida}</td>
                  <td className="px-3 py-2">${p.precio}</td>
                  <td className="px-3 py-2">${p.subtotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>

      {/* Modal Editar (usa Modal genérico) */}
      <Modal
        isOpen={!!edit}
        title={edit ? `Editar Venta #${edit.numero}` : "Editar Venta"}
        onClose={() => setEdit(null)}
        footer={
          <div className="flex justify-end">
            <button
              onClick={() => {
                // ejemplo: guardar sin cambios
                setEdit(null);
              }}
              className="bg-[#154734] text-white px-6 py-2 rounded-md hover:bg-[#103a2b]"
            >
              Guardar Cambios
            </button>
          </div>
        }
      >
        {edit && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-[#154734] mb-1">
                Fecha
              </label>
              <input
                defaultValue={edit.fecha}
                className="border border-slate-200 rounded-md px-3 py-2"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-[#154734] mb-1">
                Observaciones
              </label>
              <input
                defaultValue={edit.observaciones}
                className="border border-slate-200 rounded-md px-3 py-2"
              />
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
