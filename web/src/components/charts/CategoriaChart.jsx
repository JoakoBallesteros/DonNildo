import { useState, useEffect, useCallback } from "react";
import api from "../../lib/apiClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export default function CategoriaChart() {
  const [periodo, setPeriodo] = useState("meses");
  const [origen, setOrigen] = useState("ventas");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- FORMATEO DE LABELS ---
  const formatLabel = (label, periodo) => {
    if (periodo === "semanas") {
      // label viene del backend como: "2025-47"
      const parts = label.split("-");
      const week = parts[1] || label;
      return `Sem ${week}`;
    }
    return label;
  };

  // --- CARGA DE DATOS ---
  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const result = await api(
        `/api/dashboard/categoria?periodo=${periodo}&origen=${origen}`
      );

      // Asegurar orden correcto por label por las dudas
      const sorted = (result || []).sort((a, b) =>
        a.label.localeCompare(b.label)
      );

      setData(sorted);
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
      <h3 className="text-lg font-bold text-emerald-900 mb-4">
        Montos Obtenidos Por Categoria
      </h3>

      {/* FILTROS */}
      <div className="flex gap-3 mb-8">
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
        <p className="text-slate-500">
          No hay datos para los filtros seleccionados.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
           <BarChart 
            data={data}
            margin={{ top: 20, right: 20, left: 20, bottom: 20 }}   // ⭐ deja espacio para el label
          >
            <CartesianGrid strokeDasharray="3 3" />

            {/* EJE X con labels corregidos */}
            <XAxis
              dataKey="label"
              tickFormatter={(label) => formatLabel(label, periodo)}
            />

           <YAxis
            tickFormatter={(v) => v.toLocaleString("es-AR")}   
            width={70}                                       
            tickMargin={10}                                 
            label={{
              value: "Monto ($)",
              angle:0,
              position: "insideLeft",
              dx: -20,                                         
              dy: -143,
              style: { fill: "#155E3B", fontSize: 12, fontWeight: 600 }
            }}
          />
            
            <Tooltip
              formatter={(value, name, props) => {
                const key = props.dataKey; // este SIEMPRE es "cajas" o "materiales"

                const label =
                  key === "cajas"
                    ? "Cajas de Embalaje"
                    : key === "materiales"
                    ? "Materiales Reciclados"
                    : key;

                return [`$${Number(value).toLocaleString("es-AR")}`, label];
              }}
              labelFormatter={(label) => formatLabel(label, periodo)}
            />
            <Legend />

            <Bar dataKey="cajas" fill="#8B5CF6" name="Cajas de Embalaje" />
            <Bar
              dataKey="materiales"
              fill="#3B82F6"
              name="Materiales Reciclados"
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
