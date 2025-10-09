import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download } from "lucide-react";
import PageContainer from "../components/pages/PageContainer";
import DataTable from "../components/tables/DataTable";
import ActionButton from "../components/buttons/ActionButton";
import Modal from "../components/modals/Modals";
import { useNavigate } from "react-router-dom";

// MOCK
const STOCK = [
  {
    id: "mat-001",
    tipo: "Material",
    referencia: "Cartón",
    categoria: "—",
    medida: "—",
    disponible: 200, // kg o unidades
    unidad: "kg",
    ultimoMov: "2025-10-08",
    precio: 7000,
  },
];

export default function Stock() {
  const [items, setItems] = useState(STOCK);
  const [tab, setTab] = useState("todo");
  const [filters, setFilters] = useState({
    q: "",
    categoria: "",
    medida: "",
    desde: "",
    hasta: "",
  });

  const nav = useNavigate();
  // Modal de edición (global o por fila)
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);

  const openEditGlobal = () => {
    setEditRow(items[0] ?? null); // o null y eliges con un select dentro
    setEditOpen(true);
  };
  const openEditRow = (row) => {
    setEditRow(row);
    setEditOpen(true);
  };
  const closeEdit = () => {
    setEditOpen(false);
    setEditRow(null);
  };

  const handleSave = () => {
    // demo: persiste cambios mínimos; conectá con tu API
    if (!editRow) return closeEdit();
    setItems((prev) =>
      prev.map((r) => (r.id === editRow.id ? { ...r, ...editRow } : r))
    );
    closeEdit();
  };

  const handleChangeReferencia = (id) => {
    const base = items.find((x) => x.id === id);
    if (!base) return;
    // Si querés que solo se actualice referencia y tipo, podés limitar el spread
    setEditRow((prev) => ({
      ...prev,
      id: base.id,
      referencia: base.referencia,
      tipo: base.tipo, // <- se calcula solo
      // opcional: sincronizar otros campos del seleccionado
      medida: base.medida,
      unidad: base.unidad,
    }));
  };

  const columns = useMemo(
    () => [
      { id: "tipo", header: "Tipo", accessor: "tipo" },
      { id: "referencia", header: "Referencia", accessor: "referencia" },
      { id: "categoria", header: "Categoría", accessor: "categoria" },
      { id: "medida", header: "Medida", accessor: "medida" },
      {
        id: "disp",
        header: "Disponible (u/kg)",
        accessor: (r) => `${r.disponible} ${r.unidad}`,
        align: "right",
      },
      { id: "ult", header: "Últ. mov.", accessor: "ultimoMov" },
      {
        id: "precio",
        header: "Precio unitario",
        accessor: (r) =>
          r.precio?.toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0,
          }) ?? "—",
        align: "right",
      },
      {
        id: "acc",
        header: "Acciones",
        align: "right",
        width: 120,
        render: (r) => (
          <div className="flex justify-end">
            <ActionButton
              type="edit"
              text="Modificar"
              className="px-3 py-1.5"
              onClick={() => openEditRow(r)}
            />
          </div>
        ),
      },
    ],
    []
  );

  const onExport = () => {
    // Conectá con tu export (CSV/XLSX/PDF)
    console.log("Exportar stock filtrado…", { tab, filters, items });
  };

  return (
    <PageContainer
      title="Stock"
      actions={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => nav("nuevo-producto")}
            className="rounded-md border border-[#154734] text-[#154734] px-4 py-2 hover:bg-[#e8f4ef]"
          >
            + Nuevo producto
          </button>
          <button type="button" onClick={() => nav("pesaje")} className="rounded-md border border-[#154734] text-[#154734] px-4 py-2 hover:bg-[#e8f4ef]">
            Registrar Pesaje
          </button>
        
          <button
            onClick={openEditGlobal}
            className="bg-[#154734] text-white px-4 py-2 rounded-md hover:bg-[#103a2b]"
          >
            Modificar Stock
          </button>
        </div>
      }
    >
      {/* Pills */}
      <div className="flex gap-3 mb-6">
        {["todo", "cajas", "productos"].map((k) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-1.5 rounded-full font-medium transition ${
              tab === k
                ? "bg-[#154734] text-white shadow-sm"
                : "bg-[#e8f4ef] text-[#154734] hover:bg-[#dbeee6]"
            }`}
          >
            {k[0].toUpperCase() + k.slice(1)}
          </button>
        ))}
      </div>

      {/* Barra de filtros */}
      <div className="bg-[#f7fbf8] rounded-xl p-5 flex flex-wrap gap-4 items-end border border-[#e2ede8] mb-6">
        <div className="flex flex-col">
          <label className="text-sm text-[#154734] font-semibold mb-1">
            Referencia / material
          </label>
          <input
            value={filters.q}
            onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            placeholder="Referencia / material"
            className="border border-[#d8e4df] rounded-md px-3 py-2 w-72 focus:outline-none focus:ring-1 focus:ring-[#154734]"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-[#154734] font-semibold mb-1">
            Categoría
          </label>
          <select
            value={filters.categoria}
            onChange={(e) =>
              setFilters((f) => ({ ...f, categoria: e.target.value }))
            }
            className="border border-[#d8e4df] rounded-md px-3 py-2 w-56 focus:outline-none focus:ring-1 focus:ring-[#154734]"
          >
            <option value="">Todas</option>
            <option value="—">—</option>
            <option value="A">A</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-[#154734] font-semibold mb-1">
            Medida
          </label>
          <select
            value={filters.medida}
            onChange={(e) =>
              setFilters((f) => ({ ...f, medida: e.target.value }))
            }
            className="border border-[#d8e4df] rounded-md px-3 py-2 w-56 focus:outline-none focus:ring-1 focus:ring-[#154734]"
          >
            <option value="">Todas</option>
            <option value="kg">kg</option>
            <option value="u">u</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-[#154734] font-semibold mb-1">
            Fecha desde
          </label>
          <input
            type="date"
            value={filters.desde}
            onChange={(e) =>
              setFilters((f) => ({ ...f, desde: e.target.value }))
            }
            className="border border-[#d8e4df] rounded-md px-3 py-2 w-56 focus:outline-none focus:ring-1 focus:ring-[#154734]"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm text-[#154734] font-semibold mb-1">
            Fecha hasta
          </label>
          <input
            type="date"
            value={filters.hasta}
            onChange={(e) =>
              setFilters((f) => ({ ...f, hasta: e.target.value }))
            }
            className="border border-[#d8e4df] rounded-md px-3 py-2 w-56 focus:outline-none focus:ring-1 focus:ring-[#154734]"
          />
        </div>

        <div className="ml-auto flex items-center gap-4">
          <button className="bg-[#154734] text-white px-6 py-2 rounded-md hover:bg-[#103a2b]">
            Aplicar Filtros
          </button>
          <button
            className="text-[#154734] underline underline-offset-2"
            onClick={() =>
              setFilters({
                q: "",
                categoria: "",
                medida: "",
                desde: "",
                hasta: "",
              })
            }
          >
            Reiniciar filtro
          </button>
        </div>
      </div>

      {/* Tabla */}
      <DataTable columns={columns} data={items} stickyHeader />

      {/* Export */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={onExport}
          className="inline-flex items-center gap-2 rounded-md bg-[#0f7a4e] text-white px-4 py-2 hover:bg-[#0d6843]"
        >
          <Download className="h-4 w-4" />
          Exportar (Excel/PDF)
        </button>
      </div>

      {/* Modal Editar */}
      <Modal
        isOpen={editOpen}
        title={editRow ? `Modificar: ${editRow.referencia}` : "Modificar Stock"}
        onClose={closeEdit}
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={closeEdit}
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
        size="max-w-3xl"
      >
        {editRow ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Referencia">
              <select
                value={editRow.id}
                onChange={(e) => handleChangeReferencia(e.target.value)}
                className="border border-slate-200 rounded-md px-3 py-2 w-full"
              >
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.referencia}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Tipo">
              <input
                value={editRow.tipo}
                readOnly
                className="border border-slate-200 rounded-md px-3 py-2 w-full bg-slate-50 text-slate-700"
              />
            </Field>
            <Field label="Disponible">
              <input
                type="number"
                value={editRow.disponible}
                onChange={(e) =>
                  setEditRow((r) => ({
                    ...r,
                    disponible: Number(e.target.value),
                  }))
                }
                className="border border-slate-200 rounded-md px-3 py-2 w-full"
              />
            </Field>
            <Field label="Unidad">
              <select
                value={editRow.unidad}
                onChange={(e) =>
                  setEditRow((r) => ({ ...r, unidad: e.target.value }))
                }
                className="border border-slate-200 rounded-md px-3 py-2 w-full"
              >
                <option value="kg">kg</option>
                <option value="u">u</option>
              </select>
            </Field>
            <Field label="Precio unitario">
              <input
                type="number"
                value={editRow.precio}
                onChange={(e) =>
                  setEditRow((r) => ({ ...r, precio: Number(e.target.value) }))
                }
                className="border border-slate-200 rounded-md px-3 py-2 w-full"
              />
            </Field>
            <Field label="Último movimiento">
              <input
                type="date"
                value={editRow.ultimoMov}
                onChange={(e) =>
                  setEditRow((r) => ({ ...r, ultimoMov: e.target.value }))
                }
                className="border border-slate-200 rounded-md px-3 py-2 w-full"
              />
            </Field>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            Elegí un producto de la tabla para modificar, o usa este modal para
            ajustar el stock general.
          </p>
        )}
      </Modal>
    </PageContainer>
  );
}

/** Helpers UI internos para mantener el mismo look */
function Field({ label, children }) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-semibold text-[#154734] mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
