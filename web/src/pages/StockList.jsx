import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageContainer from '../components/pages/PageContainer.jsx'

const pillBase = 'px-4 py-2 rounded-full text-sm font-semibold transition';
const pillOn  = 'bg-emerald-700 text-white shadow';
const pillOff = 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50';

export default function StockList() {
  // "todo" | "cajas" | "productos"
  const [tipo, setTipo] = useState('todo')


  const actions = (
    <>
      {/* 4) Acciones que navegan a las páginas correctas */}
      <Link to="/stock/nuevo-producto" className="px-4 py-2 rounded-xl border text-sm font-semibold hover:bg-slate-50">
        + Nuevo producto
      </Link>
      <Link to="/stock/pesaje" className="px-4 py-2 rounded-xl border text-sm font-semibold hover:bg-slate-50">
        Registrar Pesaje
      </Link>
      <button className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800">
        Modificar Stock
      </button>
    </>
  )

  return (
    <PageContainer title="Stock" actions={actions} noDivider>
      {/* 2) Pills de tipo (como chips arriba) */}
      <div className="mb-5 flex items-center gap-2">
        <button onClick={()=>setTipo('todo')}      className={`${pillBase} ${tipo==='todo'?pillOn:pillOff}`}>Todo</button>
        <button onClick={()=>setTipo('cajas')}     className={`${pillBase} ${tipo==='cajas'?pillOn:pillOff}`}>Cajas</button>
        <button onClick={()=>setTipo('productos')} className={`${pillBase} ${tipo==='productos'?pillOn:pillOff}`}>Productos</button>
      </div>

      {/* 3) Contenedor de filtros (card clara, sin fondo verde) */}
      <div className="mb-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <input className="border rounded-xl px-3 py-2" placeholder="Referencia / material" />
            <select className="border rounded-xl px-3 py-2"><option>Categoría</option></select>
            <select className="border rounded-xl px-3 py-2"><option>Medida</option></select>
            <input  className="border rounded-xl px-3 py-2" placeholder="Fecha desde" />
            <input  className="border rounded-xl px-3 py-2" placeholder="Fecha hasta" />
          </div>
          <div className="mt-3 flex gap-3">
            <button className="bg-emerald-700 text-white rounded-xl px-4 py-2 font-semibold">Aplicar Filtros</button>
            <button className="text-emerald-800 underline text-sm font-medium">Reiniciar filtro</button>
          </div>
        </div>
      </div>

      {/* 5) Header de grilla con color (tenue) */}
      <div className="overflow-auto border border-slate-200 rounded-2xl">
        <table className="min-w-full text-sm">
          <thead className="bg-emerald-50 text-emerald-900">
            <tr className="text-left">
              <th className="p-3 font-semibold">Tipo</th>
              <th className="p-3 font-semibold">Referencia</th>
              <th className="p-3 font-semibold">Categoría</th>
              <th className="p-3 font-semibold">Medida</th>
              <th className="p-3 font-semibold">Disponible (u/kg)</th>
              <th className="p-3 font-semibold">Últ. mov.</th>
              <th className="p-3 font-semibold">Precio unitario</th>
              <th className="p-3 font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t">
              <td className="p-3">Material</td>
              <td className="p-3">Cartón</td>
              <td className="p-3">—</td>
              <td className="p-3">—</td>
              <td className="p-3">200 kg</td>
              <td className="p-3">2025-10-08</td>
              <td className="p-3">$7.000</td>
              <td className="p-3">
                <button className="text-xs bg-emerald-700 text-white rounded px-3 py-1">Modificar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex justify-end">
        <button className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-sm font-semibold">Exportar (Excel/PDF)</button>
      </div>
    </PageContainer>
  )
}