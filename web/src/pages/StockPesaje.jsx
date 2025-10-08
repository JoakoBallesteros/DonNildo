import PageContainer from "../components/PageContainer";
export default function StockPesaje() {
  return (
    <PageContainer> 
    <section>
      <h2 className="text-2xl font-bold text-emerald-900 mb-4">Registrar pesaje</h2>

      <div className="bg-white rounded-xl border p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <select className="border rounded-lg px-3 py-2">
            <option>Tipo de material…</option>
          </select>
          <input className="border rounded-lg px-3 py-2" placeholder="Cantidad (kg)" />
          <input className="border rounded-lg px-3 py-2" placeholder="Precio x Kg (opcional)" />
          <button className="rounded-lg bg-emerald-800 text-white px-4 py-2">+ Añadir</button>
        </div>
        <input className="mt-3 border rounded-lg px-3 py-2 w-full" placeholder="Observaciones (opcional)" />
      </div>

      <div className="bg-white rounded-xl border p-2 overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-slate-600">
              <th className="p-2">Tipo</th>
              <th className="p-2">Cantidad (kg)</th>
              <th className="p-2">Precio x Kg</th>
              <th className="p-2">Subtotal</th>
              <th className="p-2">Observaciones</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="p-2">Cartón</td>
              <td className="p-2">200</td>
              <td className="p-2">$7.000</td>
              <td className="p-2">—</td>
              <td className="p-2">—</td>
              <td className="p-2">
                <div className="flex gap-2">
                  <button className="text-xs bg-emerald-700 text-white rounded px-2 py-1">Modificar</button>
                  <button className="text-xs bg-red-600 text-white rounded px-2 py-1">Eliminar</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-between">
        <button className="rounded-lg border px-4 py-2">Cancelar</button>
        <button className="rounded-lg bg-emerald-800 text-white px-5 py-2">Confirmar</button>
      </div>
    </section>
    </PageContainer>
  )
}