// src/pages/Compras.jsx
import { useMemo, useState } from "react";
import { Plus, Filter, ChevronDown, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

/* Componentes reutilizables */
import ActionButton from "../components/buttons/ActionButton.jsx";
import IconButton from "../components/buttons/IconButton.jsx";
import PrimaryButton from "../components/buttons/PrimaryButton.jsx";

/* Barra de filtros */
import FilterBar from "../components/forms/FilterBars.jsx";

/* =========================
   Modal simple local
   ========================= */
function Modal({ isOpen, title, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="absolute left-1/2 top-1/2 w-[min(760px,95vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl border border-emerald-100">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h3 className="text-lg font-semibold text-emerald-900">{title}</h3>
          <button onClick={onClose} className="rounded px-2 py-1 text-sm hover:bg-gray-100">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* =========================
   Datos mock con ÍTEMS
   ========================= */
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

  /* ---------- Estado de filtros ---------- */
  const [tab, setTab] = useState("Todo");
  const [q, setQ] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [resetSignal, setResetSignal] = useState(0);

  /* ---------- Orden tabla ---------- */
  const [sortAsc, setSortAsc] = useState(true);

  /* ---------- Filas ---------- */
  const [rows, setRows] = useState(INITIAL);

  /* ---------- Modal “Agregar ítem / Modificar” ---------- */
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [fProducto, setFProducto] = useState("");
  const [fMedida, setFMedida] = useState("");
  const [fCant, setFCant] = useState("");
  const [fPrecio, setFPrecio] = useState("");

  const subtotalPopup = useMemo(() => {
    const c = Number(String(fCant).replace(",", "."));
    const p = Number(String(fPrecio).replace(",", "."));
    if (!c || !p) return 0;
    return c * p;
  }, [fCant, fPrecio]);

  const filtered = useMemo(() => {
    const items = rows
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
      })
      .sort((a, b) => {
        const da = new Date(a.fecha).getTime();
        const db = new Date(b.fecha).getTime();
        return sortAsc ? da - db : db - da;
      });
    return items;
  }, [rows, tab, q, desde, hasta, sortAsc]);

  /* ---------- Handlers filtros ---------- */
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

  /* ---------- Handlers modal ---------- */
  function onEdit(row) {
    const it = row.items?.[0] || {
      producto: row.producto || "",
      medida: row.medida || "",
      cantidad: 1,
      precio: row.total || 0,
    };

    setEditRow(row);
    setFProducto(it.producto ?? "");
    setFMedida(it.medida ?? "");
    setFCant(String(it.cantidad ?? ""));
    setFPrecio(String(it.precio ?? ""));
    setEditOpen(true);
  }

  function onSaveEdit() {
    if (!editRow) return;

    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== editRow.id) return r;

        const items = Array.isArray(r.items) && r.items.length ? [...r.items] : [{}];
        items[0] = {
          ...items[0],
          producto: fProducto,
          medida: fMedida,
          cantidad: Number(String(fCant).replace(",", ".")) || 0,
          precio: Number(String(fPrecio).replace(",", ".")) || 0,
          descuento: items[0].descuento || 0,
          subtotal: subtotalPopup || 0,
        };

        const nuevoTotal = items.reduce((acc, it) => acc + (Number(it.subtotal) || 0), 0);
        return { ...r, items, total: nuevoTotal };
      })
    );

    setEditOpen(false);
  }

  function onAnular(id) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  /* ---------- Render ---------- */
  return (
    <div className="p-6 md:p-8">
      <div className="rounded-2xl bg-white border border-emerald-100 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 pt-6">
          <h2 className="text-2xl md:text-[26px] font-bold text-emerald-900">Lista de Compras</h2>

          <PrimaryButton
            onClick={() => navigate("nueva")}
            text={
              <span className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4" /> Añadir nueva compra
              </span>
            }
          />
        </div>

        {/* FilterBar */}
        <div className="px-6 mt-5">
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
        </div>

        {/* Tabla */}
        <div className="px-6 pb-6">
          <div className="overflow-x-auto rounded-xl border border-emerald-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-emerald-50/60 text-emerald-900">
                  <th className="px-4 py-3 text-left font-medium">Orden</th>
                  <th className="px-4 py-3 text-left font-medium">Proveedor</th>
                  <th className="px-4 py-3 text-left font-medium">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium">Total</th>
                  <th className="px-4 py-3 text-left font-medium">
                    <button
                      className="inline-flex items-center gap-1 hover:opacity-80"
                      onClick={() => setSortAsc((s) => !s)}
                    >
                      Fecha <ChevronDown className={`h-4 w-4 transition ${sortAsc ? "rotate-180" : ""}`} />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left font-medium">Detalle</th>
                  <th className="px-4 py-3 text-left font-medium">Observaciones</th>
                  <th className="px-4 py-3 text-left font-medium">
                    <div className="flex items-center justify-between">
                      <span>Acciones</span>
                      <button className="p-1 rounded hover:bg-emerald-100" title="Descargar">
                        <Download className="h-4 w-4 text-emerald-700" />
                      </button>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-emerald-50/40">
                    <td className="px-4 py-3">{r.id}</td>
                    <td className="px-4 py-3 max-w-[260px] truncate">{r.proveedor}</td>
                    <td className="px-4 py-3">{r.tipo}</td>
                    <td className="px-4 py-3">{fmtARS.format(r.total)}</td>
                    <td className="px-4 py-3">{new Date(r.fecha).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <IconButton title="Ver detalle" variant="outline">
                        <span className="text-xs">Ver Detalle</span>
                      </IconButton>
                    </td>
                    <td className="px-4 py-3">{r.obs}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <ActionButton type="edit" text="MODIFICAR" onClick={() => onEdit(r)} />
                        <ActionButton type="delete" text="ANULAR" onClick={() => onAnular(r.id)} />
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                      No hay resultados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="h-6" />
        </div>
      </div>

      {/* Modal “Agregar ítem” con layout de tu diseño */}
      <Modal isOpen={editOpen} title="Agregar ítem" onClose={() => setEditOpen(false)}>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Orden: <span className="font-medium">{editRow?.id}</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            {/* Producto */}
            <div className="md:col-span-2">
              <label className="block text-[13px] text-emerald-900 mb-1">Producto / Material</label>
              <input
                value={fProducto}
                onChange={(e) => setFProducto(e.target.value)}
                placeholder="PRITTY20X20"
                className="h-9 w-full rounded-md border border-emerald-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Medida */}
            <div>
              <label className="block text-[13px] text-emerald-900 mb-1">Medida/Estado</label>
              <input
                value={fMedida}
                onChange={(e) => setFMedida(e.target.value)}
                placeholder="20x20"
                className="h-9 w-full rounded-md border border-emerald-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Cantidad */}
            <div>
              <label className="block text-[13px] text-emerald-900 mb-1">Cant. (u/kg)</label>
              <input
                inputMode="decimal"
                value={fCant}
                onChange={(e) => setFCant(e.target.value)}
                placeholder="100"
                className="h-9 w-full rounded-md border border-emerald-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Precio con $ a la izquierda */}
            <div className="relative">
              <label className="block text-[13px] text-emerald-900 mb-1">Precio unit.</label>
              <span className="absolute left-3 top-[30px] text-gray-400">$</span>
              <input
                inputMode="decimal"
                value={fPrecio}
                onChange={(e) => setFPrecio(e.target.value)}
                placeholder="10"
                className="h-9 w-full rounded-md border border-emerald-200 bg-white pl-6 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Subtotal (solo lectura) */}
            <div>
              <label className="block text-[13px] text-emerald-900 mb-1">Subtotal</label>
              <input
                disabled
                value={
                  subtotalPopup
                    ? fmtARS.format(subtotalPopup)
                    : "$0"
                }
                className="h-9 w-full rounded-md border border-emerald-200 bg-gray-50 px-3 text-sm"
              />
            </div>

            {/* Guardar */}
            <div className="md:col-span-2 flex items-end">
              <PrimaryButton onClick={onSaveEdit} className="rounded-full" text="Guardar" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
