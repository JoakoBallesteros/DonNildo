import React, { useMemo, useState, useEffect, useCallback } from "react";
import PageContainer from "../components/pages/PageContainer";
import DataTable from "../components/tables/DataTable";
import api from "../lib/apiClient";

const TABS = [
  "Todo",
  "Login/Logout",
  "Compras",
  "Ventas",
  "Stock",
  "Seguridad",
];

export default function SegAuditoria() {
  const [q, setQ] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [tab, setTab] = useState("Todo");

  const [rawEvents, setRawEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const formatFechaHora = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 🔹 Cargamos eventos (solo según TAB). El texto se filtra en el front.
  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryString =
        tab === "Todo" ? "" : `?tab=${encodeURIComponent(tab)}`;
      const data = await api(`/api/auditoria${queryString}`);

      setRawEvents(
        (data.eventos || []).map((e) => ({
          ...e,
          fechaOriginal: e.fecha, // YYYY-MM-DDTHH:mm:ss...
          fecha: formatFechaHora(e.fecha),
          usuario: e.usuario || "N/A",
        }))
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleSetTab = (t) => {
    setTab(t);
  };

  const cols = useMemo(
    () => [
      {
        id: "id",
        header: "ID",
        accessor: "id",
        width: 70,
        align: "center",
        nowrap: true,
        sortable: true,
      },
      {
        id: "tipo",
        header: "Evento",
        accessor: "tipo",
        width: 190,
        nowrap: true,
        sortable: true,
      },
      {
        id: "fecha",
        header: "Fecha/Hora",
        accessor: "fecha",
        width: 170,
        align: "center",
        nowrap: true,
        sortable: true,
      },
      {
        id: "usuario",
        header: "Usuario",
        accessor: "usuario",
        width: 220,
        nowrap: true,
        sortable: true,
      },
      {
        id: "modulo",
        header: "Módulo",
        accessor: "modulo",
        width: 120,
        align: "center",
        nowrap: true,
        sortable: true,
      },
      {
        id: "det",
        header: "Descripción",
        accessor: "detalle",
      },
    ],
    []
  );

  // 🔹 Filtro en tiempo real: tab + texto + fechas (inclusive)
  const filtered = useMemo(() => {
    let out = rawEvents;

    // 1) Filtro por pestaña (backup por si el backend no filtra)
    if (tab !== "Todo") {
      switch (tab) {
        case "Login/Logout":
          out = out.filter(
            (ev) =>
              (ev.tipo || "").toUpperCase().includes("LOGIN") ||
              (ev.tipo || "").toUpperCase().includes("LOGOUT")
          );
          break;
        case "Compras":
          out = out.filter((ev) => ev.modulo === "COMPRAS");
          break;
        case "Ventas":
          out = out.filter((ev) => ev.modulo === "VENTAS");
          break;
        case "Stock":
          out = out.filter((ev) => ev.modulo === "STOCK");
          break;
        case "Seguridad":
          out = out.filter((ev) => ev.modulo === "SEGURIDAD");
          break;
        default:
          break;
      }
    }

    const qTxt = q.trim().toLowerCase();
    const desdeStr = desde || "";
    const hastaStr = hasta || "";

    return out.filter((ev) => {
      // 2) Buscar por usuario / tipo / descripción
      if (qTxt) {
        const u = (ev.usuario || "").toLowerCase();
        const t = (ev.tipo || "").toLowerCase();
        const d = (ev.detalle || "").toLowerCase();

        if (!u.includes(qTxt) && !t.includes(qTxt) && !d.includes(qTxt)) {
          return false;
        }
      }

      // 3) Filtro de fecha inclusivo usando strings YYYY-MM-DD
      const fechaStr = String(ev.fechaOriginal).slice(0, 10); // 2025-12-20

      if (desdeStr && fechaStr < desdeStr) return false;
      if (hastaStr && fechaStr > hastaStr) return false;

      return true;
    });
  }, [rawEvents, tab, q, desde, hasta]);

  /* Paginación Mobile Manual */
  const [mobilePage, setMobilePage] = useState(1);
  const MOBILE_PAGE_SIZE = 10;

  useEffect(() => {
    setMobilePage(1);
  }, [filtered]);

  const maxMobilePages = Math.ceil(filtered.length / MOBILE_PAGE_SIZE) || 1;
  const mobileEvents = filtered.slice(
    (mobilePage - 1) * MOBILE_PAGE_SIZE,
    mobilePage * MOBILE_PAGE_SIZE
  );

  const prevMobile = () => setMobilePage((p) => Math.max(1, p - 1));
  const nextMobile = () => setMobilePage((p) => Math.min(maxMobilePages, p + 1));


  return (
    <PageContainer title="Auditoría del Sistema">
      {/* Filtros superiores */}
      <div className="bg-white rounded-2xl border border-[#e3e9e5] p-4 md:p-6 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-semibold text-[#154734] mb-1 block">
              Buscar
            </label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Usuario, evento o descripción…"
              className="w-full border border-[#d8e4df] rounded-md px-3 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 md:block">
            <div className="md:mb-0">
              <label className="text-sm font-semibold text-[#154734] mb-1 block">
                Desde
              </label>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="w-full border border-[#d8e4df] rounded-md px-3 py-2"
              />
            </div>
            <div className="md:hidden">
              <label className="text-sm font-semibold text-[#154734] mb-1 block">
                Hasta
              </label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="w-full border border-[#d8e4df] rounded-md px-3 py-2"
              />
            </div>
          </div>
          <div className="hidden md:block">
            <label className="text-sm font-semibold text-[#154734] mb-1 block">
              Hasta
            </label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full border border-[#d8e4df] rounded-md px-3 py-2"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex gap-2 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleSetTab(t)}
              className={`px-3 py-1.5 rounded-full text-xs md:text-sm font-medium transition ${tab === t
                  ? "bg-[#154734] text-white"
                  : "bg-[#e8f4ef] text-[#154734] hover:bg-[#dbeee6]"
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-600">
          Cargando eventos de auditoría...
        </p>
      ) : error ? (
        <div className="bg-red-100 p-3 rounded text-red-800">
          Error: {error}
        </div>
      ) : (
        <div>
          {/* Desktop Table (con paginación interna activada) */}
          <div className="hidden md:block">
            <DataTable
              columns={cols}
              data={filtered}
              enableSort
              enablePagination={true}
              pageSize={10}
              wrapperClass="dn-table-wrapper overflow-y-auto"
              tableClass="w-full text-sm border-collapse table-fixed"
              theadClass="bg-[#e8f4ef] text-[#154734]"
              rowClass="hover:bg-[#f6faf7] transition border-t border-[#edf2ef]"
              headerClass="px-4 py-3 font-semibold border-r border-[#e3e9e5] last:border-none select-none text-center"
              cellClass="px-4 py-3 border-r border-[#edf2ef] last:border-none align-top text-center"
            />
          </div>

          {/* Mobile Card List + Pagination */}
          <div className="md:hidden space-y-3">
            {filtered.length === 0 && (
              <p className="text-center text-gray-500 py-8">No se encontraron eventos.</p>
            )}
            {mobileEvents.map((ev) => (
              <div key={ev.id} className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${ev.modulo === "SEGURIDAD" ? "bg-red-100 text-red-800" :
                      ev.modulo === "VENTAS" ? "bg-emerald-100 text-emerald-800" :
                        ev.modulo === "COMPRAS" ? "bg-blue-100 text-blue-800" :
                          "bg-gray-100 text-gray-800"
                    }`}>
                    {ev.modulo}
                  </span>
                  <span className="text-xs text-gray-400">{ev.fecha}</span>
                </div>
                <h4 className="font-bold text-[#154734] text-base mb-1">
                  {ev.tipo}
                </h4>
                <p className="text-sm text-gray-600 mb-2 italic">
                  {ev.usuario}
                </p>
                {ev.detalle && (
                  <div className="text-sm bg-slate-50 p-2 rounded text-slate-700 border border-slate-100 break-words">
                    {ev.detalle}
                  </div>
                )}
              </div>
            ))}

            {/* Mobile Pagination Controls */}
            {filtered.length > MOBILE_PAGE_SIZE && (
              <div className="flex justify-between items-center pt-4">
                <button
                  onClick={prevMobile}
                  disabled={mobilePage === 1}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium ${mobilePage === 1 ? "bg-slate-100 text-slate-400 border-slate-200" : "bg-white text-[#154734] border-[#154734]"
                    }`}
                >
                  Anterior
                </button>
                <span className="text-sm text-slate-600">
                  Pág. {mobilePage} / {maxMobilePages}
                </span>
                <button
                  onClick={nextMobile}
                  disabled={mobilePage === maxMobilePages}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium ${mobilePage === maxMobilePages ? "bg-slate-100 text-slate-400 border-slate-200" : "bg-white text-[#154734] border-[#154734]"
                    }`}
                >
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </PageContainer>
  );
}
