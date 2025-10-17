import React, { useMemo, useState } from "react";

export default function DataTable({
  columns = [],
  data = [],
  rowKey = (_, i) => i,
  onRowClick,
  emptyLabel = "No hay datos",
  // clases
  tableClass = "w-full text-sm border-collapse table-fixed",
  theadClass = "bg-[#e8f4ef] text-[#154734]",
  tbodyClass = "",
  rowClass = "hover:bg-[#f6faf7] transition",
  headerClass = "px-4 py-3 font-semibold border-r border-[#e3e9e5] last:border-none select-none",
  cellClass = "px-4 py-3 border-r border-[#edf2ef] last:border-none",
  zebra = false,
  stickyHeader = false,

  // 🔥 NUEVO
  enableSort = false,
  enableFilters = false,
}) {
  const alignClass = (a) =>
    a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left";

  // 👇 NUEVO: justificación del wrapper del header para que sí se alinee
  const headerJustify = (a) =>
    a === "right" ? "justify-end" : a === "center" ? "justify-center" : "justify-start";

  // ---------- estado de sort ----------
  const [sort, setSort] = useState(null); // { id, dir: 'asc'|'desc' }

  const toggleSort = (col) => {
    if (!enableSort || !col.sortable) return;
    setSort((prev) => {
      if (!prev || prev.id !== col.id) return { id: col.id, dir: "asc" };
      if (prev.dir === "asc") return { id: col.id, dir: "desc" };
      return null; // tercera pulsación limpia
    });
  };

  // ---------- estado de filtros ----------
  const [filters, setFilters] = useState({});
  const setFilter = (colId, payload) =>
    setFilters((prev) => ({ ...prev, [colId]: payload }));

  // ---------- render helpers ----------
  const sortIcon = (col) => {
    if (!enableSort || !col.sortable) return null;
    if (!sort || sort.id !== col.id) return <span className="opacity-40">↕</span>;
    return sort.dir === "asc" ? <span>▲</span> : <span>▼</span>;
  };

  // ---------- data procesada (filtros + sort) ----------
  const processed = useMemo(() => {
    let out = [...data];

    if (enableFilters) {
      out = out.filter((row) =>
        columns.every((c) => {
          const f = filters[c.id];
          if (!f || !c.filter) return true;

          const getVal = () =>
            typeof c.accessor === "function"
              ? c.accessor(row)
              : c.accessor
              ? row[c.accessor]
              : null;

          const raw = getVal();
          if (c.filter === "text") {
            const needle = String(f.value || "").toLowerCase();
            return !needle || String(raw ?? "").toLowerCase().includes(needle);
          }
          if (c.filter === "number") {
            const n = Number(raw);
            const min = f.min !== undefined && f.min !== "" ? Number(f.min) : null;
            const max = f.max !== undefined && f.max !== "" ? Number(f.max) : null;
            if (min !== null && !(n >= min)) return false;
            if (max !== null && !(n <= max)) return false;
            return true;
          }
          if (c.filter === "date") {
            const val = raw ? new Date(raw) : null;
            const min = f.min ? new Date(f.min) : null;
            const max = f.max ? new Date(f.max) : null;
            if (min && val && val < min) return false;
            if (max && val && val > max) return false;
            return true;
          }
          return true;
        })
      );
    }

    if (enableSort && sort) {
      const col = columns.find((c) => c.id === sort.id);
      if (col) {
        const getVal = (row) => {
          if (col.sortAccessor) return col.sortAccessor(row);
          if (typeof col.accessor === "function") return col.accessor(row);
          if (col.accessor) return row[col.accessor];
          return null;
        };
        out.sort((a, b) => {
          let va = getVal(a);
          let vb = getVal(b);

          const isDateStr = (x) => typeof x === "string" && /^\d{4}-\d{2}-\d{2}/.test(x);
          if (isDateStr(va)) va = new Date(va);
          if (isDateStr(vb)) vb = new Date(vb);

          if (va == null && vb == null) return 0;
          if (va == null) return 1;
          if (vb == null) return -1;

          let cmp = 0;
          if (va > vb) cmp = 1;
          else if (va < vb) cmp = -1;

          return sort.dir === "asc" ? cmp : -cmp;
        });
      }
    }

    return out;
  }, [data, columns, enableFilters, filters, enableSort, sort]);

 return (
    // 🔹 Contenedor con scroll vertical y header fijo
    <div className="relative bg-white rounded-xl border border-[#e3e9e5] max-h-[320px] overflow-y-auto overflow-x-auto">
      <table className={tableClass}>
        <colgroup>
          {columns.map((col, i) => (
            <col key={col.id ?? i} style={col.width ? { width: col.width } : {}} />
          ))}
        </colgroup>

        <thead className={theadClass}>
          <tr className="sticky top-0 bg-[#e8f4ef] z-20 shadow-sm">
            {columns.map((col, i) => (
              <th
                key={col.id ?? i}
                className={`${headerClass} ${alignClass(col.align)} ${col.headerClass || ""}`}
                onClick={() => toggleSort(col)}
                title={enableSort && col.sortable ? "Ordenar" : undefined}
              >
                <div className={`w-full flex items-center gap-2 ${headerJustify(col.align)}`}>
                  <span>{col.header}</span>
                  {sortIcon(col)}
                </div>
              </th>
            ))}
          </tr>

          {enableFilters && (
            <tr className="sticky top-[42px] bg-white z-10">
              {columns.map((col, i) => {
                if (!col.filter) {
                  return <th key={`f-${col.id ?? i}`} className={`${headerClass}`} />;
                }
                if (col.filter === "text") {
                  return (
                    <th key={`f-${col.id ?? i}`} className={`${headerClass}`}>
                      <input
                        type="text"
                        className="w-full border border-[#dfe8e4] rounded-md px-2 py-1 text-sm"
                        placeholder="Buscar…"
                        value={filters[col.id]?.value ?? ""}
                        onChange={(e) => setFilter(col.id, { value: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </th>
                  );
                }
                if (col.filter === "number") {
                  return (
                    <th key={`f-${col.id ?? i}`} className={`${headerClass}`}>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          className="w-1/2 border border-[#dfe8e4] rounded-md px-2 py-1 text-sm"
                          placeholder="Min"
                          value={filters[col.id]?.min ?? ""}
                          onChange={(e) =>
                            setFilter(col.id, { ...(filters[col.id] || {}), min: e.target.value })
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <input
                          type="number"
                          className="w-1/2 border border-[#dfe8e4] rounded-md px-2 py-1 text-sm"
                          placeholder="Max"
                          value={filters[col.id]?.max ?? ""}
                          onChange={(e) =>
                            setFilter(col.id, { ...(filters[col.id] || {}), max: e.target.value })
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </th>
                  );
                }
                if (col.filter === "date") {
                  return (
                    <th key={`f-${col.id ?? i}`} className={`${headerClass}`}>
                      <div className="flex gap-2">
                        <input
                          type="date"
                          className="w-1/2 border border-[#dfe8e4] rounded-md px-2 py-1 text-sm"
                          value={filters[col.id]?.min ?? ""}
                          onChange={(e) =>
                            setFilter(col.id, { ...(filters[col.id] || {}), min: e.target.value })
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                        <input
                          type="date"
                          className="w-1/2 border border-[#dfe8e4] rounded-md px-2 py-1 text-sm"
                          value={filters[col.id]?.max ?? ""}
                          onChange={(e) =>
                            setFilter(col.id, { ...(filters[col.id] || {}), max: e.target.value })
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </th>
                  );
                }
                return <th key={`f-${col.id ?? i}`} className={`${headerClass}`} />;
              })}
            </tr>
          )}
        </thead>

        <tbody className={tbodyClass}>
          {processed.length === 0 ? (
            <tr>
              <td
                className="px-4 py-6 text-slate-500 text-center border-t border-[#edf2ef]"
                colSpan={columns.length}
              >
                {emptyLabel}
              </td>
            </tr>
          ) : (
            processed.map((row, ri) => (
              <tr
                key={rowKey(row, ri)}
                onClick={onRowClick ? () => onRowClick(row, ri) : undefined}
                className={`${rowClass} ${
                  zebra && ri % 2 ? "bg-[#fafdfb]" : ""
                } border-t border-[#edf2ef]`}
              >
                {columns.map((col, ci) => {
                  const content = col.render
                    ? col.render(row, ri)
                    : typeof col.accessor === "function"
                    ? col.accessor(row, ri)
                    : col.accessor
                    ? row[col.accessor]
                    : null;

                  return (
                    <td
                      key={ci}
                      className={`${cellClass} ${alignClass(col.align)} ${col.cellClass || ""} ${
                        col.nowrap ? "whitespace-nowrap" : ""
                      }`}
                    >
                         {content}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}