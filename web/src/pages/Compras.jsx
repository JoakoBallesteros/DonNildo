import { useMemo, useState } from "react";
import {
  Plus, Search, Filter, ChevronDown, Calendar, Download,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

/* Tus componentes reutilizables */
import ActionButton from "../components/buttons/ActionButton.jsx";
import IconButton from "../components/buttons/IconButton.jsx";
import PrimaryButton from "../components/buttons/PrimaryButton.jsx";

/* =========================
   Modal simple (sin libs)
   ========================= */
function Modal({ isOpen, title, onClose, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="absolute left-1/2 top-1/2 w-[min(680px,95vw)] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-xl border border-emerald-100">
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
   Datos mock iniciales
   ========================= */
const INITIAL = [
  { id: "OC-0003", proveedor: "Vidrios Industriales", tipo: "Mixtas",     total: 900,  fecha: "2024-09-30", detalle: "Ver Detalle", obs: "—" },
  { id: "OC-0002", proveedor: "Plásticos del Sur",    tipo: "Cajas",      total: 1800, fecha: "2024-10-02", detalle: "Ver Detalle", obs: "—" },
  { id: "OC-0001", proveedor: "Reciclados Norte S.A.",tipo: "Materiales", total: 2500, fecha: "2024-10-04", detalle: "Ver Detalle", obs: "—" },
];

const TABS = ["Todo", "Materiales", "Cajas", "Mixtas"];
const fmtARS = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
const toNumber = (v) => Number(String(v).replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "")) || 0;

export default function Compras() {
  const navigate = useNavigate();

  // filtros y estado base
  const [tab, setTab] = useState("Todo");
  const [q, setQ] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  // filas editables
  const [rows, setRows] = useState(INITIAL);

  // modal editar/agregar ítem
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [fProducto, setFProducto] = useState("");
  const [fMedida, setFMedida] = useState("");
  const [fCant, setFCant] = useState("");
  const [fPrecio, setFPrecio] = useState("");

  const subtotalPopup = useMemo(() => {
    const c = toNumber(fCant);
    const p = toNumber(fPrecio);
    return c && p ? c * p : 0;
  }, [fCant, fPrecio]);

  const filtered = useMemo(() => {
    const items = rows
      .filter((r) => (tab === "Todo" ? true : r.tipo === tab))
      .filter((r) =>
        r.id.toLowerCase().includes(q.toLowerCase()) ||
        r.proveedor.toLowerCase().includes(q.toLowerCase())
      )
      .filter((r) => {
        const d = new Date(r.fecha);
        const okFrom = desde ? d >= new Date(desde) : true;
        const okTo   = hasta ? d <= new Date(hasta) : true;
        return okFrom && okTo;
      })
      .sort((a, b) => {
        const da = new Date(a.fecha).getTime();
        const db = new Date(b.fecha).getTime();
        return sortAsc ? da - db : db - da;
      });
    return items;
  }, [rows, tab, q, desde, hasta, sortAsc]);

  function resetFiltros() {
    setTab("Todo");
    setQ("");
    setDesde("");
    setHasta("");
  }

  function onEdit(row) {
    setEditRow(row);
    setFProducto(row.producto || "");
    setFMedida(row.medida || "");
    setFCant("");
    setFPrecio("");
    setEditOpen(true);
  }

  function onSaveEdit() {
    if (!editRow) return;
    const nuevoTotal = subtotalPopup || editRow.total;
    setRows((prev) =>
      prev.map((r) =>
        r.id === editRow.id
          ? { ...r, total: nuevoTotal, producto: fProducto || r.producto, medida: fMedida || r.medida }
          : r
      )
    );
    setEditOpen(false);
  }

  function onAnular(id) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="p-6 md:p-8">
      <div className="rounded-2xl bg-white border border-emerald-100 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 pt-6">
          <h2 className="text-2xl md:text-[26px] font-bold text-emerald-900">Lista de Compras</h2>

          {/* Ir a RegistrarCompra */}
          <PrimaryButton
            onClick={() => navigate("nueva")}     // /compras/nueva
            text={
              <span className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4" /> Añadir nueva compra
              </span>
            }
          />
        </div>

        {/* Chips */}
        <div className="px-6 mt-4 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={[
                "px-4 py-1.5 rounded-full text-sm transition",
                tab === t
                  ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
              ].join(" ")}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Barra de filtros (compacta, horizontal) */}
        <div className="px-6 mt-4">
          <div className="rounded-[20px] border border-emerald-100 bg-white/60 px-4 py-3">
            <div className="flex flex-wrap items-end gap-4">
              {/* Buscar */}
              <div className="flex flex-col">
                <span className="text-[13px] text-emerald-900 mb-1">Buscar</span>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                  <input
                    className="h-9 w-[260px] rounded-md border border-emerald-200 bg-white pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    placeholder="Proveedor, orden..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
              </div>

              {/* Fecha desde */}
              <div className="flex flex-col">
                <span className="text-[13px] text-emerald-900 mb-1">Fecha desde</span>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                  <input
                    type="date"
                    value={desde}
                    onChange={(e) => setDesde(e.target.value)}
                    className="h-9 w-[210px] rounded-md border border-emerald-200 bg-white pl-8 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              {/* Fecha hasta */}
              <div className="flex flex-col">
                <span className="text-[13px] text-emerald-900 mb-1">Fecha hasta</span>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
                  <input
                    type="date"
                    value={hasta}
                    onChange={(e) => setHasta(e.target.value)}
                    className="h-9 w-[210px] rounded-md border border-emerald-200 bg-white pl-8 pr-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              {/* Botones filtros (usando tu IconButton) */}
              <div className="ml-auto flex flex-col items-start gap-1">
                <IconButton
                  onClick={() => {}}
                  title="Aplicar filtros"
                  variant="solid"
                  className="h-9"
                >
                  <Filter className="h-4 w-4" />
                  <span className="text-sm">Aplicar Filtros</span>
                </IconButton>

                <IconButton
                  onClick={resetFiltros}
                  title="Reiniciar filtro"
                  variant="ghost"
                  className="-ml-1 h-7 px-1 text-[12px] underline underline-offset-2"
                  label="Reiniciar Filtro"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="px-6 pb-6 mt-6">
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
                        <ActionButton
                          type="edit"
                          text="MODIFICAR"
                          onClick={() => onEdit(r)}
                        />
                        <ActionButton
                          type="delete"
                          text="ANULAR"
                          onClick={() => onAnular(r.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                      No hay resultados para “{q}”.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="h-6" />
        </div>
      </div>

      {/* Modal Editar / Agregar ítem */}
      <Modal isOpen={editOpen} title="Agregar ítem" onClose={() => setEditOpen(false)}>
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Orden: <span className="font-medium">{editRow?.id}</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div className="md:col-span-2">
              <label className="block text-[13px] text-gray-700 mb-1">Producto / Material</label>
              <input
                value={fProducto}
                onChange={(e) => setFProducto(e.target.value)}
                placeholder="PRITTY20X20"
                className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-[13px] text-gray-700 mb-1">Medida/Estado</label>
              <input
                value={fMedida}
                onChange={(e) => setFMedida(e.target.value)}
                placeholder="20x20"
                className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-[13px] text-gray-700 mb-1">Cant. (u/kg)</label>
              <input
                inputMode="decimal"
                value={fCant}
                onChange={(e) => setFCant(e.target.value)}
                placeholder="100"
                className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-[13px] text-gray-700 mb-1">Precio unit.</label>
              <input
                inputMode="decimal"
                value={fPrecio}
                onChange={(e) => setFPrecio(e.target.value)}
                placeholder="$10"
                className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-[13px] text-gray-700 mb-1">Subtotal</label>
              <input
                disabled
                value={subtotalPopup ? fmtARS.format(subtotalPopup) : "$0"}
                className="h-9 w-full rounded-md border border-gray-300 bg-gray-50 px-3 text-sm"
              />
            </div>
            <div className="md:col-span-2 flex items-end">
              <PrimaryButton
                onClick={onSaveEdit}
                className="rounded-full"
                text="Guardar"
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
