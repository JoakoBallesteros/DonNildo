import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import api from "../../lib/apiClient";

export default function PesajesMesChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await api("/api/dashboard/pesajes-mes");
      setData(res);
    }
    load();
  }, []);

  return (
    <div className="p-6 bg-white rounded-2xl shadow">
      <h2 className="text-lg font-bold mb-4">Kilos pesados por material (mes actual)</h2>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="material" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="kilos" fill="#34D399" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
