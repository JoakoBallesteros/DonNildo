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
          style={stickyHeader ? { position: "sticky", top: 0, zIndex: 1 } : undefined}
        >
          <tr>
            {columns.map((col, i) => (
              <th
                key={col.id ?? i}
                className={`${headerClass} ${col.headerClass || ""} ${
                  col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : "text-left"
                }`}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> cd900643af3719029ccae24137627e0f94aea49d
        <tbody>
          {ventas.map((venta, i) => (
            <tr key={i} className="hover:bg-[#f6faf7] transition">
              <td className="px-4 py-3 border-r border-[#edf2ef]">{venta.numero}</td>
              <td className="px-4 py-3 border-r border-[#edf2ef]">{venta.tipo}</td>
              <td className="px-4 py-3 border-r border-[#edf2ef]">{venta.fecha}</td>
              <td className="px-4 py-3 border-r border-[#edf2ef]">${venta.total}</td>

              <td className="px-4 py-3 border-r border-[#edf2ef]">
                <button
                  onClick={() => handleOpenModal(venta)}
                  className="px-3 py-1 border border-[#154734] text-[#154734] rounded-md hover:bg-[#e8f4ef] transition"
                >
                  Ver Detalle
                </button>
              </td>

              <td className="px-4 py-3 border-r border-[#edf2ef]">
                {venta.observaciones}
              </td>

              <td className="px-4 py-3 w-[170px] border-r border-[#edf2ef] last:border-none">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col gap-2">
                    <ActionButton
                      type="edit"
                      text="MODIFICAR"
                      className="w-[100px] py-1.5"
                      onClick={() => handleEditModal(venta)}
                    />
                    <ActionButton
                      type="delete"
                      text="ANULAR"
                      className="w-[100px] py-1.5"
                    />
                  </div>

                  <button
                    title="Descargar"
                    className="border border-[#154734] text-[#154734] rounded-md hover:bg-[#a8acaa] transition p-1 flex items-center justify-center w-[34px] h-[34px]"
                  >
                    <Download size={16} />
                  </button>
                </div>
<<<<<<< HEAD
=======
        <tbody className={tbodyClass}>
          {data.length === 0 ? (
            <tr>
              <td className="px-4 py-6 text-slate-500 text-center" colSpan={columns.length}>
                {emptyLabel}
>>>>>>> e10a8d987b9b3e46c313bc02a7e2d302091e2048
=======
>>>>>>> cd900643af3719029ccae24137627e0f94aea49d
              </td>
            </tr>
          ) : (
            data.map((row, ri) => (
              <tr
                key={rowKey(row, ri)}
                className={`${rowClass} ${zebra && ri % 2 === 1 ? "bg-slate-50/40" : ""}`}
                onClick={onRowClick ? () => onRowClick(row, ri) : undefined}
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
                      key={col.id ?? ci}
                      className={`${cellClass} ${col.cellClass || ""} ${
                        col.align === "center" ? "text-center" : col.align === "right" ? "text-right" : "text-left"
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