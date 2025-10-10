import { useMemo, useState } from "react";
import {
  Plus, Search, Filter, ChevronDown, Calendar, RotateCcw, Download,
} from "lucide-react";
import { Link } from "react-router-dom";




// Mock de datos con campos que pide la UI
const DATA = [
  { id: "OC-0001", proveedor: "Reciclados Norte S.A.", tipo: "Materiales", total: 2500, fecha: "2024-10-05", detalle: "Ver Detalle", obs: "—", estado: "Pendiente" },
  { id: "OC-0002", proveedor: "Plásticos del Sur", tipo: "Cajas", total: 1800, fecha: "2024-10-03", detalle: "Ver Detalle", obs: "—", estado: "Completada" },
  { id: "OC-0003", proveedor: "Vidrios Industriales", tipo: "Mixtas", total: 900, fecha: "2024-10-01", detalle: "Ver Detalle", obs: "—", estado: "En Proceso" },
];

const TABS = ["Todo", "Materiales", "Cajas", "Mixtas"];

function Chip({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-4 py-1.5 rounded-full text-sm transition",
        active ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
               : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function Compras() {
  const [tab, setTab] = useState("Todo");
  const [q, setQ] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  const filtered = useMemo(() => {
    const items = DATA.filter((r) => {
      const matchTab = tab === "Todo" ? true : r.tipo === tab;
      const matchText =
        r.id.toLowerCase().includes(q.toLowerCase()) ||
        r.proveedor.toLowerCase().includes(q.toLowerCase());
      const d = new Date(r.fecha);
      const fromOk = desde ? d >= new Date(desde) : true;
      const toOk = hasta ? d <= new Date(hasta) : true;
      return matchTab && matchText && fromOk && toOk;
    }).sort((a, b) => {
      const da = new Date(a.fecha).getTime();
      const db = new Date(b.fecha).getTime();
      return sortAsc ? da - db : db - da;
    });
    return items;
  }, [tab, q, desde, hasta, sortAsc]);

  const resetFiltros = () => {
    setTab("Todo");
    setQ("");
    setDesde("");
    setHasta("");
  };

  return (
    <div className="p-6 md:p-8">
      {/* Contenedor principal con borde redondeado suave como el mock */}
      <div className="rounded-2xl bg-white border border-emerald-100 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 pt-6">
          <h2 className="text-2xl md:text-[26px] font-bold text-emerald-900">
            Lista de Compras
          </h2>


          <Link
            to="/compras/nueva"
            className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
          >
            <Plus className="h-4 w-4" />
            Añadir nueva compra
      </Link>




        </div>

        {/* Chips */}
        <div className="px-6 mt-4 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
              {t}
            </Chip>
          ))}
        </div>

        {/* Barra de filtros */}
        {/* Barra de filtros (compacta y horizontal) */}
<div className="px-6 mt-4">
  <div className="rounded-[20px] border border-emerald-100 bg-white/60 px-4 py-3">
    <div className="flex flex-wrap items-end gap-4">
      {/* Buscar */}
      <div className="flex flex-col">
        <span className="text-[13px] text-emerald-900 mb-1">Buscar</span>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-400" />
          <input
            className="h-9 w-[260px] rounded-md border border-emerald-200 bg-white pl-8 pr-3 text-sm
                       focus:outline-none focus:ring-2 focus:ring-emerald-400"
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
            className="h-9 w-[210px] rounded-md border border-emerald-200 bg-white pl-8 pr-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-emerald-400"
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
            className="h-9 w-[210px] rounded-md border border-emerald-200 bg-white pl-8 pr-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>
      </div>

      {/* Botones (alineados a la derecha) */}
      <div className="ml-auto flex flex-col items-start gap-1">
        <button
          className="inline-flex h-9 items-center gap-2 rounded-full bg-emerald-700 px-4 text-sm font-semibold text-white
                     hover:bg-emerald-800"
          onClick={() => {}}
        >
          <Filter className="h-4 w-4" />
          Aplicar Filtros
        </button>
        <button
          className="text-[12px] text-emerald-800 underline underline-offset-2 hover:opacity-80"
          onClick={resetFiltros}
        >
          Reiniciar Filtro
        </button>
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
                    <td className="px-4 py-3">${r.total.toLocaleString()}</td>
                    <td className="px-4 py-3">{new Date(r.fecha).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <button
                        className="text-xs rounded-md border px-3 py-1.5 text-emerald-800 bg-white border-emerald-200 hover:bg-emerald-50"
                      >
                        {r.detalle}
                      </button>
                    </td>
                    <td className="px-4 py-3">{r.obs}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="text-[11px] tracking-wide rounded-md bg-emerald-700 text-white px-3 py-1.5 hover:bg-emerald-800">
                          MODIFICAR
                        </button>
                        <button className="text-[11px] tracking-wide rounded-md bg-red-700 text-white px-3 py-1.5 hover:bg-red-800">
                          ANULAR
                        </button>
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

          {/* padding inferior suave como en el mock */}
          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
