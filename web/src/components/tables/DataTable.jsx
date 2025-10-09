import React from "react";

/** DataTable GENÉRICO
 * columns: [{ id, header, accessor?, render?, align?, width?, headerClass?, cellClass? }]
 *  - accessor: "prop" | (row,i)=>any
 *  - render: (row,i)=>ReactNode (tiene prioridad sobre accessor)
 * data: []  | rowKey?: (row,i)=>key
 * stickyHeader?: boolean | zebra?: boolean
 * clases: tableClass, theadClass, tbodyClass, rowClass, headerClass, cellClass
 */
export default function DataTable({
  columns = [],
  data = [],
  rowKey = (_, i) => i,
  onRowClick,
  emptyLabel = "No hay datos",
  tableClass = "w-full text-sm text-left text-gray-700 border-collapse",
  theadClass = "bg-[#e8f4ef] text-[#154734]",
  tbodyClass = "",
  rowClass = "hover:bg-[#f6faf7] transition",
  headerClass = "px-4 py-3 font-semibold border-r border-[#e3e9e5] last:border-none",
  cellClass = "px-4 py-3 border-r border-[#edf2ef] last:border-none",
  zebra = false,
  stickyHeader = false,
}) {
  return (
    <div className="overflow-x-auto bg-white rounded-xl relative">
      <table className={tableClass}>
        <thead
          className={theadClass}
          style={
            stickyHeader ? { position: "sticky", top: 0, zIndex: 1 } : undefined
          }
        >
          <tr>
            {columns.map((col, i) => (
              <th
                key={col.id ?? i}
                className={`${headerClass} ${col.headerClass || ""} ${
                  col.align === "center"
                    ? "text-center"
                    : col.align === "right"
                    ? "text-right"
                    : "text-left"
                }`}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

       <tbody>
  {data.length === 0 ? (
    <tr>
      <td
        className="px-4 py-6 text-slate-500 text-center border-t border-[#edf2ef]"
        colSpan={columns.length}
      >
        No hay datos
      </td>
    </tr>
  ) : (
    data.map((row, ri) => (
      <tr
        key={ri}
        className={`hover:bg-[#f6faf7] transition border-t border-[#edf2ef]`}
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
              className={`px-4 py-3 border-r border-[#edf2ef] last:border-none`}
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
