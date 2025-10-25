// src/pages/Compras.jsx
import { useMemo, useState } from "react";
import { Plus, Filter, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

/* Layout */
import PageContainer from "../components/pages/PageContainer.jsx";

/* Componentes reutilizables */
import PrimaryButton from "../components/buttons/PrimaryButton.jsx";

/* Barra de filtros */
import FilterBar from "../components/forms/FilterBars.jsx";

/* Tabla genérica */
import DataTable from "../components/tables/DataTable.jsx";

/* Modales reutilizables */
import Details from "../components/modals/Details.jsx";
import Modified from "../components/modals/Modified.jsx";

/* ===== Datos mock ===== */
const INITIAL = [
  {
    id: "OC-0003",
    proveedor: "Vidrios Industriales",
    tipo: "Mixtas",
    total: 900,
    fecha: "2024-09-30",
    obs: "—",
    items: [
      { producto: "PRITTY20X20", medida: "20x20", cantidad: 1, precio: 900, descuento: 0, subtotal: 900 },
    ],
  },
  {
    id: "OC-0002",
    proveedor: "Plásticos del Sur",
    tipo: "Cajas",
    total: 1800,
    fecha: "2024-10-02",
    obs: "—",
    items: [
      { producto: "Caja 40x30", medida: "40x30", cantidad: 1, precio: 1800, descuento: 0, subtotal: 1800 },
    ],
  },
  {
    id: "OC-0001",
    proveedor: "Reciclados Norte S.A.",
    tipo: "Materiales",
    total: 2500,
    fecha: "2024-10-04",
    obs: "—",
    items: [
      { producto: "Papel blanco", medida: "kg", cantidad: 5, precio: 500, descuento: 0, subtotal: 2500 },
    ],
  },
];

const TABS = ["Todo", "Materiales", "Cajas", "Mixtas"];
const fmtARS = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export default function Compras() {
  const navigate = useNavigate();

  /* Filtros */
  const [tab, setTab] = useState("Todo");
  const [q, setQ] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [resetSignal, setResetSignal] = useState(0);

  /* Filas */
  const [rows, setRows] = useState(INITIAL);

  /* Modales */
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRow, setDetailRow] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);

  /* Filtrado */
  const filtered = useMemo(() => {
    return rows
      .filter((r) => (tab === "Todo" ? true : r.tipo === tab))
      .filter((r) =>
        q
          ? r.id.toLowerCase().includes(q.toLowerCase()) ||
            r.proveedor.toLowerCase().includes(q.toLowerCase())
          : true
      )
      .filter((r) => {
        const d = new Date(r.fecha);
        const okFrom = desde ? d >= new Date(desde) : true;
        const okTo = hasta ? d <= new Date(hasta) : true;
        return okFrom && okTo;
      });
  }, [rows, tab, q, desde, hasta]);

  /* Handlers filtros */
  function onApplyFilters(form) {
    setQ(form.buscar ?? "");
    setDesde(form.fechaDesde ?? "");
    setHasta(form.fechaHasta ?? "");
  }
  function onResetFilters() {
    setQ("");
    setDesde("");
    setHasta("");
    setTab("Todo");
    setResetSignal((x) => x + 1);
  }

  /* Acciones por fila */
  function onViewDetail(row) {
    setEditOpen(false);
    setEditRow(null);
    setDetailRow(row);
    setDetailOpen(true);
  }

  function onEdit(row) {
    setDetailOpen(false);          // 🔴 importante: cierra detalle si estaba abierto
    setDetailRow(null);
    setEditRow(row);
    setEditOpen(true);
  }

  function onAnular(id) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function onDownload(row) {
    console.log("Descargar compra:", row.id);
  }

  /* Columnas DataTable (acciones como Ventas: dos botones en columna + descarga al costado) */
  const columns = [
    { id: "id", header: "Orden", accessor: (r) => r.id, align: "center", nowrap: true, width: "120px", sortable: true },
    { id: "proveedor", header: "Proveedor", accessor: (r) => r.proveedor, align: "center", sortable: true },
    { id: "tipo", header: "Tipo", accessor: (r) => r.tipo, align: "center", width: "110px", sortable: true },
    {
      id: "fecha",
      header: "Fecha",
      accessor: (r) => r.fecha,
      render: (r) => new Date(r.fecha).toLocaleDateString(),
      align: "center",
      width: "120px",
      sortable: true,
      sortAccessor: (r) => r.fecha,
    },
    {
      id: "total",
      header: "Total ($)",
      render: (r) => fmtARS.format(r.total),
      accessor: (r) => r.total,
      align: "center",
      width: "140px",
      sortable: true,
      sortAccessor: (r) => Number(r.total || 0),
    },
    {
      id: "detalle",
      header: "Detalle",
      align: "center",
      render: (row) => (
        <button
          onClick={() => onViewDetail(row)}
          className="border border-[#d8e4df] rounded-md px-4 py-1.5 text-[#154734] hover:bg-[#e8f4ef] transition"
        >
          Ver Detalle
        </button>
      ),
      width: "140px",
    },
    { id: "obs", header: "Observaciones", accessor: (r) => r.obs, align: "center" },
    {
      id: "acciones",
      header: "Acciones",
      align: "center",
      render: (row) => (
        <div className="flex justify-center items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => onEdit(row)}
              className="bg-[#154734] text-white px-3 py-1 text-xs rounded-md hover:bg-[#1E5A3E]"
            >
              MODIFICAR
            </button>
            <button
              onClick={() => onAnular(row.id)}
              className="bg-[#A30000] text-white px-5 py-1 text-xs rounded-md hover:bg-[#7A0000]"
            >
              ANULAR
            </button>
          </div>
          <button
            onClick={() => onDownload(row)}
            className="p-1 border border-[#d8e4df] rounded-md hover:bg-[#f7faf9] flex items-center justify-center"
            title="Descargar comprobante"
          >
            <Download className="w-4 h-4 text-[#154734]" />
          </button>
        </div>
      ),
      width: "170px",
    },
  ];

  /* Columnas para Modified (API real) */
  const editColumns = [
    { key: "producto",  label: "Producto / Material", width: "220px", type: "text"   },
    { key: "medida",    label: "Medida/Estado",       width: "140px", type: "text"   },
    { key: "cantidad",  label: "Cantidad",            width: "120px", type: "number" },
    { key: "precio",    label: "Precio Unitario",     width: "140px", type: "number" },
    { key: "descuento", label: "Desc. %",             width: "110px", type: "number" },
    { key: "subtotal",  label: "Subtotal",            width: "140px", readOnly: true },
  ];

  /* computeTotal para Modified */
  const computeTotal = (list) =>
    list.reduce((sum, it) => sum + Number(it.subtotal || 0), 0).toFixed(2);

  /* onSave de Modified */
  function onSaveEdit(updated) {
    setRows((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
    setEditOpen(false);
  }

  /* Render */
  return (
    <PageContainer
      title="Lista de Compras"
      actions={
        <PrimaryButton
          onClick={() => navigate("/compras/nueva")}
          text={
            <span className="inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Añadir nueva compra
            </span>
          }
        />
      }
    >
      {/* Filtros */}
      <FilterBar
        filters={TABS}
        selectedFilter={tab}
        onFilterSelect={setTab}
        resetSignal={resetSignal}
        onApply={onApplyFilters}
        onReset={onResetFilters}
        applyLabel={
          <span className="inline-flex items-center gap-2">
            <Filter className="h-4 w-4" /> Aplicar Filtros
          </span>
        }
        fields={[
          { name: "buscar", label: "Buscar", type: "text", placeholder: "Proveedor u orden…" },
          { name: "fechaDesde", label: "Fecha desde", type: "date" },
          { name: "fechaHasta", label: "Fecha hasta", type: "date" },
        ]}
      />

      {/* Tabla */}
      <div className="mt-6">
        <DataTable
          columns={columns}
          data={filtered}
          zebra={false}
          stickyHeader={false}
          tableClass="w-full text-sm text-center border-collapse"
          theadClass="bg-[#e8f4ef] text-[#154734]"
          rowClass="hover:bg-[#f6faf7] border-t border-[#edf2ef]"
          headerClass="px-4 py-3 font-semibold text-center"
          cellClass="px-4 py-4 text-center"
          enableSort
        />
      </div>

      {/* Detalle */}
      <Details
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={detailRow ? `Detalle de Compra ${detailRow.id} N°` : "Detalle de Compra"}
        data={detailRow}
        itemsKey="items"
        columns={[
          { key: "producto",  label: "Producto / Material" },
          { key: "medida",    label: "Medida/Estado" },
          { key: "cantidad",  label: "Cantidad" },
          { key: "precio",    label: "Precio Unitario" },
          { key: "descuento", label: "Desc. %" },
          { key: "subtotal",  label: "Subtotal" },
        ]}
      />

      {/* Modificar: SOLO este modal abierto */}
      {editOpen && editRow && (
        <Modified
          isOpen={editOpen}
          onClose={() => setEditOpen(false)}
          title={`Modificar productos de Compra ${editRow.id}`}
          data={editRow}             // objeto compra
          itemsKey="items"           // arreglo dentro de data
          columns={editColumns}      // columnas con {key,label,type}
          computeTotal={computeTotal}
          extraFooter={
            <div className="flex justify-between items-center">
              <div>
                <label className="text-sm font-semibold text-[#154734] mr-2">Fecha:</label>
                <input
                  type="text"
                  value={editRow.fecha || ""}
                  className="border border-slate-200 rounded-md px-3 py-1"
                  readOnly
                />
              </div>
              <p className="text-lg font-semibold text-[#154734]">
                Total: {fmtARS.format(Number(editRow.total || 0))}
              </p>
            </div>
          }
          onSave={onSaveEdit}
          size="max-w-5xl"
        />
      )}
    </PageContainer>
  );
}
