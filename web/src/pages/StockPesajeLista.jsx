// src/pages/StockPesajesLista.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import PageContainer from "../components/pages/PageContainer";
import DataTable from "../components/tables/DataTable";
import PrintButton from "../components/buttons/PrintButton";
import { apiFetch } from "../lib/apiClient";

// --- Helpers de fecha/hora ---
// Interpretamos lo que viene de la DB como UTC (Supabase)
// y lo mostramos en horario local (ej: Argentina -03)
function parseToLocalDate(value) {
  if (!value) return null;

  // Si ya viene con zona horaria, usamos tal cual
  const hasTZ = /[Zz]|[+\-]\d{2}:\d{2}$/.test(value);
  const iso = hasTZ ? value : value + "Z"; // lo tratamos como UTC

  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d;
}

function formatFechaConHora(value) {
  const d = parseToLocalDate(value);
  if (!d) return "—";

  const fecha = d
    .toLocaleDateString("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\//g, "-");

  const hora = d.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${fecha} ${hora}`;
}

export default function StockPesajesLista() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const loadPesajes = useCallback(async () => {
    try {
      setLoading(true);
      setErr("");
      const data = await apiFetch("/api/stock/pesajes");
      setRows(data || []);
    } catch (e) {
      console.error("Error cargando historial de pesajes:", e);
      setErr(e.message || "Error al cargar el historial.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPesajes();
  }, [loadPesajes]);

  const columns = useMemo(
    () => [
      {
        id: "fecha",
        header: "Fecha",
        accessor: (r) => formatFechaConHora(r.fecha),
        sortAccessor: (r) => parseToLocalDate(r.fecha)?.getTime() || 0,
        width: 190,
        align: "left",
        sortable: true,
        filter: "date",
      },
      {
        id: "producto",
        header: "Material",
        accessor: "producto",
        align: "left",
        sortable: true,
        filter: "text",
      },
      {
        id: "cantidad",
        header: "Cantidad",
        accessor: (r) => Number(r.cantidad || 0),
        align: "right",
        width: 170, // ⬅️ antes 130
        sortable: true,
        filter: "number",
        cellClass: "tabular-nums whitespace-nowrap",
      },
      {
        id: "unidad",
        header: "Unidad",
        accessor: "unidad",
        align: "center",
        width: 80,
      },
      {
        id: "precio_kg",
        header: "Precio x Kg",
        align: "right",
        width: 180, // ⬅️ antes 140
        sortable: true,
        sortAccessor: (r) => Number(r.precio_kg || 0),
        accessor: (r) =>
          r.precio_kg != null
            ? `$ ${Number(r.precio_kg).toLocaleString("es-AR")}`
            : "—",
        cellClass: "tabular-nums whitespace-nowrap",
      },
      {
        id: "subtotal",
        header: "Subtotal",
        align: "right",
        width: 180, // ⬅️ antes 140
        sortable: true,
        sortAccessor: (r) => Number(r.subtotal || 0),
        accessor: (r) =>
          r.subtotal != null
            ? `$ ${Number(r.subtotal).toLocaleString("es-AR")}`
            : "—",
        cellClass: "tabular-nums whitespace-nowrap",
      },
      {
        id: "obs",
        header: "Observaciones",
        accessor: (r) => r.observaciones || "—",
        align: "left",
      },
    ],
    []
  );

  return (
    <PageContainer
      title="Historial de Pesajes"
      actions={
        <button
          type="button"
          onClick={loadPesajes}
          className="rounded-md border border-[#154734] text-[#154734] px-4 py-2 hover:bg-[#e8f4ef]"
        >
          Recargar
        </button>
      }
    >
      {err && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
          {err}
        </div>
      )}

      <div
        id="pesajes-print"
        className="bg-white rounded-2xl border border-[#e3e9e5] p-3 md:p-4"
      >
        {loading ? (
          <p className="text-sm text-slate-600">Cargando historial…</p>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            zebra={false}
            stickyHeader={true}
            theadClass="bg-[#e8f4ef] text-[#154734]"
            rowClass="hover:bg-[#f6faf7] border-t border-[#edf2ef]"
            headerClass="px-3 py-2.5 font-semibold"
            cellClass="px-3 py-2.5"
            emptyLabel="No hay pesajes registrados."
            enableSort={true}
            enableFilters={true}
            enablePagination={true}
            pageSize={10}
            wrapperClass="max-h-none overflow-visible"
          />
        )}
      </div>

      <div className="mt-5 flex items-center">
        <div className="ml-auto">
          <PrintButton targetId="pesajes-print" />
        </div>
      </div>
    </PageContainer>
  );
}
