import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import api from "../../lib/apiClient";

export default function TopProductosChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await api("/api/dashboard/top-productos");
      setData(res);
    }
    load();
  }, []);

  return (
    <div className="p-6 bg-white rounded-2xl shadow">
      <h2 className="text-lg font-bold mb-4">Top 5 productos más vendidos</h2>

      <ResponsiveContainer width="100%" height={340}>
        <BarChart data={data} layout="vertical" margin={{ left: 15, right: 60 }}>
          <XAxis type="number" 
            tickFormatter={(v) => v.toLocaleString("es-AR")}   // ✔ sin $
            width={70}                                         // ⭐ más espacio para que no se corte
            tickMargin={10}                                    // ⭐ aleja números de la línea
            label={{
              value: "Cantidad",
              angle: 0,
              position: "insideLeft",
              dx: 510,                                         // ⭐ ajusta horizontal
              dy:-13,
              style: { fill: "#155E3B", fontSize: 12, fontWeight: 600 }
            }}
          />
          <YAxis dataKey="producto" type="category" 
           />
          <Tooltip />
          <Bar dataKey="total_cantidad" fill="#F97316" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
