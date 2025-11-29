import { useState, useEffect, useCallback } from "react";
import api from "../../lib/apiClient";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

export default function CategoriaChart() {
  const [periodo, setPeriodo] = useState("meses");
  const [origen, setOrigen] = useState("ventas");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const result = await api(
        `/api/dashboard/categoria?periodo=${periodo}&origen=${origen}`
      );
      setData(result || []);
    } catch (err) {
      console.error("Error cargando gráfico:", err);
      setData([]);
    }

    setLoading(false);
  }, [periodo, origen]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="bg-white rounded-2xl border p-5 shadow-sm">
      <h3 className="text-lg font-bold text-emerald-900 mb-4"> Por Categoria</h3>

      {/* FILTROS */}
      <div className="flex gap-3 mb-4">
        <select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="border rounded-md px-3 py-2"
        >
          <option value="dias">Últimos días</option>
          <option value="semanas">Últimas semanas</option>
          <option value="meses">Últimos meses</option>
        </select>

        <select
          value={origen}
          onChange={(e) => setOrigen(e.target.value)}
          className="border rounded-md px-3 py-2"
        >
          <option value="ventas">Ventas</option>
          <option value="compras">Compras</option>
        </select>
      </div>

      {/* CHART */}
      {loading ? (
        <p className="text-slate-500">Cargando...</p>
      ) : data.length === 0 ? (
        <p className="text-slate-500">No hay datos para los filtros seleccionados.</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="cajas" fill="#8B5CF6"  name="Cajas de Embalaje" />
            <Bar dataKey="materiales" fill="#3B82F6" name="Materiales Reciclados" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}