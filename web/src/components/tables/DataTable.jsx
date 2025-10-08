import { Download } from "lucide-react";
import ActionButton from "../buttons/ActionButton";

export default function DataTable({ headers, data }) {
  return (
    <div className="overflow-x-auto bg-white border border-[#e3e9e5] rounded-xl">
      <table className="min-w-full border-collapse text-sm text-left text-gray-700">
        <thead className="bg-[#e8f4ef] text-[#154734]">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className={`px-4 py-3 font-semibold ${
                  i === headers.length - 1 ? "text-center w-[220px]" : ""
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.length > 0 ? (
            data.map((row, i) => (
              <tr
                key={i}
                className="border-t border-[#edf3ef] hover:bg-[#f5faf7] transition"
              >
                {/* Celdas normales */}
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2 align-middle">
                    {cell}
                  </td>
                ))}

                {/* Columna de acciones */}
                <td className="px-4 py-2">
                  <div className="flex items-center justify-center gap-2">
                    <ActionButton type="edit" text="MODIFICAR" className="w-[90px]" />
                    <ActionButton type="delete" text="ANULAR" className="w-[90px]" />
                    <button
                      title="Descargar"
                      className="w-[36px] h-[36px] flex items-center justify-center border border-[#154734] text-[#154734] rounded-md hover:bg-[#e8f4ef] transition"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={headers.length}
                className="px-4 py-6 text-center text-gray-500"
              >
                No hay datos disponibles
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
