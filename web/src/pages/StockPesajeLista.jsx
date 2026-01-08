
import React, { useEffect, useMemo, useState, useCallback } from "react";
import PageContainer from "../components/pages/PageContainer";
import DataTable from "../components/tables/DataTable";
import PrintButton from "../components/buttons/PrintButton";
import { apiFetch } from "../lib/apiClient";


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


  const movLabel = (m) => {
    if (!m) return "—";
    const map = { ENTRADA: "Entrada", SALIDA: "Salida", AJUSTE: "Ajuste" };
    return map[m] ?? m;
  };

  const movSign = (m) => {
    if (m === "SALIDA") return "-";
    if (m === "ENTRADA") return "+";
    if (m === "AJUSTE") return "±";
    return ""; // fallback si aún no viene tipo_mov
  };

  const signedNumberForSort = (r) => {
    const n = Number(r.cantidad || 0);
    if (r.tipo_mov === "SALIDA") return -n;
    if (r.tipo_mov === "ENTRADA") return +n;
    return n; // AJUSTE u otros
  };

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

      // Mov.
      {
        id: "tipo_mov",
        header: "Mov.",
        accessor: (r) => movLabel(r.tipo_mov),
      },

      //  Cantidad con signo
      {
        id: "cantidad",
        header: "Cantidad",
        accessor: (r) => {
          const n = Number(r.cantidad || 0);
          const sign = movSign(r.tipo_mov);
          return `${sign}${n.toLocaleString("es-AR")}`;
        },
        sortAccessor: (r) => signedNumberForSort(r),
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

  /* Paginación Mobile */
  const [mobilePage, setMobilePage] = useState(1);
  const MOBILE_PAGE_SIZE = 10;

  useEffect(() => {
    setMobilePage(1);
  }, [rows]);

  const maxMobilePages = Math.ceil(rows.length / MOBILE_PAGE_SIZE) || 1;
  const mobileRows = rows.slice(
    (mobilePage - 1) * MOBILE_PAGE_SIZE,
    mobilePage * MOBILE_PAGE_SIZE
  );

  const prevMobile = () => setMobilePage((p) => Math.max(1, p - 1));
  const nextMobile = () => setMobilePage((p) => Math.min(maxMobilePages, p + 1));

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


      <div
        id="pesajes-print"
        className="bg-white rounded-2xl border border-[#e3e9e5] p-3 md:p-4"
      >
        {loading ? (
          <p className="text-sm text-slate-600">Cargando historial…</p>
        ) : (
          <div>
            <div className="hidden md:block">
              <DataTable
                columns={columns}
                data={rows}
                zebra={false}
                stickyHeader={true}
                theadClass="bg-[#e8f4ef] text-[#154734]"
                rowClass="hover:bg-[#f6faf7] border-t border-[#edf2ef]"
                headerClass="px-3 py-2.5 font-semibold"
                cellClass="px-3 py-2.5"
                emptyLabel="No hay movimientos registrados."
                enableSort={true}
                enableFilters={true}
                enablePagination={true}
                pageSize={10}
                wrapperClass="max-h-none overflow-visible"
              />
            </div>

            {/* Mobile Card List */}
            <div className="md:hidden space-y-3">
              {rows.length === 0 && (
                <p className="text-center text-gray-500 py-6">No hay movimientos registrados.</p>
              )}
              {mobileRows.map((r, idx) => {
                const sign = movSign(r.tipo_mov);
                return (
                  <div key={idx} className="bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-[#154734] text-base">{r.producto}</h4>
                      <span className="text-xs text-gray-400">{formatFechaConHora(r.fecha)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mb-2">
                      <div>
                        <span className="block text-xs text-gray-400">Tipo</span>
                        <span className={`font-medium ${r.tipo_mov === 'ENTRADA' ? 'text-emerald-700' : r.tipo_mov === 'SALIDA' ? 'text-red-700' : ''}`}>
                          {movLabel(r.tipo_mov)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-xs text-gray-400">Cantidad</span>
                        <span className="font-bold text-gray-900">
                          {sign}{Number(r.cantidad).toLocaleString("es-AR")} {r.unidad}
                        </span>
                      </div>
                    </div>

                    {(r.precio_kg != null || r.subtotal != null) && (
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-700 mb-2 bg-slate-50 p-2 rounded">
                        {r.precio_kg != null && (
                          <div>
                            <span className="block text-xs text-gray-400">Precio/Kg</span>
                            <span>${Number(r.precio_kg).toLocaleString("es-AR")}</span>
                          </div>
                        )}
                        {r.subtotal != null && (
                          <div className="text-right">
                            <span className="block text-xs text-gray-400">Subtotal</span>
                            <span className="font-bold">${Number(r.subtotal).toLocaleString("es-AR")}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {r.observaciones && (
                      <div className="text-xs text-gray-500 mt-2 italic border-t pt-2">
                        {r.observaciones}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Mobile Pagination Controls */}
              {rows.length > MOBILE_PAGE_SIZE && (
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
            targetId="pesaje-print-full"
            disabled={rows.length === 0}
            className={rows.length === 0 ? "opacity-50 cursor-not-allowed" : ""}
          />
        </div>
      </div>
    </PageContainer>
  );
}
