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

  return (
    <PageContainer title="Auditoría del Sistema">
      {/* Filtros superiores */}
      <div className="bg-white rounded-2xl border border-[#e3e9e5] p-5 md:p-6 mb-5">
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
          <div>
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
          <div>
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
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                tab === t
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
        <DataTable
          columns={cols}
          data={filtered}
          enableSort
          wrapperClass="dn-table-wrapper overflow-y-auto"
          tableClass="w-full text-sm border-collapse table-fixed"
          theadClass="bg-[#e8f4ef] text-[#154734]"
          rowClass="hover:bg-[#f6faf7] transition border-t border-[#edf2ef]"
          headerClass="px-4 py-3 font-semibold border-r border-[#e3e9e5] last:border-none select-none text-center"
          cellClass="px-4 py-3 border-r border-[#edf2ef] last:border-none align-top text-center"
        />
      )}
    </PageContainer>
  );
}
