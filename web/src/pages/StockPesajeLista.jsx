// src/pages/StockPesajesLista.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import PageContainer from "../components/pages/PageContainer";
import DataTable from "../components/tables/DataTable";
import PrintButton from "../components/buttons/PrintButton";
import { apiFetch } from "../lib/apiClient";

// Helpers fecha
function parseToLocalDate(value) {
  if (!value) return null;
  const hasTZ = /[Zz]|[+-]\d{2}:\d{2}$/.test(value);
  const iso = hasTZ ? value : value + "Z";
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

  // Columnas usadas tanto en pantalla como impresión
  const columns = useMemo(
    () => [
      {
        id: "fecha",
        header: "Fecha",
        accessor: (r) => formatFechaConHora(r.fecha),
        sortAccessor: (r) => parseToLocalDate(r.fecha)?.getTime() || 0,
      },
      {
        id: "producto",
        header: "Material",
        accessor: "producto",
      },
      {
        id: "cantidad",
        header: "Cantidad",
        accessor: (r) => Number(r.cantidad || 0),
      },
      {
        id: "unidad",
        header: "Unidad",
        accessor: "unidad",
      },
      {
        id: "precio_kg",
        header: "Precio x Kg",
        accessor: (r) =>
          r.precio_kg != null
            ? `$ ${Number(r.precio_kg).toLocaleString("es-AR")}`
            : "—",
      },
      {
        id: "subtotal",
        header: "Subtotal",
        accessor: (r) =>
          r.subtotal != null
            ? `$ ${Number(r.subtotal).toLocaleString("es-AR")}`
            : "—",
      },
      {
        id: "obs",
        header: "Observaciones",
        accessor: (r) => r.observaciones || "—",
      },
    ],
    []
  );

  return (
    <PageContainer
      title="Historial de movimiento de Materiales"
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

      {/* TABLA EN PANTALLA */}
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

      {/* TABLA ESPECIAL PARA IMPRESIÓN — OCULTA EN PANTALLA */}
      <div id="pesaje-print-full" className="hidden print:block mt-10">
        <h2 className="text-xl font-semibold mb-4">
          Historial de movimiento de Materiales
        </h2>

        <table className="w-full text-sm border-collapse">
          <thead className="bg-[#e8f4ef] text-[#154734]">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.id}
                  className="px-3 py-2.5 border text-left font-semibold"
                >
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-t">
                {columns.map((col) => {
                  let value =
                    typeof col.accessor === "function"
                      ? col.accessor(row)
                      : row[col.id] || "—";

                  return (
                    <td key={col.id} className="px-3 py-2 border">
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BOTÓN DE IMPRESIÓN */}
      <div className="mt-5 flex items-center">
        <div className="ml-auto">
          <PrintButton
            targetId="pesaje-print-full" // <-- AHORA IMPRIME LA TABLA COMPLETA
            disabled={rows.length === 0}
            className={rows.length === 0 ? "opacity-50 cursor-not-allowed" : ""}
          />
        </div>
      </div>
    </PageContainer>
  );
}
