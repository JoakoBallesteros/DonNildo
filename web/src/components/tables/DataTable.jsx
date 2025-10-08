import { Download } from "lucide-react";
import ActionButton from "../buttons/ActionButton";

export default function DataTable({ headers, data }) {
  return (
    <div className="overflow-x-auto bg-white border border-[#e3e9e5] rounded-xl">
      <table className="w-full border-collapse text-sm text-left text-gray-700">
        <thead className="bg-[#e8f4ef] text-[#154734]">
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className={`px-4 py-3 font-semibold ${
                  i === headers.length - 1 ? "text-center" : ""
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
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2 align-middle">
                    {cell}
                  </td>
                ))}

                {/* 🔹 Columna Acciones */}
                <td className="px-4 py-2">
                  <div className="flex justify-between items-center">
                    {/* Botones MODIFICAR / ANULAR en vertical */}
                    <div className="flex flex-col gap-2">
                      <ActionButton
                        type="edit"
                        text="MODIFICAR"
                        className="w-[100px]"
                      />
                      <ActionButton
                        type="delete"
                        text="ANULAR"
                        className="w-[100px]"
                      />
                    </div>

                    {/* Botón de descarga al lado derecho */}
                    <button
                      title="Descargar"
                      className="border border-[#154734] text-[#154734] rounded-md hover:bg-[#e8f4ef] transition p-1 flex items-center justify-center"
                    >
                      <Download size={18} />
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
