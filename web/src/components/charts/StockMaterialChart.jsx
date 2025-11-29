import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import api from "../../lib/apiClient";

const COLORS = ["#3B82F6", "#8B5CF6", "#F97316", "#0EA5E9"];

export default function StockMaterialChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api("/api/dashboard/stock-material");
        const payload = res?.data ?? res;

        const fixed = (payload || []).map((r) => ({
          material: r.material,
          cantidad: Number(r.cantidad),
          porcentaje: Number(r.porcentaje),
        }));

        setData(fixed);
      } catch (err) {
        console.error("ERROR STOCK MATERIAL:", err);
      }
    }

    loadData();
  }, []);

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div
          style={{
            background: "#fff",
            border: "1px solid #ddd",
            padding: "8px 12px",
            borderRadius: "8px",
            fontSize: "13px",
          }}
        >
          <strong>{item.material}</strong>
          <div>Cantidad: {item.cantidad}</div>
          <div>Porcentaje: {item.porcentaje}%</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow">
      <h2 className="text-lg font-bold mb-4">Distribución de Stock por Material</h2>

      <ResponsiveContainer width="100%" height={340}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            dataKey="cantidad"
            nameKey="material"
            outerRadius={120}
            label={(entry) => `${entry.material} (${entry.porcentaje}%)`}
          >
            {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} 
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
