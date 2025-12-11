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

const PAGE_SIZE = 10; 

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

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryString = `?q=${q}&tab=${tab === "Todo" ? "" : tab}`;
      const data = await api(`/api/auditoria${queryString}`);

      setRawEvents(
        data.eventos.map((e) => ({
          ...e,
          fechaOriginal: e.fecha,
          fecha: formatFechaHora(e.fecha),
          usuario: e.usuario || "N/A",
        }))
      );
  
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [q, tab]);

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


  const filtered = useMemo(() => {
    let out = rawEvents;

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

    if (desde) {
      out = out.filter((x) => new Date(x.fechaOriginal) >= new Date(desde));
    }

    if (hasta) {
      const limite = new Date(hasta);
      limite.setHours(23, 59, 59, 999);
      out = out.filter((x) => new Date(x.fechaOriginal) <= limite);
    }

    return out;
  }, [rawEvents, tab, desde, hasta]);





  return (
    <PageContainer title="Auditoría del Sistema">
      {/* filtros superiores */}
      <div className="bg-white rounded-2xl border border-[#e3e9e5] p-5 md:p-6 mb-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-semibold text-[#154734] mb-1 block">
              Buscar
            </label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") loadEvents();
              }}
              placeholder="Usuario / tipo / id"
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
        <>
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
        </>
      )}
    </PageContainer>
  );
}
