import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import api from "../../lib/apiClient";

export default function PesajesMesChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await api("/api/dashboard/pesajes-mes");

      // 🔥 Convertir kilos a enteros (sin decimales)
      const fixed = res.map((item) => ({
        ...item,
        kilos: Math.round(Number(item.kilos) || 0)
      }));

      setData(fixed);
    }
    load();
  }, []);

  return (
    <div className="p-6 bg-white rounded-2xl shadow">
      <h2 className="text-lg font-bold mb-4">Kilos pesados por material (mes actual)</h2>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart 
          data={data}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          <XAxis dataKey="material" />

          <YAxis
            // 🔥 Mostrar número entero sin formato
            tickFormatter={(v) => Number(v)}
            width={60}
            tickMargin={10}
            label={{
              value: "Kg",
              angle: 0,
              position: "insideLeft",
              dx: -10,
              dy: -125,
              style: { fill: "#155E3B", fontSize: 12, fontWeight: 600 },
            }}
          />

          <Tooltip 
            formatter={(value) => Number(value)} // 🔥 Limpio también en tooltip
          />

          <Bar dataKey="kilos" fill="#34D399" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
